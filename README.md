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

4. Start:

   ```bash
   npx pctp start
   ```
