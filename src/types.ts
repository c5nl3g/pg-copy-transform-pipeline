import type { ReferenceExpression, SelectQueryBuilder } from "kysely";
import type pg from "pg";

export interface SourceDB {}
export interface TargetDB {}

export interface Config {
  sourceSelectSQL: SelectQueryBuilder<SourceDB, keyof SourceDB, any>;
  sourceTotalCountSQL?: SelectQueryBuilder<
    SourceDB,
    keyof SourceDB,
    {
      totalCount: number;
    }
  >;
  sourceIdField: ReferenceExpression<SourceDB, keyof SourceDB>;
  targetTable: keyof TargetDB;
  targetColumns: ReferenceExpression<TargetDB, keyof TargetDB>[];
  batchSize: number;
  retry: number;
  transformModule?: string; // file URL
}

export type Pools = { source: pg.Pool; target: pg.Pool };
