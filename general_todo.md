# SafeX Crypto Exchange & Wallet Master TODO

This document tracks both the concepts to learn and the implementation progress for the SafeX Crypto Exchange & Wallet project. 
Execution follows the parallel **Learn & Build** methodology.

---

# 🏗️ Phase 0: Base Project Setup & Infrastructure

## Learn

- [ ] Node.js + TypeScript project workspace configuration & tsconfig strict mode
- [ ] PostgreSQL + Orchid ORM schema design & migration workflows
- [ ] oRPC server setup & type inference mechanics
- [ ] Redis client setup & connection pooling
- [ ] Docker Compose orchestration for local development services

## Build

- [ ] Initialize TypeScript workspace & scripts
- [ ] Setup Docker Compose file for PostgreSQL, Redis, and Kafka
- [ ] Connect Orchid ORM to PostgreSQL database & run initial health migration
- [ ] Initialize oRPC server with basic healthcheck router
- [ ] Setup Redis client connection module

---

# 🔐 Phase 1: Cryptographic Primitives & Key Management Core

## Learn

- [ ] CSPRNG & Entropy collection (`node:crypto` & Web Crypto API)
- [ ] Hash functions & HMAC (SHA-256, Keccak-256, RIPEMD-160)
- [ ] Elliptic Curve math & `secp256k1` keypair derivation
- [ ] BIP39 Mnemonic specification & checksum calculation from entropy
- [ ] BIP32 HD Wallet Extended Keys (`xprv`/`xpub`) & Hardened Derivation
- [ ] BIP44 Derivation Paths (`m/44'/60'/0'/0/0`)
- [ ] EIP-55 EVM Checksum Address & Bitcoin Bech32/P2PKH generation
- [ ] Symmetric Secret Encryption at rest using AES-256-GCM + PBKDF2/scrypt

## Build

- [ ] Cryptographic Randomness & Entropy utility module
- [ ] BIP39 Mnemonic generator & validator (`bip39`)
- [ ] BIP32 Master Seed & HD Key Derivation tree module (`bip32`)
- [ ] Multi-chain address generator (EVM EIP-55 & Bitcoin Bech32)
- [ ] Key Vault encryption module (encrypting/decrypting private keys with AES-256-GCM)

---

# 📡 Phase 2: Transaction Building, Signing & RPC Node Interactivity

## Learn

- [ ] Raw EVM transaction serialization (RLP & EIP-1559 typed transaction fields)
- [ ] ECDSA Digital Signatures (`v, r, s` signing & verification via `@noble/secp256k1`)
- [ ] JSON-RPC Protocol specification & methods (`eth_call`, `eth_sendRawTransaction`, `eth_estimateGas`)
- [ ] Nonce tracking mechanics & sequence management
- [ ] `viem` low-level transport & client configuration

## Build

- [ ] Raw EVM transaction builder & serializer module
- [ ] Off-line transaction signer (`secp256k1` / `@noble/secp256k1`)
- [ ] JSON-RPC provider client connected to local testnet (Hardhat/Anvil)
- [ ] Gas fee estimator (`maxFeePerGas`, `maxPriorityFeePerGas`)
- [ ] Transaction broadcaster & receipt confirmation tracker

---

# ⛓️ Phase 3: Blockchain Event Indexer & Reorg Handling

## Learn

- [ ] RPC Block polling vs WebSocket log subscription
- [ ] Event Log decoding using Contract ABI
- [ ] Blockchain Reorganizations (Reorgs) & block confirmation depth
- [ ] Idempotency & duplicate event filtering strategies

## Build

- [ ] Block Scanner service polling new blocks from node
- [ ] Event Log Indexer for ERC20 `Transfer` events
- [ ] Block Reorg detector & transaction rollback state handler
- [ ] PostgreSQL event persistence schema using Orchid ORM

---

# 🚜 Phase 4: Hot Wallet Operations & Automated Sweeping Engine

## Learn

- [ ] Hot Wallet vs Cold Storage Vault architecture
- [ ] Gas Tank auto-refueling strategy (sub-funding user deposit addresses for gas)
- [ ] Deposit Sweeping consolidation & transaction batching
- [ ] Nonce gap handling & RBF (Replace-By-Fee) / transaction speed-ups
- [ ] BullMQ async job queues & worker pools

## Build

- [ ] User Deposit Address pool & Master Hot Wallet schema
- [ ] BullMQ Gas Tank auto-refuel worker queue
- [ ] BullMQ Deposit Sweeping worker queue (consolidating deposit funds to main vault)
- [ ] Stuck transaction monitor with automated RBF replacement

---

# ⚖️ Phase 5: Double-Entry Ledger System & Balance Locking

## Learn

- [ ] Double-entry bookkeeping concepts (Assets, Liabilities, Equity, Debits/Credits)
- [ ] Immutability & Audit Trail design for balance ledgers
- [ ] Balance state isolation (Available vs Locked vs Reserved balances)
- [ ] PostgreSQL ACID transactions & Row-level Locking (`SELECT FOR UPDATE`)
- [ ] Precision math standards using `BigInt` / `NUMERIC` types

## Build

- [ ] User Balance schema & Double-Entry Ledger schema (Orchid ORM)
- [ ] Atomic Deposit crediting & Withdrawal debiting procedures
- [ ] Balance locking service for active orders/withdrawals
- [ ] Automated internal ledger balance consistency auditor

---

# ⚡ Phase 6: Matching Engine & Trade Settlement

## Learn

- [ ] In-memory Order Book data structures (B-Trees / SkipLists for Price-Time Priority)
- [ ] Order Types (Limit, Market, Stop-Limit, IOC, FOK)
- [ ] Partial Fill execution logic
- [ ] Apache Kafka event streaming for match logs & trade settlement

## Build

- [ ] In-Memory Order Book engine (Price-Time Priority queue)
- [ ] Order placement & cancellation oRPC endpoints
- [ ] Kafka event producer for trade matches
- [ ] Trade Settlement engine consuming Kafka match events
- [ ] Ledger settlement integration (atomic balance updates for buyer & seller)

---

# 🔍 Phase 7: Automated Reconciliation & Proof of Reserves

## Learn

- [ ] On-chain balance vs Off-chain database balance auditing
- [ ] Automated circuit breakers & auto-halt guardrails
- [ ] Merkle Tree Proof of Reserves (PoR) & solvency verification

## Build

- [ ] Automated daily reconciliation worker comparing DB balances with RPC live vault balances
- [ ] Emergency circuit breaker system (halting withdrawals on balance drift detection)
- [ ] Merkle-tree generator for user Solvency Proofs (PoR API)

---

# 🛡️ Phase 8: Enterprise Security, Key Custody & System Observability

## Learn

- [ ] AWS KMS / GCP KMS / HashiCorp Vault key management integration
- [ ] Threshold Signature Schemes (TSS) & Shamir's Secret Sharing (SSS)
- [ ] Rate limiting, DDoS protection & API Authentication (JWT, Passkeys, TOTP MFA)
- [ ] System observability (Prometheus, Grafana metrics)

## Build

- [ ] KMS integration for hot wallet private key signing
- [ ] Redis-backed rate limiter middleware & Auth guards for oRPC
- [ ] Prometheus metrics endpoint for deposit/withdrawal queue health & order engine latency
