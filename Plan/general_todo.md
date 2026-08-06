# SafeX Crypto Exchange & Wallet Master TODO

This document tracks both the concepts to learn and the implementation progress for the SafeX Crypto Exchange & Wallet project. 
Execution follows the parallel **Learn & Build** methodology, mapping 1-to-1 with `Plan/Topics.md`.

---

# 🏗️ Phase 0: Computer Science & Low-Level Foundations

## Learn

- [ ] Number Systems (Binary, Hexadecimal, Base58, Base64)
- [ ] Data Representation (Bits, Bytes, Endianness, UTF-8, Unicode)
- [ ] Networking Protocols (HTTP/S, TCP, WebSockets, TLS, DNS)
- [ ] Operating System Primitives (Processes, Threads, Memory, File Systems, Scheduling)
- [ ] Node.js + TypeScript project workspace configuration & tsconfig strict mode
- [ ] PostgreSQL + Orchid ORM schema design & migration workflows
- [ ] oRPC server setup & type inference mechanics
- [ ] Redis client setup & connection pooling
- [ ] Docker Compose orchestration for local development services

## Build

- [ ] Initialize TypeScript workspace & build scripts
- [ ] Setup Docker Compose file for PostgreSQL, Redis, and Kafka
- [ ] Connect Orchid ORM to PostgreSQL database & run initial health migration
- [ ] Initialize oRPC server with basic healthcheck router
- [ ] Setup Redis client connection module

---

# 🔐 Phase 1: Applied Cryptography & Key Derivation Core

## Learn

- [ ] CSPRNG & Entropy collection (`node:crypto` & Web Crypto API)
- [ ] Encoding Schemes (Hex, Base64, Base58, Base58Check, Bech32, UTF-8, ASCII)
- [ ] Hash functions & HMAC (SHA-256, Keccak-256, RIPEMD-160, Blake2/3)
- [ ] Symmetric Encryption (AES-256-GCM, AES-CBC, IV, Nonces, Key Derivation)
- [ ] Password Security & Hashing (PBKDF2, scrypt, Argon2, bcrypt, Salt/Pepper)
- [ ] Elliptic Curve math (secp256k1, Ed25519, Curve25519, Scalar Multiplication)
- [ ] Digital Signatures (ECDSA, Schnorr, EdDSA, Recoverable Signatures)
- [ ] Key Exchange & Shared Secrets (ECDH, Diffie-Hellman)
- [ ] Merkle Trees & Cryptographic Inclusion Proofs
- [ ] BIP39 Mnemonic specification & checksum calculation from entropy
- [ ] BIP32 HD Wallet Extended Keys (`xprv`/`xpub`) & Hardened Derivation
- [ ] BIP44 Multi-Chain Derivation Paths (`m/44'/60'/0'/0/0`)
- [ ] Address Formats (EVM EIP-55 Checksum, Bitcoin P2PKH/P2SH/Bech32/Taproot)

## Build

- [ ] Cryptographic Randomness & Entropy utility module
- [ ] BIP39 Mnemonic generator & validator (`bip39`)
- [ ] BIP32 Master Seed & HD Key Derivation tree module (`bip32`)
- [ ] Multi-chain address generator (EVM EIP-55 & Bitcoin Bech32/Taproot)
- [ ] Key Vault encryption module (encrypting/decrypting private keys with AES-256-GCM + PBKDF2/scrypt)
- [ ] Merkle Tree generator & inclusion proof verifier module

---

# 📡 Phase 2: Transaction Building, Signing & RPC Interactivity

## Learn

- [ ] Core Blockchain Architecture (Blocks, Headers, Transactions, Serialization)
- [ ] Account vs UTXO State Models (UTXO selection, Change addresses vs EVM Accounts)
- [ ] Consensus Mechanisms (PoW, PoS, Validators, Difficulty, Finality)
- [ ] Raw EVM transaction serialization (RLP & EIP-1559 typed transaction fields)
- [ ] ECDSA Digital Signatures (`v, r, s` signing & verification via `@noble/secp256k1`)
- [ ] JSON-RPC Protocol specification & methods (`eth_call`, `eth_sendRawTransaction`, `eth_estimateGas`)
- [ ] Mempool dynamics & Nonce tracking mechanics
- [ ] `viem` low-level transport & client configuration

## Build

- [ ] Raw EVM transaction builder & serializer module
- [ ] Off-line transaction signer (`secp256k1` / `@noble/secp256k1`)
- [ ] Bitcoin UTXO Coin Selection algorithm (Knapsack / Branch and Bound) & transaction serializer
- [ ] JSON-RPC provider client connected to local testnet (Hardhat/Anvil)
- [ ] Gas fee estimator (`maxFeePerGas`, `maxPriorityFeePerGas`)
- [ ] Transaction broadcaster & receipt confirmation tracker

---

# 📜 Phase 3: Smart Contracts & Multi-Chain Ecosystems

## Learn

- [ ] Solidity language syntax, ABI encoding/decoding, & Bytecode execution
- [ ] Token Standards (ERC20, ERC721, ERC1155, ERC4626 Vaults, Permit/EIP-2612)
- [ ] Smart Contract Vulnerabilities (Reentrancy, Access Control, Overflow, Front-running, Flash loans, Oracle manipulation)
- [ ] Bitcoin Script, SegWit, and Taproot execution model
- [ ] Solana Programs, Accounts model, & Program Derived Addresses (PDAs)
- [ ] Tron Resource Model (Energy & Bandwidth staking)

## Build

