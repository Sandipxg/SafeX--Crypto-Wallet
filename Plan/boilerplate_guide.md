# SafeX Boilerplate Specification & AI Reproduction Guide (Phase 0)

This document is a comprehensive, step-by-step blueprint for building the **SafeX Crypto Exchange Wallet** Phase 0 monorepo boilerplate. Any developer or AI coding assistant reading this document can reproduce the exact clean architecture, directory layout, and type-safe data flow established for this repository.

---

## 1. Core Architectural Blueprint

The repository is structured as an **npm/pnpm workspace monorepo** with a **Feature-Driven Subfolder Architecture**.

```text
SafeX---Crypto-Wallet/
├── docker-compose.yml                     # Local PostgreSQL 16 container
├── package.json                           # Root monorepo workspace configuration
├── .gitignore
├── Plan/                                  # Project roadmap & tech stack specs
│   ├── general_todo.md                    # Master 13-Phase TODO Roadmap
│   ├── TechStack.md                       # Technical stack specification
│   ├── Topics.md                          # CS & Cryptography learning roadmap
│   └── boilerplate_guide.md               # [THIS FILE] Phase 0 blueprint
├── packages/
│   └── api/                               # Shared API contracts & type definitions
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts                   # Re-exports AppRouter for type inference
└── apps/
    ├── server/                            # Node.js + Express + oRPC Backend
    │   ├── package.json                   # Includes orchid-orm, rake-db, pg
    │   ├── tsconfig.json
    │   ├── .env.example
    │   └── src/
    │       ├── main.ts                    # Express server entry point (Port 4000)
    │       ├── router.ts                  # Root oRPC appRouter combining features
    │       ├── core/                      # System-wide infrastructure
    │       │   ├── config/env.ts          # Validated environment variables
    │       │   └── db/                    # PostgreSQL & Orchid ORM Core
    │       │       ├── baseTable.ts       # Orchid ORM BaseTable class (`createBaseTable`)
    │       │       ├── db.ts              # Orchid ORM database instance (`orchidORM`)
    │       │       └── client.ts          # Postgres pool & DB health checker
    │       └── features/                  # Feature-Driven Subfolder Modules
    │           └── health/                # [Health Feature Module]
    │               ├── services/
    │               │   └── health.service.ts # DB check & uptime logic
    │               ├── routers/
    │               │   └── health.router.ts  # oRPC procedure `check` handler
    │               └── tests/
    │                   └── health.test.ts    # Vitest unit test suite
    └── web/                               # Next.js App Router Frontend (React)
        ├── package.json
        ├── tsconfig.json
        ├── next.config.mjs
        ├── tailwind.config.ts
        ├── postcss.config.js
        ├── app/
        │   ├── layout.tsx                 # Root layout with Navbar & Dark Theme
        │   ├── page.tsx                   # Main Home dashboard
        │   ├── status/page.tsx            # Live /status route
        │   └── globals.css                # Dark mode CSS tokens
        ├── components/
        │   └── layout/Navbar.tsx          # Top navigation bar
        ├── lib/
        │   └── orpc.ts                    # Single type-safe oRPC client instance
        └── features/                      # Feature-Driven Frontend Modules
            └── health/
                ├── api/
                │   └── health.ts          # Feature API helper calling oRPC
                └── components/
                    └── StatusCard.tsx     # Live status card React component
```

---

## 2. Mandatory Coding Conventions & Design Rules

### Rule A: Feature-Driven Subfolder Structure (Backend)
Every backend domain feature inside `apps/server/src/features/<feature-name>/` MUST organize code into dedicated subfolders:
- `services/`: Business logic, cryptographic math, database queries.
- `routers/`: oRPC procedure handlers using `os.handler()`.
- `tests/`: Vitest unit tests.
- `models/`: Orchid ORM table models (when added in future phases).

*Example Blueprint for Phase 1 Auth*:
```text
apps/server/src/features/auth/
├── services/auth.service.ts
├── routers/auth.router.ts
├── tests/auth.test.ts
└── models/user.table.ts
```

### Rule B: Automatic Type Inference (Zero Manual Duplicate Interfaces)
- The backend exports `export type AppRouter = typeof appRouter` in `apps/server/src/router.ts`.
- `packages/api/src/index.ts` contains **strictly one single line**:
  ```typescript
  export type { AppRouter } from '../../apps/server/src/router'
  ```
- **DO NOT** manually declare duplicate interface types (like `interface HealthResponse`) in `packages/api`. All response shapes are automatically inferred by TypeScript from the backend `AppRouter`!

