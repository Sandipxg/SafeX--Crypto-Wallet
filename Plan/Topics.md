# Crypto Exchange & Wallet Learning Roadmap (Ascending Order)

---

# Phase 0: Computer Science & Low-Level Foundations

### 0.1 Number Systems
* Binary
* Decimal
* Hexadecimal
* Base58
* Base64

### 0.2 Data Representation
* Bits
* Bytes
* Endianness
* UTF-8
* Unicode

### 0.3 Networking
* HTTP
* HTTPS
* TCP
* WebSockets
* TLS
* DNS

### 0.4 Operating Systems
* Processes
* Threads
* Memory
* File Systems
* Scheduling

---

# Phase 1: Applied Cryptography

### 1.1 Randomness & Entropy
* True Random Numbers (TRNG)
* Pseudo Random Numbers (PRNG)
* Cryptographically Secure PRNG (CSPRNG)
* Entropy & Entropy Collection
* Secure Random Generation
* Browser Crypto API
* Node crypto module

### 1.2 Encoding Schemes
* Hex Encoding
* Base64
* Base58
* Base58Check
* Bech32
* UTF-8
* ASCII

### 1.3 Hash Functions & Concepts
* SHA-1 (Deprecated / Insecure)
* SHA-256
* SHA-3
* Keccak-256
* RIPEMD-160
* Blake2 & Blake3
* Concepts: One-way functions, Avalanche effect, Collision resistance, Preimage resistance

### 1.4 Symmetric Encryption
* AES (AES-GCM, AES-CBC)
* Initialization Vector (IV)
* Nonce & Authentication Tag
* Padding
* Key Derivation

### 1.5 Password Security & Hashing
* PBKDF2
* scrypt
* Argon2
* bcrypt
* Salt & Pepper

### 1.6 Public Key Cryptography
* Private Key & Public Key
* Elliptic Curves (secp256k1, Ed25519, Curve25519)
* Scalar Multiplication

### 1.7 Digital Signatures
* ECDSA
* Schnorr
* EdDSA
* Signing & Verification
* Recoverable Signatures

### 1.8 Key Exchange & Shared Secrets
* ECDH (Elliptic Curve Diffie-Hellman)
* Diffie-Hellman
* Ephemeral Keys & Shared Secrets

### 1.9 Merkle Trees & Cryptographic Proofs
* Leaf Nodes & Hash Pairing
* Root Hash
* Inclusion Proof & Merkle Proof

---

# Phase 2: Wallet Fundamentals & HD Key Derivation

### 2.1 Wallet Architecture Basics
* Custodial Wallet
* Non-Custodial Wallet
* Hot Wallet vs Cold Wallet
* Hardware Wallet
* MultiSig Wallet
* Smart Contract Wallet

### 2.2 Seed Phrase & Entropy (BIP39)
* BIP39 Specification
* Mnemonic Generation
* Entropy to Mnemonic Conversion
* Checksum Calculation
* Optional Passphrase (25th word)

### 2.3 Hierarchical Deterministic Wallets (BIP32)
* BIP32 Specification
* Master Key Generation
* Extended Keys (xprv / xpub)
* Child Key Derivation
* Normal vs Hardened Keys

### 2.4 Derivation Paths (BIP44)
* BIP44 Multi-Account Hierarchy (`m / purpose' / coin_type' / account' / change / address_index`)
* Coin Types (BTC, ETH — Primary; SOL, TRX — Optional Phase 13)
* Account & Change Indexes
* Address Indexing Strategy

### 2.5 Address Formats
* **Ethereum**: Checksummed Address (EIP-55)
* **Bitcoin**: P2PKH (Legacy), P2SH, Bech32 (Native SegWit), Taproot (P2TR)

### 2.6 Local Wallet Storage & Client Security
* Key Storage Strategies
* OS Secure Enclave / Keystore
* Browser Storage (LocalStorage, IndexedDB risk awareness)
* Web Crypto API
* Local Secret Encryption at Rest
* Seed Backup & Recovery Workflows

---

# Phase 3: Blockchain Fundamentals & Node Interactivity

### 3.1 Core Blockchain Architecture
* Blocks & Block Headers
* Transactions & Serialization
* Genesis Block
* Block Body