- [ ] ERC20 Token Interaction module (balanceOf, transfer, approve, permit)
- [ ] Contract ABI Event Log decoder
- [ ] Smart Contract vulnerability test suite (simulating Reentrancy & Front-running in local test environment)
- [ ] Solana Program interaction module (SPL token transfer & PDA seed derivation)
- [ ] Tron Energy/Bandwidth resource estimator for TRX/TRC20 transfers

---

# 🚜 Phase 4: Hot Wallet Operations & Custodial Infrastructure

## Learn

- [ ] Hot Wallet vs Cold Storage Vault architecture
- [ ] Gas Tank auto-refueling strategy (sub-funding user deposit addresses for gas)
- [ ] Deposit Sweeping consolidation & transaction batching
- [ ] Nonce gap handling & RBF (Replace-By-Fee) / transaction speed-ups
- [ ] Full Node vs Archive Node vs Light Client RPC pooling
- [ ] WebSocket providers & Block Indexer Architecture
- [ ] Blockchain Reorganizations (Reorgs) & block confirmation depth
- [ ] Idempotency & duplicate event filtering strategies
- [ ] BullMQ async job queues & worker pools

## Build

- [ ] User Deposit Address pool & Master Hot Wallet schema (Orchid ORM)
- [ ] Block Scanner service polling new blocks & WebSocket block subscription
- [ ] Event Log Indexer for ERC20 `Transfer` events
- [ ] Block Reorg detector & transaction rollback state handler
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
- [ ] Internal transfer engine (instant zero-fee off-chain user transfers)
- [ ] Automated internal ledger balance consistency auditor

---

# ⚡ Phase 6: Exchange Backend & Matching Engine

## Learn

- [ ] API Architecture (REST, GraphQL, WebSockets, oRPC)
- [ ] Authentication: JWT, OAuth2, Passkeys (WebAuthn), TOTP MFA
- [ ] In-memory Order Book data structures (B-Trees / SkipLists for Price-Time Priority)
- [ ] Order Types (Limit, Market, Stop-Limit, IOC, FOK)
- [ ] Partial Fill execution logic
- [ ] Redis caching & real-time WebSocket pub/sub
- [ ] Apache Kafka event streaming for match logs & trade settlement
- [ ] Elasticsearch / OpenSearch indexing for transaction & order history

## Build

- [ ] User Auth module (Passkeys + TOTP MFA guards for oRPC)
- [ ] In-Memory Order Book engine (Price-Time Priority queue)
- [ ] Order placement & cancellation oRPC endpoints
- [ ] WebSocket server broadcasting real-time order book depth & ticker streams
- [ ] Kafka event producer for trade matches
- [ ] Trade Settlement engine consuming Kafka match events
- [ ] Ledger settlement integration (atomic balance updates for buyer & seller)
- [ ] Elasticsearch audit logger for historical trade searches

---

# 🔍 Phase 7: Automated Reconciliation & Proof of Reserves

## Learn

- [ ] On-chain balance vs Off-chain database balance auditing
- [ ] Automated circuit breakers & auto-halt guardrails
- [ ] Merkle Tree Proof of Reserves (PoR) & zk-SNARK solvency verification

## Build

- [ ] Automated daily reconciliation worker comparing DB balances with RPC live vault balances
- [ ] Emergency circuit breaker system (halting withdrawals on balance drift detection)
- [ ] Merkle-tree generator for user Solvency Proofs (PoR API)

---

# 🛡️ Phase 8: Enterprise Security, Key Custody & DevOps

## Learn

- [ ] AWS KMS / GCP KMS / HashiCorp Vault key management integration
- [ ] Shamir's Secret Sharing (SSS)
- [ ] MPC Wallets & Threshold Signature Schemes (TSS / FROST)
- [ ] Rate limiting, DDoS protection & Web Application Firewall (WAF)
- [ ] Security Headers & Policies: CSP, CSRF, XSS, SSRF
- [ ] CAP Theorem, Event Sourcing, CQRS, Saga Pattern, Distributed Locks
- [ ] Containerization & Orchestration: Docker, Kubernetes, Helm
- [ ] Infrastructure as Code (IaC): Terraform & CI/CD GitHub Actions
- [ ] Monitoring & Metrics: Prometheus, Grafana, Loki, OpenTelemetry, Jaeger

## Build

- [ ] KMS integration for hot wallet private key signing
- [ ] SSS (Shamir's Secret Sharing) key split & recovery utility
- [ ] Redis-backed rate limiter middleware & Auth guards for oRPC
- [ ] Distributed lock utility (`redlock`) for signing address concurrency
- [ ] Dockerized microservice suite with Kubernetes Helm deployment manifests
- [ ] Prometheus metrics endpoint & Grafana dashboard for deposit/withdrawal queue health & order engine latency

---

# 📈 Phase 9: Finance Domain, Trading Derivatives & Compliance

## Learn

- [ ] Market Making, Liquidity Provision, Slippage, Spread, & Arbitrage dynamics
- [ ] Candlestick & OHLCV Data Aggregation
- [ ] Margin Trading, Leverage, Funding Rates, & Derivatives (Futures/Options)
- [ ] Risk Engine & Liquidation Workflows
- [ ] Know Your Customer (KYC) Integration
- [ ] Anti-Money Laundering (AML) Transaction Monitoring & Sanctions Address Screening
- [ ] FATF Travel Rule Compliance Integration

## Build

- [ ] OHLCV Candlestick aggregator & historical price chart API
- [ ] Order Book Depth feed generator
- [ ] Risk Engine & automated Liquidation worker for margin positions
- [ ] KYC user verification state workflow
- [ ] AML Sanctions address screening checker (simulated OFAC/Chainalysis API check)
- [ ] FATF Travel Rule compliance metadata payload exchanger