### Rule C: Type-Safe oRPC Client (Zero Manual `fetch` Boilerplate)
- `apps/web/lib/orpc.ts` configures and exports the single client instance for the entire frontend:
  ```typescript
  import { createORPCClient } from '@orpc/client'
  import { RPCLink } from '@orpc/client/fetch'
  import type { AppRouter } from '@safex/api'

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  export const link = new RPCLink({ url: API_BASE_URL })
  export const orpc = createORPCClient<AppRouter>(link)
  ```
- Feature API helpers (e.g. `apps/web/features/health/api/health.ts`) call `orpc` procedures directly:
  ```typescript
  import { orpc } from '@/lib/orpc'

  export async function fetchHealthStatus() {
    try {
      return await orpc.health.check()
    } catch (error) { ... }
  }
  ```

### Rule D: Clean Endpoint URLs
- Endpoint URLs must be clean and direct without artificial subpath clutter:
  - Backend status: `http://localhost:4000/health`

### Rule E: Orchid ORM Database Architecture
- **BaseTable Setup** (`apps/server/src/core/db/baseTable.ts`):
  ```typescript
  import { createBaseTable } from 'orchid-orm'
  export const BaseTable = createBaseTable({ columnTypes: (t) => ({ ...t }) })
  ```
- **Database Instance** (`apps/server/src/core/db/db.ts`):
  ```typescript
  import { orchidORM } from 'orchid-orm/node-postgres'
  import { config } from '../config/env.js'

  export const db = orchidORM(
    { databaseURL: config.databaseUrl, max: 10, idleTimeoutMillis: 30000 },
    { /* Feature ORM tables registered here */ }
  )
  ```
- **Client & Health Check** (`apps/server/src/core/db/client.ts`):
  Exports `dbPool`, `db`, and `checkDbConnection()`.

---

## 3. Step-by-Step AI Execution Blueprint

When instructing an AI agent to build or reproduce this repository:

1. **Initialize Workspace Root**:
   - Create `package.json` with `"workspaces": ["apps/*", "packages/*"]`.
   - Create `docker-compose.yml` running `postgres:16-alpine` on port `5432` with database `safex_db`, user `safex`, password `safexpassword`.

2. **Build Shared API Contract (`packages/api`)**:
   - Create `packages/api/package.json` and `tsconfig.json`.
   - Create `packages/api/src/index.ts` exporting `export type { AppRouter } from '../../apps/server/src/router'`.

3. **Build Backend Server (`apps/server`)**:
   - Install `orchid-orm`, `rake-db`, `pg`, `express`, `cors`, `dotenv`, `@orpc/server`.
   - Create `apps/server/src/core/config/env.ts` (parsing `PORT=4000`, `DATABASE_URL`).
   - Create `apps/server/src/core/db/baseTable.ts` (`createBaseTable`).
   - Create `apps/server/src/core/db/db.ts` (`orchidORM` database instance).
   - Create `apps/server/src/core/db/client.ts` (`pg` Pool & connection check).
   - Create `apps/server/src/features/health/services/health.service.ts` executing DB query (`SELECT 1`).
   - Create `apps/server/src/features/health/routers/health.router.ts` using `os.handler()`.
   - Create `apps/server/src/features/health/tests/health.test.ts` (Vitest test).
   - Create `apps/server/src/router.ts` exporting `appRouter` and `AppRouter`.
   - Create `apps/server/src/main.ts` Express listener at `http://localhost:4000`.

4. **Build Frontend Web App (`apps/web`)**:
   - Create Next.js 14 App Router project with Tailwind CSS dark mode tokens in `app/globals.css`.
   - Create `apps/web/lib/orpc.ts` exporting `orpc = createORPCClient<AppRouter>(link)`.
   - Create `apps/web/features/health/api/health.ts` executing `await orpc.health.check()`.
   - Create `apps/web/features/health/components/StatusCard.tsx` React component.
   - Create `apps/web/app/status/page.tsx` rendering `<StatusCard />`.

5. **Install & Verify**:
   - Run `npm install` at root.
   - Run `npx vitest run` in `apps/server` to confirm tests pass.
   - Run `docker compose up -d` and `npm run dev` to verify `http://localhost:3000/status`.

---

## 4. Verification Checkpoint

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Run backend tests
npm run test --workspace=apps/server

# 3. Launch frontend & backend dev servers
npm run dev
```
- Open `http://localhost:3000/status` -> Status badges display **API: Healthy, DB: Connected**.
