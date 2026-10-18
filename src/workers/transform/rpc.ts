import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";

export class TransformWorkerError extends Schema.TaggedError<
  TransformWorkerError,
  { readonly brand: unique symbol }
>()("TransformWorkerError", {
  message: Schema.String,
  cause: Schema.Unknown.pipe(Schema.optionalKey),
}) {}
export class TransformWorkerRpcs extends RpcGroup.make(
  Rpc.make("transform", {
    payload: {
      input: Schema.Record(Schema.String, Schema.Any),
    },
    success: Schema.Record(Schema.String, Schema.Any),
    error: TransformWorkerError,
  }),
) {}
