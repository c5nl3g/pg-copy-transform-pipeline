export interface SourceDB {}
export interface TargetDB {}

export { defineConfig } from "./config";
export { sourceDB, targetDB } from "./database";
export type { TransformFunction } from "./workers/transform";
