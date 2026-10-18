import {
  Kysely,
  DummyDriver,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";

import type { SourceDB, TargetDB } from "~/types";

function createBuilder<DB>() {
  return new Kysely<DB>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (db: Kysely<any>) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });
}

export const sourceDB = createBuilder<SourceDB>();
export const targetDB = createBuilder<TargetDB>();
