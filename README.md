# 🛡️ SafeX — Next-Gen Crypto Wallet & Exchange Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![oRPC](https://img.shields.io/badge/API-oRPC-purple.svg)](https://orpc.unjs.io/)
[![Argon2id](https://img.shields.io/badge/KDF-Argon2id-red.svg)](https://phc.winner)
[![AES-256-GCM](https://img.shields.io/badge/Vault-AES--256--GCM-green.svg)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SafeX** is a high-performance, non-custodial crypto exchange and wallet platform built with an enterprise-grade monorepo architecture. It combines a zero-trust client-side encrypted vault, multi-chain address derivation (EVM + Bitcoin Native SegWit), real-time trading dashboards, double-entry accounting ledgers, and end-to-end type safety.

---

## 🔐 Zero-Trust Client Cryptographic Vault Architecture

SafeX features a **non-custodial, client-side encrypted vault** where seed phrases and private keys never touch the backend server. All cryptographic operations occur exclusively in local browser memory.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (RAM & Local)                     │
│                                                                        │
│  [ Mnemonic (RAM) ] ──► [ Seed (RAM) ] ──► [ Multi-Chain Identity ]    │
│                                            ├── EVM  (0x...)            │
│                                            └── BTC  (bc1q...)          │
│                                                                        │
│  [ Password ] ──► [ Argon2id KDF (64MB) ] ──► [ AES-256-GCM Encrypt ] │
│                                                          │             │
│                                                          ▼             │
│                                           [ IndexedDB Vault Record ]   │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   =======================================
                                          TRUST & SECURITY BOUNDARY
                                   =======================================
                                   │ (Public Addresses & Public Keys Only)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Node.js & Postgres)              │
│                                                                        │
│   oRPC Auth Router ──► JWT (HttpOnly Cookie) ──► DB User/Wallet Record │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Security Features:
* **Memory-Hard Key Derivation**: User password is key-derived using **Argon2id** ($m=64\text{MB}$, $t=3$, $p=1$) via `@noble/hashes` to eliminate GPU/ASIC brute-forcing.
* **AES-256-GCM Authenticated Encryption**: Plaintext seed phrases are encrypted using AES-256-GCM with a 12-byte random IV (`entropy.ts`) and a 16-byte Galois Field (`authTag`) tamper-proof security seal.
* **RAM Memory Zeroization**: Active byte buffers in RAM are actively zeroized (`buffer.fill(0)` in `memory.ts`) immediately after encryption/decryption and on 10-minute idle auto-lock timeout.
* **IndexedDB Persistence**: Binary vault payloads (`salt`, `iv`, `authTag`, `ciphertext`) are stored locally in IndexedDB (`safex_db`) without blocking main thread UI.

---

## 🌐 Multi-Chain Address Derivation

SafeX supports multi-chain HD address derivation from a single 12/24-word BIP39 seed phrase:

| Chain / Network | Path Standard | Derivation Path | Address Format | Hash & Encoding |
| :--- | :--- | :--- | :--- | :--- |
| **Ethereum & EVM** | BIP-44 | `m/44'/60'/0'/0/0` | `0x...` (40 hex chars) | `Keccak256` + EIP-55 |
| **Bitcoin (SegWit)** | BIP-84 | `m/84'/0'/0'/0/0` | `bc1q...` (42 chars) | `HASH160` (SHA-256 + RIPEMD-160) + Bech32 |

* **EVM Compatibility**: Works seamlessly across Ethereum, Polygon, Arbitrum, Base, Optimism, and BNB Smart Chain.
* **Bitcoin Native SegWit**: Produces lowest-fee BIP-84 `bc1q...` Bech32 addresses using `@scure/bip32` and `@scure/base`.

---

## 📐 Monorepo Architecture

SafeX is structured as an `npm` workspace monorepo divided into applications and shared packages:

```text
SafeX---Crypto-Wallet/
├── apps/
│   ├── web/            # Next.js 14 Frontend Application & Vault Core (Port 3000)
│   └── server/         # Express + Node.js API Server with Orchid ORM (Port 4000)
├── packages/
│   └── api/            # Shared oRPC API procedure contracts & schemas
├── Plan/               # Architectural specifications & technical roadmaps
└── docker-compose.yml  # Local infrastructure services (PostgreSQL 16)
```

### Application Packages

* **`@safex/web`** (`apps/web`): Next.js App Router UI featuring Tailwind CSS, Lucide icons, Zustand RAM store, IndexedDB vault storage, and real-time state synchronization via `oRPC` client.
* **`@safex/server`** (`apps/server`): Express backend powered by `Orchid ORM` & PostgreSQL, running type-safe RPC procedures and database migrations.
* **`@safex/api`** (`packages/api`): Shared contract package exposing procedure definitions to ensure end-to-end type safety.

---

## ⚡ Technology Stack

| Layer | Technology | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend Framework** | `Next.js 14` + `React 18` | App router layout, server & client components |
| **Styling & UI** | `Tailwind CSS` + `Lucide React` | Responsive dark-mode trading & vault interface |
| **API Transport** | `oRPC` (Client & Server) | End-to-end type-safe RPC communication |
| **Backend Runtime** | `Node.js` + `Express` + `TypeScript` | Business logic, session cookies, auth router |
| **Database & ORM** | `PostgreSQL 16` + `Orchid ORM` | ACID transaction storage, user wallet records |
| **Crypto & Vault Core** | `@noble/hashes` + `@scure/bip32` + `@scure/base` + `viem` | Argon2id KDF, AES-256-GCM, BIP39, BIP84, RAM zeroization |
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
* 🌐 **Frontend UI & Vault**: [http://localhost:3000](http://localhost:3000)
* ⚙️ **API Server**: [http://localhost:4000](http://localhost:4000)
* 🩺 **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## 🧪 Available Scripts & Testing

Run these scripts from the workspace root:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs all apps (`apps/*`) in development mode with live reloading |
| `npm run build` | Compiles TypeScript across all workspace packages and apps |
| `npm run test` | Executes test suites across all packages (using `Vitest`) |
| `npm run test --workspace=@safex/web` | Runs client cryptographic test suite (`bip39`, `vault`, `btc` BIP-84) |
| `npm run db:up` | Starts the PostgreSQL Docker container (`safex-postgres`) |
| `npm run db:down` | Stops and removes the PostgreSQL Docker container |

---

## 🔒 Engineering Principles & Safety Rules

1. **Zero-Trust Client Boundary**:
   * Seed phrases, private keys, and Argon2id keys remain strictly on the user's client device. Only public wallet addresses are registered with the backend server.

2. **RAM Zeroization Protocol**:
   * All active byte arrays in memory are actively zeroized (`buffer.fill(0)`) upon completion of cryptographic operations or on vault lock/timeout.

3. **Numeric Precision Rule**:
   * Cryptocurrency balances and amounts are stored using PostgreSQL `NUMERIC` / `DECIMAL` types. Floating-point math is strictly banned for currency calculations.

4. **End-to-End Type Safety**:
   * API procedures are defined once in `packages/api` using `oRPC` schemas and consumed directly by the web frontend and server implementation.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

