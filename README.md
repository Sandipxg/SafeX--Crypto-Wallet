# 🛡️ SafeX — Next-Gen Crypto Wallet & Exchange Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![oRPC](https://img.shields.io/badge/API-oRPC-purple.svg)](https://orpc.unjs.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SafeX** is a high-performance, type-safe crypto exchange and wallet platform built with an enterprise-grade monorepo architecture. It features real-time trading dashboards, robust wallet operations, double-entry accounting ledgers, and end-to-end type safety between client and server.

---

## 📐 Monorepo Architecture

SafeX is structured as an `npm` workspace monorepo divided into applications and shared packages:

```text
SafeX---Crypto-Wallet/
├── apps/
│   ├── web/            # Next.js 14 Frontend Application (Port 3000)
│   └── server/         # Express + Node.js API Server with Orchid ORM (Port 4000)
├── packages/
│   └── api/            # Shared oRPC API procedure contracts & schemas
├── Plan/               # Architectural specifications & technical roadmaps
└── docker-compose.yml  # Local infrastructure services (PostgreSQL 16)
```

### Application Packages

* **`@safex/web`** (`apps/web`): Next.js App Router UI featuring Tailwind CSS, Lucide icons, and real-time state synchronization via `oRPC` client.
* **`@safex/server`** (`apps/server`): Express backend powered by `Orchid ORM` & PostgreSQL, running type-safe RPC procedures and database migrations.
* **`@safex/api`** (`packages/api`): Shared contract package exposing procedure definitions to ensure end-to-end type safety.

---

## ⚡ Technology Stack

| Layer | Technology | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend Framework** | `Next.js 14` + `React 18` | App router layout, server & client components |
| **Styling & UI** | `Tailwind CSS` + `Lucide React` | Responsive dark-mode trading interface |
| **API Transport** | `oRPC` (Client & Server) | End-to-end type-safe RPC communication |
| **Backend Runtime** | `Node.js` + `Express` + `TypeScript` | Business logic, authentication, service layer |
| **Database & ORM** | `PostgreSQL 16` + `Orchid ORM` | ACID transaction storage, migrations, double-entry ledger |
| **Crypto & Security** | `viem` + `@noble/secp256k1` + `bip39`/`bip32` | Native key derivation, cryptographic signatures, EVM RPC |
| **Infrastructure** | `Docker Compose` | Local PostgreSQL service management |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) `>= 20.0.0`
* [npm](https://www.npmjs.com/) `>= 10.0.0`
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local database)

---

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sandipxg/SafeX---Crypto-Wallet.git
   cd SafeX---Crypto-Wallet
   ```

2. **Install workspace dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file inside `apps/server/` based on the example:
   ```bash
   cp apps/server/.env.example apps/server/.env
   ```

   Default configuration (`apps/server/.env`):
   ```env
   PORT=4000
   NODE_ENV=development
   DATABASE_URL=postgresql://safex:safexpassword@localhost:5435/safex_db
   CORS_ORIGIN=http://localhost:3000
   ```

---

### Running Database Infrastructure

Start the PostgreSQL database container in background mode:

```bash
npm run db:up
```

* **Host**: `localhost`
* **Port**: `5435`
* **User**: `safex`
* **Password**: `safexpassword`
* **Database**: `safex_db`

To stop the database container:
```bash
npm run db:down
```

---

### Running Development Servers

Start all applications (`@safex/web` and `@safex/server`) concurrently in development mode:

```bash
npm run dev
```

Once running:
* 🌐 **Frontend UI**: [http://localhost:3000](http://localhost:3000)
* ⚙️ **API Server**: [http://localhost:4000](http://localhost:4000)
* 🩺 **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## 🧪 Available Scripts

Run these scripts from the workspace root:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs all apps (`apps/*`) in development mode with live reloading |
| `npm run build` | Compiles TypeScript across all workspace packages and apps |
| `npm run test` | Executes test suites across all packages (using `Vitest`) |
| `npm run db:up` | Starts the PostgreSQL Docker container (`safex-postgres`) |
| `npm run db:down` | Stops and removes the PostgreSQL Docker container |

---

## 🔒 Engineering Principles & Safety Rules

1. **Numeric Precision Rule**:
   * Cryptocurrency balances and amounts are stored using PostgreSQL `NUMERIC` / `DECIMAL` types.
   * Floating-point numbers are strictly avoided in math operations. Values map directly to `BigInt` or high-precision decimal objects to eliminate rounding errors.

2. **Double-Entry Balance Locking**:
   * Deductions, trades, and balance updates are wrapped inside explicit PostgreSQL transactions (`BEGIN ... COMMIT`) via Orchid ORM to enforce strict double-entry ledger invariants.

3. **End-to-End Type Safety**:
   * API endpoints and payloads are defined once in `packages/api` using `oRPC` schemas and consumed directly by the web frontend and server implementation.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
