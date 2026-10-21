# PostgreSQL Copy Transform Pipeline

> [!IMPORTANT]
> This project is still in the early stage of development.

## Introduction

A PostgreSQL CLI tool for robust schema migrations and data transformations

## Features

- **⚡ Zero-Memory Overhead Streaming**
- **🚀 Multi-Threaded Data Transformation**
- **🛡️ Type Safety**
- **🔄 Resilient Pipeline Mechanics**
- **✨ Effortless to Use**

## Install

```bash
npm i pg-copy-transform-pipeline
```

## Usage

1. Ensure `package.json` includes `"type": "module"`:

   ```json
   {
     "type": "module"
   }
   ```

2. Create a `.env` file with the following content:

   ```env
   SOURCE_DATABASE_URL=postgresql://
   TARGET_DATABASE_URL=postgresql://
   ```

3. Initialize:

   ```bash
   npx pctp init
   ```

4. Configure your migration pipeline (`pctp.config.ts`):

   Define your source query, target table, and options using `defineConfig`:

   ```typescript
   import { defineConfig } from "pg-copy-transform-pipeline";
   import { sourceDb } from "./db"; // Use Kysely as the query builder - https://play.kysely.dev/

   export default defineConfig({
     // 1. SQL query to fetch data from the source database
     sourceSQL: sourceDb.selectFrom("public.user").selectAll(),

     // 2. Primary key or unique identifier field from the source, used for chunking/cursor pagination
     sourceIdField: "user_id",

     // 3. (Optional) SQL query to compute the total record count (used for progress tracking and chunk evaluation)
     sourceTotalCountSQL: sourceDb
       .selectFrom("public.user")
       .select((eb) => eb.fn.countAll<number>().as("totalCount")),

     // 4. Target database table name (Schema.TableName)
     targetTable: "public.user_transformed",

     // 5. Array of column names to insert into the target table
     targetColumns: ["id", "name"],

     // 6. Number of rows processed and inserted per batch
     batchSize: 1000,

     // 7. Number of automatic retries on batch processing/ingestion failure
     retry: 3,

     // 8. (Optional) Path to a custom transformation module file
     // If data requires cleaning or restructuring, specify the TypeScript file path.
     // It will be processed concurrently inside Node.js Worker Threads.
     transformModule: "./pctp-transform-module.ts",
   });
   ```

   ### (Optional) Custom Transformation Module

   When `transformModule` is defined, export a default function in your script to transform each raw row before writing:

   ```typescript
   // pctp-transform-module.ts
   import type { TransformFunction } from "pg-copy-transform-pipeline";

   const transform: TransformFunction = (input) => {
     return {
       ...input,
     };
   };

   export default transform;
   ```

5. Start the pipeline execution:

   ```bash
   npx pctp start
   ```

   By default, `pctp start` looks for `pctp.config.ts` or `pctp.config.js` and loads `.env` in your root directory.

   You can customize the execution with the following CLI flags:

   ```bash
   npx pctp start --config ./path/to/custom-config.ts --env .env.production
   ```
