import { NodeWorker } from "@effect/platform-node";
import { Context, Layer } from "effect";
import { RpcClient } from "effect/rpc";
import { availableParallelism } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { TransformWorkerRpcs } from "./rpc";

declare const __TRANSFORM_WORKER_URL__: string | undefined;

const WorkerLive = (transformModule?: string) =>
  NodeWorker.layer(
    () =>
      new Worker(
        new URL(
          typeof __TRANSFORM_WORKER_URL__ !== "undefined" ? __TRANSFORM_WORKER_URL__ : "./index.ts",
          import.meta.url,
        ),
        {
          workerData: {
            transformModule: transformModule
              ? pathToFileURL(path.resolve(transformModule)).href
              : undefined,
          },
        },
      ),
  );

const ProtocolLive = (transformModule?: string) =>
  RpcClient.layerProtocolWorker({
    size: availableParallelism(),
  }).pipe(Layer.provide(WorkerLive(transformModule)));

export class TransformWorkerClient extends Context.Service<TransformWorkerClient>()(
  "TransformWorkerClient",
  {
    make: RpcClient.make(TransformWorkerRpcs),
  },
) {
  static readonly layer = (transformModule?: string) =>
    Layer.effect(this, this.make).pipe(Layer.provide(ProtocolLive(transformModule)));
}
