# Crypto Exchange & Wallet Tech Stack Specification

This document details the selected technical stack, core libraries, and architectural principles for building the SafeX Crypto Exchange Wallet system.

---

## 1. Stack Overview

| Layer | Chosen Technology | Primary Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | `React` + `TypeScript` + `Zustand` + `Tailwind CSS` | Responsive, real-time trading dashboard & wallet UI |
| **Type-Safe API** | `oRPC` (Client & Server) | End-to-end type-safe RPC communication between client and server |
| **Backend Service** | `Node.js` + `TypeScript` | Business logic, authentication, wallet APIs, and service layer |
| **Database & ORM** | `PostgreSQL` + `Orchid ORM` | ACID transaction storage for users, balances, and double-entry ledger |
| **Caching & Pub/Sub** | `Redis` | High-speed ticker pub/sub, rate limiting, and session cache |
| **Job Queues** | `BullMQ` (Redis-backed) | Async deposit sweeping, gas refueling, and withdrawal execution jobs |
| **Event Streaming** | `Apache Kafka` | Real-time event sourcing for order matching and audit logs |
| **Crypto Primitives** | `viem` / `@noble/secp256k1` / `bip39` / `bip32` / `Web Crypto API` | Native key derivation, cryptographic signatures, and RPC transport |

---

## 2. Layer-by-Layer Architecture

### 2.1 Frontend Layer
* **Framework**: React 18+ with TypeScript (Strict Mode)
* **Styling**: Tailwind CSS for dark-mode trading UI
* **Client State**: Zustand (for high-frequency WebSocket updates without excessive re-renders)
* **API Client**: `oRPC` Client for type-safe queries and mutations
* **Charts**: TradingView Lightweight Charts (for real-time OHLCV candlestick graphs)

### 2.2 Backend Service Layer
* **Runtime**: Node.js with TypeScript
* **API Layer**: `oRPC` Server
* **Authentication**: JWT + Passkeys (WebAuthn) + TOTP Multi-Factor Authentication
* **WebSockets**: Native `ws` for real-time order book feed broadcasts

### 2.3 Database & Storage Layer
* **Primary Database**: PostgreSQL
* **ORM**: Orchid ORM (High-performance SQL builder with full TypeScript inference)
* **Data Precision Standards**:
  - Always store crypto values in PostgreSQL using `NUMERIC` / `DECIMAL` types.
  - Map numbers to native JavaScript `BigInt` or `bignumber.js` to eliminate floating-point rounding errors.

### 2.4 Cache, Messaging & Async Workers
* **Redis**: Session storage, API rate limiting, and pub/sub channels.
* **BullMQ**: Asynchronous background queues for deposit sweeping, auto-refueling gas tanks, and withdrawal retries.
* **Kafka**: Distributed event streaming for order match logs, trade settlement, and audit trails.

### 2.5 Crypto & Security Libraries
* **EVM & Smart Contracts**: `viem` (Type-safe EVM library)
* **Low-Level Cryptography**: `@noble/secp256k1` (Audited, fast secp256k1 signature operations)
* **Mnemonic & HD Key Derivation**: `bip39` & `bip32`
* **Local Web Security**: Browser `Web Crypto API` (`crypto.subtle`) for client-side entropy and local secret encryption.

---

## 3. Key Architecture & Safety Rules

1. **Numeric Precision Rule**: Never convert cryptocurrency amounts to standard JavaScript `Number` types. Always process them as `BigInt` or `bignumber.js`.
2. **Explicit Balance Locking**: Wrap order placement balance deductions inside PostgreSQL explicit transactions (`BEGIN ... COMMIT`) using Orchid ORM to enforce strict double-entry ledger invariants.
3. **Concurrency Control**: Use Redis distributed locks (`redlock`) or database row locks (`SELECT FOR UPDATE`) on hot wallet signing addresses to prevent nonce collisions.