### 3.2 State & Account Models
* UTXO Model (Bitcoin)
* Account-Based Model (Ethereum)
* Externally Owned Accounts (EOA) vs Contract Accounts

### 3.3 Consensus Mechanisms & Finality
* Proof of Work (PoW)
* Proof of Stake (PoS)
* Validators & Mining
* Block Time, Difficulty & Finality
* Chain Reorganizations (Reorgs) & Uncle Blocks

### 3.4 Transaction Anatomy & Execution
* Nonce & Replay Protection
* Gas, Gas Limit, Gas Price (Legacy)
* EIP-1559: Base Fee, Max Fee, Max Priority Fee
* Transaction Signatures & RLP/Bytes Serialization
* Mempool Dynamics (Pending, Dropped, Replaced, Order Priority)

### 3.5 Node Interaction via JSON-RPC
* JSON-RPC Protocol Overview
* `eth_call`, `eth_sendRawTransaction`, `eth_getBalance`
* `eth_getLogs`, `eth_getBlockByNumber`, `eth_estimateGas`, `eth_chainId`

---

# Phase 4: Smart Contracts & Multi-Chain Ecosystems

### 4.1 Smart Contract Development
* Solidity Language Syntax
* ABI (Application Binary Interface) & Bytecode
* Constructors, Functions, Modifiers
* Events, Logs, & Custom Errors
* Libraries & Interfaces

### 4.2 Token Standards & Protocols
* ERC20 (Fungible Tokens)
* ERC721 (Non-Fungible Tokens)
* ERC1155 (Multi-Token Standard)
* ERC4626 (Tokenized Vaults)
* Permit (EIP-2612 / Gasless Approvals)
* Allowance & Approval Security

### 4.3 Smart Contract Security & Vulnerabilities
* Reentrancy Attacks
* Access Control & Authorization Flaws
* Integer Overflow / Underflow
* Signature Replay Attacks
* `tx.origin` Phishing
* `delegatecall` Injection
* Front-Running & Sandwich Attacks
* Flash Loans & Oracle Manipulation

### 4.4 Supported Blockchain Paradigms
* **Bitcoin**: UTXO Model, Bitcoin Script, SegWit, Taproot
* **Ethereum (EVM)**: Account Model, Nonces, EVM Bytecode, Gas & EIP-1559
* **Optional Multi-Chain Stretch (Phase 13)**: Solana (Accounts & PDAs), Tron (Resource Model), Polygon (PoS Checkpoints)

---

# Phase 5: Hot Wallet Operations & Custodial Infrastructure

### 5.1 Gas Refueling & Deposit Sweeping
* Gas Tank Management (Auto-refueling user deposit addresses for gas fees)
* Sweep Consolidation (Consolidating tokens from deposit addresses to main vaults)
* Transaction Batching & Fee Optimization

### 5.2 Hot Wallet Nonce & Broadcast Queueing
* Nonce Queueing & Gap Detection
* RBF (Replace-By-Fee) & EIP-1559 Transaction Speed-ups
* Concurrency Locks on Hot Wallet Signing Addresses

### 5.3 Block Indexing & Event Tracking
* Full Nodes vs Archive Nodes vs Light Clients
* RPC Pooling & Failover Providers
* WebSocket Providers & Block Scanners
* Event Listener & Indexer Architecture
* Chain Reorg Handling & Event Rollback Systems

---

# Phase 6: Exchange Backend Infrastructure

### 6.1 API Layer & Authentication
* REST API Design
* GraphQL API
* WebSockets (Real-time Order Book & Ticker Streams)
* Authentication: JWT, OAuth2, Passkeys, Multi-Factor Authentication (MFA/TOTP)

### 6.2 Relational Data & Storage Systems
* PostgreSQL Engine
* Database Partitioning & Indexing Strategies
* ACID Transactions & Isolation Levels (Read Committed, Repeatable Read, Serializable)

### 6.3 In-Memory Caching & Real-time State
* Redis (Session storage, pub/sub, rate limiting)
* Cache Invalidation Strategies

