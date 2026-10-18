import { NodeWorkerRunner } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";
import { workerData } from "node:worker_threads";
import { TransformWorkerError, TransformWorkerRpcs } from "./rpc";

export type TransformFunction = (input: Record<string, any>) => Record<string, any>;

const loadTransformModule: Effect.Effect<TransformFunction, TransformWorkerError, never> =
  Effect.gen(function* () {
    const modulePath = (workerData as { transformModule?: string } | null)?.transformModule;
    if (!modulePath) return (x: Record<string, any>) => x;

    const mod = yield* Effect.tryPromise({
      try: () => import(modulePath),
      catch: (e) =>
        new TransformWorkerError({ message: `failed to load transform module`, cause: e }),
    });

    if (typeof mod.default !== "function") {
      return yield* new TransformWorkerError({
        message: `${modulePath} must default-export a function`,
      });
    }
    return mod.default as TransformFunction;
  });

const HandlersLive = TransformWorkerRpcs.toLayer(
  Effect.gen(function* () {
    const transformFunction = yield* loadTransformModule;
    return {
      transform: ({ input }) => Effect.promise(async () => transformFunction(input)),
    };
  }),
);

const ProtocolLive = RpcServer.layerProtocolWorkerRunner.pipe(
  Layer.provide(NodeWorkerRunner.layer),
);

const MainLive = RpcServer.layer(TransformWorkerRpcs).pipe(
  Layer.provide([HandlersLive, ProtocolLive]),
);

Layer.launch(MainLive).pipe(Effect.runFork);
