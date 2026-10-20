import { parse } from "csv-parse";
import { stringify } from "csv-stringify";
import { Data, Effect, Schedule } from "effect";
import { sql as kSql } from "kysely";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import pg from "pg";
import { from as copyFrom, to as copyTo } from "pg-copy-streams";
import { TransformWorkerClient } from "./workers/transform/client";

import type { PctpConfig, Pools } from "./types";

class PipelineError extends Data.TaggedError("PipelineError")<{
  readonly cause: unknown;
}> {}

const CHECKPOINT_FILE = "./checkpoint.json";

const readCheckpoint = Effect.tryPromise(async () => {
  const raw = await readFile(CHECKPOINT_FILE, "utf8");
  return JSON.parse(raw).lastId as string | number;
}).pipe(Effect.orElseSucceed((): string | number | undefined => undefined));

const writeCheckpoint = (lastId: string | number) =>
  Effect.tryPromise(() => writeFile(CHECKPOINT_FILE, JSON.stringify({ lastId })));

const clearCheckpoint = () => Effect.tryPromise(() => unlink(CHECKPOINT_FILE));

const makePool = (connectionString: string) =>
  Effect.acquireRelease(
    Effect.sync(() => new pg.Pool({ connectionString })),
    (pool) => Effect.promise(() => pool.end()),
  );

const leaseClient = (pool: pg.Pool) =>
  Effect.acquireRelease(
    Effect.tryPromise(() => pool.connect()),
    (client, exit) => Effect.sync(() => client.release(exit._tag === "Failure" ? true : undefined)),
  );

const buildSourceSql = (options: PctpConfig, lastId?: string | number) => {
  let query = options.sourceSelectSQL
    .orderBy(options.sourceIdField, "asc")
    .limit(kSql.lit(options.batchSize));

  if (lastId !== undefined) {
    query = query.where(options.sourceIdField, ">", kSql.lit(lastId));
  }

  const { sql } = query.compile();
  return sql;
};

const copyBatchAttempt = (pools: Pools, options: PctpConfig, lastId?: string | number) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("yield* source client");
    const source = yield* leaseClient(pools.source);
    yield* Effect.logInfo("yield* target client");
    const target = yield* leaseClient(pools.target);

    yield* Effect.logInfo("yield* transform worker client");
    const transformClient = yield* TransformWorkerClient;
    const workerServices = yield* Effect.context<TransformWorkerClient>();
    const runPromiseWithWorkerServices = Effect.runPromiseWith(workerServices);

    let count = 0;
    let newLastId: string | number | undefined = lastId;

    const track = new Transform({
      objectMode: true,
      transform(record, _encoding, callback) {
        count++;
        newLastId = record[options.sourceIdField as any];
        callback(null, record);
      },
    });

    const transformStage = async function* (input: AsyncIterable<unknown>) {
      yield* Readable.from(input).map(
        (record) => runPromiseWithWorkerServices(transformClient.transform({ input: record })),
        { concurrency: availableParallelism() },
      );
    };

    const copyToSql = `COPY (${buildSourceSql(options, lastId)}) TO STDOUT WITH (FORMAT csv, HEADER true)`;
    yield* Effect.logInfo("COPY TO SQL", copyToSql);

    // oxlint-disable-next-line typescript/no-base-to-string typescript/restrict-template-expressions
    const copyFromSql = `COPY ${options.targetTable} (${options.targetColumns.map((c) => `"${c}"`).join(", ")}) FROM STDIN WITH (FORMAT csv)`;
    yield* Effect.logInfo("COPY FROM SQL", copyFromSql);

    yield* Effect.logInfo("Target database query: BEGIN");
    yield* Effect.tryPromise(() => target.query("BEGIN"));

    yield* Effect.logInfo("Pipeline begin...");
    yield* Effect.tryPromise({
      try: (signal) =>
        pipeline(
          source.query(copyTo(copyToSql)),
          parse({ columns: true, bom: true, skip_empty_lines: true }),
          track,
          transformStage,
          stringify({ columns: options.targetColumns as any, quoted_empty: true }),
          target.query(copyFrom(copyFromSql)),
          { signal },
        ),
      catch: (cause) => new PipelineError({ cause }),
    });

    yield* Effect.logInfo("Target database query: COMMIT");
    yield* Effect.tryPromise(() => target.query("COMMIT"));

    return { count, lastId: newLastId };
  }).pipe(Effect.scoped);

const retryPolicy = (retry: number) =>
  Schedule.exponential("1 second").pipe(
    Schedule.jittered,
    Schedule.upTo({ times: retry }),
    Schedule.tap(({ attempt, input }) =>
      Effect.logError(`Retry #${attempt}: batch attempt failed: ${String(input)}`),
    ),
  );

const copyBatch = (pools: Pools, options: PctpConfig, lastId?: string | number) =>
  copyBatchAttempt(pools, options, lastId).pipe(
    Effect.tapError((e) => Effect.logError(`batch attempt failed: ${String(e)}`, e.cause)),
    Effect.retry(retryPolicy(options.retry)),
  );

const copyAll = (pools: Pools, options: PctpConfig) =>
  Effect.gen(function* () {
    let lastId = yield* readCheckpoint; // undefined => start from the beginning
    let totalProcessed = 0;
    let totalCount: number | undefined = undefined;

    if (options.sourceTotalCountSQL) {
      const totalCountSQL = (
        lastId !== undefined
          ? options.sourceTotalCountSQL.where(options.sourceIdField, ">", kSql.lit(lastId))
          : options.sourceTotalCountSQL
      ).compile().sql;
      yield* Effect.logInfo("total count SQL:", totalCountSQL);
      const source = yield* leaseClient(pools.source);
      const result = yield* Effect.promise(() => source.query(totalCountSQL));
      totalCount = Number(result.rows[0].totalCount);
      yield* Effect.logInfo("total count:", totalCount);
    }

    while (true) {
      const batch = yield* copyBatch(pools, options, lastId);
      if (batch.count === 0) {
        // no more rows
        yield* Effect.logInfo("batch count === 0");
        break;
      }

      lastId = batch.lastId;
      totalProcessed += batch.count;

      yield* Effect.logInfo("writing checkpoint...");
      yield* writeCheckpoint(lastId as string | number);

      yield* Effect.logInfo({ batchProcessed: batch.count, totalProcessed, lastId, totalCount });
    }

    yield* clearCheckpoint();

    return totalProcessed;
  });

export const mainEffect = (
  options: { sourceDatabaseUrl: string; targetDatabaseUrl: string } & PctpConfig,
) =>
  Effect.gen(function* () {
    const pools: Pools = {
      source: yield* makePool(options.sourceDatabaseUrl),
      target: yield* makePool(options.targetDatabaseUrl),
    };
    return yield* copyAll(pools, options);
  }).pipe(Effect.scoped, Effect.provide(TransformWorkerClient.layer(options.transformModule)));