### 6.4 Asynchronous Messaging & Workers
* Event Streaming: Kafka, RabbitMQ, BullMQ
* Background Workers & Task Queues
* Retry Policies & Dead Letter Queues (DLQ)

### 6.5 Search Engine Integration
* Elasticsearch / OpenSearch (Transaction logs, audit logs, order history search)

---

# Phase 7: Centralized Exchange Architecture & Core Engines

### 7.1 Matching Engine
* Order Book Data Structures (B-Trees / SkipLists for O(1) or O(log N) execution)
* Market Orders, Limit Orders, Stop Orders
* Time-In-Force: IOC (Immediate-or-Cancel), FOK (Fill-or-Kill)
* Partial Fills & Price-Time Priority Matching

### 7.2 Trade Engine & Settlement
* Trade Matching & Settlement Execution
* Trade History Storage & Real-time Feed Generation

### 7.3 Wallet & Balance Engine
* Available Balance vs Locked Balance vs Reserved Balance
* Internal Transfers & Instant Off-Chain Settlements
* Deposit & Withdrawal Processing Workflows

### 7.4 Double-Entry Ledger System
* Double-Entry Accounting Architecture
* Journal Entries & Immutable Ledger Records
* Audit Trail Generation

### 7.5 Automated Reconciliation & Proof of Reserves
* On-Chain vs Database Balance Audit Engines
* Real-Time Balance Drift Detection & Emergency Circuit Breakers
* Merkle-Tree Proof of Reserves (PoR) & zk-SNARK Solvency Proofs

---

# Phase 8: Enterprise Security, Distributed Systems & DevOps

### 8.1 Enterprise Key Management & Custody
* Key Management Systems (KMS) & PKCS#11 Hardware Security Modules (HSM)
* Shamir's Secret Sharing (SSS)
* MPC Wallets & Threshold Signature Schemes (TSS / FROST)
* Automated Secret Rotation

### 8.2 Application & Infrastructure Security
* Rate Limiting & DDoS Mitigation
* Web Application Firewall (WAF)
* Security Headers & Policies: CSP, CSRF, XSS, SSRF

### 8.3 Distributed Systems Architecture
* CAP Theorem & Eventual Consistency
* Event Sourcing Architecture
* CQRS (Command Query Responsibility Segregation)
* Saga Pattern for Distributed Transactions
* Distributed Locking & Idempotency Guarantees
* Circuit Breaker Pattern & Load Balancing
* Horizontal Scaling, Sharding, & Data Replication

### 8.4 DevOps, Infrastructure & Observability
* Containerization & Orchestration: Docker, Kubernetes, Helm
* Infrastructure as Code (IaC): Terraform
* CI/CD Pipelines: GitHub Actions
* Monitoring & Metrics: Prometheus, Grafana
* Logging & Tracing: Loki, OpenTelemetry, Jaeger

---

# Phase 9: Finance Domain, Trading Derivatives & Compliance

### 9.1 Financial Domain & Spot Market Dynamics
* Market Making & Liquidity Provision
* Slippage, Bid-Ask Spread, Arbitrage Dynamics
* Candlesticks & OHLCV Data Aggregation
* Order Book Depth Visualization

### 9.2 Margin Trading & Derivatives Engine
* Funding Rates
* Margin Trading & Leverage
* Futures & Options Contracts
* Risk Engine & Liquidation Workflows

### 9.3 Regulatory, KYC & Compliance
* Know Your Customer (KYC) Integration
* Anti-Money Laundering (AML) Transaction Monitoring
* FATF Travel Rule Compliance Integration
* Regulatory Audit Reports

---

# Strategic Learning Execution Guide

To master this roadmap, proceed strictly from **Phase 0 to Phase 9**.

### Build Incremental Mini-Projects:
1. **After Phase 1-2**: Build a CLI HD Wallet in TypeScript/Rust that creates seed phrases and derives addresses without external wallet SDKs.
2. **After Phase 3-5**: Build an On-Chain RPC Listener & Deposit Sweeper daemon connected to a local Hardhat/Anvil test node.
3. **After Phase 6-7**: Build an In-Memory Order Book Engine and Double-Entry Ledger backed by PostgreSQL and Redis.
4. **After Phase 8-9**: Assemble all services into a high-availability containerized microservice suite.
