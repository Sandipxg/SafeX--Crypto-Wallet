# SafeX Crypto Exchange & Wallet — Master TODO

This document tracks concepts to learn **and** the feature to ship immediately after learning them.
Every phase (except Phase 5, flagged below) ends with a real, clickable feature in the browser — not just a backend module.
By the final phase, the app is a complete, self-custody-wallet + custodial-exchange hybrid, ready for real-world (testnet-first) transactions.

> **Scope note:** This is a learning/portfolio build. Everything from Phase 6 onward mirrors real exchange
> custody/ledger architecture — going live with real user funds would need licensing, audits, and legal review
> far beyond what's tracked here.

> **Chain scope:** EVM + Bitcoin are the core scope through Phase 12. Solana + Tron are deferred to Phase 13 (optional stretch phase) at the end of the roadmap.

> **Stack:** Backend — Node.js + TypeScript + oRPC + PostgreSQL (Orchid/Drizzle) + Redis (Phase 6+) + Kafka (Phase 8+).
> Frontend — Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, talking to the backend over the oRPC client
> + WebSockets for live data. Every phase's UI is a real page in this same app, not a demo/prototype.

Each phase ends with a **Definition of Done** — something you can open in a browser and click through.

---

# 🏗️ Phase 0: Foundations & App Shell

## Learn

- [ ] Number Systems (Binary, Hexadecimal, Base58, Base64)
- [ ] Data Representation (Bits, Bytes, Endianness, UTF-8, Unicode)
- [ ] HTTP/S, WebSockets, TLS basics
- [ ] Node.js + TypeScript workspace configuration & tsconfig strict mode
- [ ] PostgreSQL + ORM schema design & migration workflows
- [ ] oRPC server setup & type inference mechanics (shared types between frontend/backend)
- [ ] Docker Compose orchestration for local dev services
- [ ] Testing fundamentals (Vitest/Jest)
- [ ] Environment/secrets management conventions
- [ ] Next.js App Router basics, Tailwind, shadcn/ui component conventions

## Build — Backend

- [ ] Initialize TypeScript workspace & build scripts
- [ ] Docker Compose for PostgreSQL
- [ ] ORM connected to PostgreSQL + initial health migration
- [ ] oRPC server with a healthcheck router
- [ ] Vitest/Jest configured with one passing test

## Build — Frontend

- [ ] Next.js app scaffolded, connected to oRPC client
- [ ] App shell: nav bar, layout, dark/light theme, empty dashboard route
- [ ] `/status` page rendering live backend healthcheck (proves frontend ↔ backend ↔ DB are wired)

## ✅ Definition of Done

Open the app in a browser, see a styled shell with a working nav, and a status page showing "API: healthy, DB: connected" pulled live from the backend.

---

# 🔑 Phase 1: Seed-Phrase Account — Create Wallet & Login

## Learn

- [ ] CSPRNG & Entropy collection (`node:crypto` / Web Crypto API)
- [ ] Encoding Schemes (Hex, Base64, Base58, Base58Check, Bech32)
- [ ] Hash functions (SHA-256, Keccak-256)
- [ ] Symmetric Encryption (AES-256-GCM, IV/Nonces)
- [ ] Password/Secret Hashing (PBKDF2, scrypt, Argon2, Salt)
- [ ] BIP39 Mnemonic specification & checksum calculation from entropy
- [ ] Session strategy: JWT vs signed cookies for a "prove you hold the seed" login model

## Build — Backend

- [ ] Entropy/randomness utility module (+ tests)
- [ ] BIP39 mnemonic generator & validator (+ tests against official test vectors)
- [ ] Encrypted-vault module: derive an encryption key from the mnemonic (or a user passphrase) and store only the encrypted seed, never plaintext
- [ ] Auth endpoints: `createAccount` (generate mnemonic, return it once), `login` (accept mnemonic, derive + verify, issue session)
- [ ] Session/JWT middleware guarding authenticated oRPC routes

## Build — Frontend

- [ ] **Onboarding: Create Wallet** — generate mnemonic screen, "write it down" warning, confirm-by-reselecting-words step, done screen
- [ ] **Onboarding: Import/Login** — 12/24-word input grid, validation feedback, submit → session
- [ ] Auth-guarded dashboard shell (redirects to login if no session)
- [ ] Basic account settings page (logout, "reveal seed phrase" behind a confirmation)

## ✅ Definition of Done

In the browser: create a new wallet, back up the seed phrase, log out, log back in using only that seed phrase, and land on an authenticated dashboard. No plaintext seed ever touches the database.

---

# 🧬 Phase 2: HD Multi-Address Wallet

## Learn

- [ ] Elliptic Curve math (secp256k1, Ed25519, Scalar Multiplication)
- [ ] BIP32 HD Wallet Extended Keys (`xprv`/`xpub`) & Hardened Derivation
- [ ] BIP44 Multi-Chain Derivation Paths (`m/44'/60'/0'/0/0`)
- [ ] Address Formats (EVM EIP-55 Checksum, Bitcoin P2PKH/Bech32/Taproot)

## Build — Backend

- [ ] BIP32 master seed → HD key derivation tree module (+ tests against official test vectors)
- [ ] Multi-chain address generator (EVM EIP-55, Bitcoin Bech32/Taproot) from the user's derived keys
- [ ] `getMyAddresses` oRPC endpoint returning derived addresses per chain

## Build — Frontend

- [ ] **"My Addresses" page** — one card per chain (EVM, Bitcoin) showing the address, a QR code, and a copy button
- [ ] Chain selector component (reused by later phases)

## ✅ Definition of Done

Logged-in user sees their real EVM and Bitcoin receiving addresses with scannable QR codes, and those addresses match a known-good reference wallet given the same seed.

---

# 📡 Phase 3: Send & Receive — EVM Testnet

## Learn

- [ ] Core Blockchain Architecture (Blocks, Transactions, Serialization)
- [ ] Account model, nonces
- [ ] Raw EVM transaction serialization (RLP & EIP-1559 fields)
- [ ] ECDSA signing/verification (`@noble/secp256k1`)
- [ ] JSON-RPC methods (`eth_call`, `eth_sendRawTransaction`, `eth_estimateGas`)
- [ ] `viem` transport & client configuration

## Build — Backend

- [ ] Raw EVM transaction builder & serializer
- [ ] Offline transaction signer using the user's derived key
- [ ] JSON-RPC provider client (Sepolia testnet)
- [ ] Gas fee estimator (`maxFeePerGas`, `maxPriorityFeePerGas`)
- [ ] Transaction broadcaster & receipt/confirmation poller
- [ ] `getBalance`, `getTxHistory` endpoints

## Build — Frontend

- [ ] **Wallet dashboard** — live native balance (ETH) for the selected chain
- [ ] **Send screen** — address input, amount, live gas estimate, review step, sign & broadcast, pending → confirmed status
- [ ] **Receive screen** — address + QR (reuse Phase 2 component)
- [ ] **Transaction history list** — pending/confirmed states, link to block explorer

## ✅ Definition of Done

Fund your generated address from a Sepolia faucet, watch the balance update in the UI, send a portion of it to another address entirely through the app, and see it go pending → confirmed in the history list.

---

# ₿ Phase 3.5: Send & Receive — Bitcoin Testnet

## Learn

- [ ] UTXO model, change addresses
- [ ] Bitcoin transaction serialization

## Build — Backend

- [ ] UTXO coin selection algorithm (Knapsack / Branch and Bound)
- [ ] Bitcoin transaction builder, signer, serializer
- [ ] Bitcoin testnet RPC/provider integration

## Build — Frontend

- [ ] Extend Send/Receive/History screens to work for the Bitcoin chain via the existing chain selector (no new screens — same UI, new chain)

## ✅ Definition of Done

Same test as Phase 3, but on Bitcoin testnet, using the same Send/Receive UI with the chain selector switched to Bitcoin.

---

# 🪙 Phase 4: Token Assets (ERC20)

## Learn

- [ ] Solidity syntax, ABI encoding/decoding basics (reading, not yet writing contracts)
- [ ] Token Standards (ERC20, Permit/EIP-2612)

## Build — Backend

- [ ] ERC20 interaction module (balanceOf, transfer, approve, permit)
- [ ] Contract ABI event log decoder (for incoming Transfer events)
- [ ] `getTokenBalances` endpoint (known token list + custom token address lookup)

## Build — Frontend

- [ ] **Assets tab** — list of ERC20 token balances alongside native balance
- [ ] "Add custom token" by contract address
- [ ] Send screen extended to support token selection, not just native currency

## ✅ Definition of Done

Send a testnet ERC20 token (e.g. testnet USDC) to your wallet, see it appear automatically in the Assets tab, and send it back out through the same Send screen used for ETH.



---

# 🧪 Phase 5: Smart Contract Security Lab (internal — no UI)

_This phase is dev-tooling for your own understanding, not a user-facing feature. It's here so the vulnerability
concepts are fresh before Phase 6's custodial infrastructure, which is where a security mistake would matter most._

## Learn

- [ ] Smart Contract Vulnerabilities (Reentrancy, Access Control, Overflow, Front-running, Flash loans, Oracle manipulation)
- [ ] ERC721/ERC1155/ERC4626 (reading — only if relevant tokens show up later)

## Build — Backend (test suite, not shipped)

- [ ] Deploy a deliberately vulnerable contract locally (Hardhat/Anvil)
- [ ] Exploit it with your own test suite (prove the vulnerability, don't just read about it)
- [ ] Patch it and show the exploit now fails

## ✅ Definition of Done

Your own written test exploits a real vulnerability in a local contract, then fails after your own patch — proof you understand the mechanism, not just the name.

---

# 🚜 Phase 6: Custodial Deposits & Exchange Balance

_This is where the app splits into two coexisting halves: the self-custody **Wallet** (Phases 1–4, user controls
keys) and the custodial **Exchange** (this phase onward, SafeX holds funds and tracks balances internally). Both
live in the same app under different nav sections._

## Learn

- [ ] Hot Wallet vs Cold Storage Vault architecture
- [ ] Gas Tank auto-refueling
- [ ] Deposit Sweeping & batching
- [ ] Full Node vs Archive Node vs Light Client RPC pooling
- [ ] WebSocket providers & Block Indexer architecture
- [ ] Reorgs & confirmation depth
- [ ] Idempotency & duplicate event filtering
- [ ] BullMQ job queues & workers

## Build — Backend

- [ ] Exchange-side deposit address pool + Master Hot Wallet schema (separate from the user's personal wallet keys)
- [ ] Block scanner (polling + WebSocket subscription)
- [ ] ERC20 Transfer event indexer
- [ ] Reorg detector & rollback handler
- [ ] BullMQ gas-tank refuel queue
- [ ] BullMQ deposit-sweeping queue
- [ ] Stuck-tx monitor + RBF replacement

## Build — Frontend

- [ ] **Exchange section** added to nav (separate from Wallet)
- [ ] **Deposit screen** — shows the user's exchange-custodial deposit address (distinct from their personal wallet address) + QR
- [ ] **Exchange balance widget** on the Exchange dashboard, updating automatically once a deposit confirms — no manual refresh, no manual "I sent it" button

## ✅ Definition of Done

Send testnet funds to the Exchange deposit address (not the personal wallet address from Phase 2); watch the Exchange balance update in the UI automatically once confirmations clear, with no user action beyond sending the transaction.

---

# ⚖️ Phase 7: Double-Entry Ledger & Balance Locking

## Learn

- [ ] Double-entry bookkeeping (Assets, Liabilities, Equity, Debits/Credits)
- [ ] Immutability & audit trail design
- [ ] Available vs Locked vs Reserved balance states
- [ ] PostgreSQL row-level locking (`SELECT FOR UPDATE`)
- [ ] `BigInt`/`NUMERIC` precision math

## Build — Backend

- [ ] User balance + double-entry ledger schema
- [ ] Atomic deposit-credit / withdrawal-debit procedures
- [ ] Balance locking service (for orders/withdrawals in flight)
- [ ] Internal transfer engine (instant off-chain user-to-user transfers)
- [ ] Ledger consistency auditor job

## Build — Frontend

- [ ] **Balance page** — Available vs Locked breakdown, per-asset
- [ ] **Ledger/history view** — every credit/debit with type (deposit, trade, transfer, withdrawal)
- [ ] **Internal transfer screen** — send balance to another SafeX user instantly (by username/ID, no on-chain tx)

## ✅ Definition of Done

Send an internal transfer to a second test account entirely off-chain, see both balances update instantly in the UI, and see matching entries in both users' ledger views. The consistency auditor reports zero discrepancies after 100 simulated concurrent operations.

---

# ⚡ Phase 8: Trading — Order Book & Matching Engine

## Learn

- [ ] Authentication hardening: Passkeys (WebAuthn), TOTP MFA
- [ ] In-memory Order Book structures (Price-Time Priority)
- [ ] Order Types (Limit, Market, Stop-Limit, IOC, FOK)
- [ ] Partial fill logic
- [ ] Redis pub/sub for real-time data
- [ ] Kafka event streaming for match logs
- [ ] Elasticsearch/OpenSearch for trade/order history search

## Build — Backend

- [ ] Passkeys + TOTP guards added to the auth flow from Phase 1
- [ ] In-memory order book engine
- [ ] Order placement/cancellation endpoints
- [ ] WebSocket server broadcasting order book depth & ticker
- [ ] Kafka producer for matches + settlement consumer
- [ ] Ledger settlement integration (atomic buyer/seller balance updates via Phase 7's ledger)
- [ ] Elasticsearch audit logger

## Build — Frontend

- [ ] **Trade screen** — live order book depth, price ticker, buy/sell forms (limit + market)
- [ ] **Open orders / order history** view with cancel action
- [ ] **MFA setup flow** in account settings (passkey registration, TOTP QR enrollment)

## ✅ Definition of Done

Two test accounts place opposing limit orders through the Trade screen; they match, the trade settles atomically, and both accounts' Balance pages (Phase 7) update live via WebSocket with no page refresh.

---

# 💸 Phase 9: Withdrawals, Reconciliation & Circuit Breakers

## Learn

- [ ] On-chain vs off-chain balance auditing
- [ ] Circuit breakers & auto-halt guardrails
- [ ] Merkle Tree Proof of Reserves (concept-level)
- [ ] Nonce gap handling / RBF (applied to withdrawal payouts specifically)

## Build — Backend

- [ ] Withdrawal request → approval → on-chain payout pipeline (reuses Phase 6 hot wallet + Phase 3/3.5 tx builders)
- [ ] Daily reconciliation worker (DB balances vs live vault balances)
- [ ] Emergency circuit breaker (auto-halt withdrawals on drift)
- [ ] Merkle-tree Proof of Reserves generator

## Build — Frontend

- [ ] **Withdraw screen** — amount, destination address, balance/lock checks, confirmation step
- [ ] **System status banner** — shows if withdrawals are halted (circuit breaker state), visible to all users
- [ ] Public **Proof of Reserves** page showing the latest Merkle root and a "verify your inclusion" tool

## ✅ Definition of Done

Withdraw testnet funds from Exchange balance to an external address and see it land on-chain. Separately, manually force a balance drift in a test environment and confirm the circuit breaker halts withdrawals and the status banner reflects it in the UI.

---

# 🛡️ Phase 10: Enterprise Key Custody & Infra Hardening

## Learn

- [ ] AWS/GCP KMS or HashiCorp Vault integration
- [ ] Shamir's Secret Sharing (SSS)
- [ ] MPC Wallets & Threshold Signature Schemes (TSS/FROST) — concept-level
- [ ] Rate limiting, DDoS protection, WAF
- [ ] CSP, CSRF, XSS, SSRF headers/policies
- [ ] Distributed locks (`redlock`)
- [ ] Docker/Kubernetes/Helm, Terraform, GitHub Actions CI/CD
- [ ] Prometheus/Grafana/Loki/OpenTelemetry monitoring

## Build — Backend

- [ ] Migrate hot wallet signing to KMS-backed keys
- [ ] SSS split/recovery utility for master seed backup
- [ ] Redis-backed rate limiter + auth guards on all sensitive oRPC routes
- [ ] `redlock` distributed lock around signing/sweeping operations
- [ ] Security headers middleware (CSP/CSRF/XSS/SSRF mitigations)
- [ ] CI/CD pipeline: lint → test → build → deploy
- [ ] Dockerized services + Helm manifests, Prometheus metrics endpoint

## Build — Frontend

- [ ] **Security settings page** — shows KMS-backed signing status, active sessions, recovery-share management
- [ ] **Admin/ops dashboard** (separate protected route) — Grafana-embedded or native charts for queue health, order engine latency, deposit/withdrawal volume

## ✅ Definition of Done

A push to `main` runs CI, builds a container, deploys to a local/staging cluster, and the Admin dashboard shows live metrics from real traffic generated by clicking through the app.

---

# 📈 Phase 11: Compliance — KYC & AML

## Learn

- [ ] KYC integration patterns
- [ ] AML transaction monitoring & sanctions screening
- [ ] FATF Travel Rule basics

## Build — Backend

- [ ] KYC verification state machine (pending/approved/rejected)
- [ ] AML sanctions screening checker (simulated OFAC/Chainalysis-style API)
- [ ] Travel Rule metadata payload exchanger (stub/simulated counterpart)

## Build — Frontend

- [ ] **KYC flow** — document upload, status tracking, gated access to withdrawals above a threshold
- [ ] Admin dashboard: flagged-transaction review queue

## ✅ Definition of Done

A new account is withdrawal-limited until KYC is submitted and approved through the UI; a withdrawal to a simulated sanctioned address is correctly flagged and blocked, visible in the admin review queue.

---

# 📊 Phase 12: Trading+ — Charts, Margin & Liquidations (stretch)

## Learn

- [ ] Market making, slippage, spread, arbitrage dynamics
- [ ] OHLCV aggregation
- [ ] Margin, leverage, funding rates, liquidation mechanics

## Build — Backend

- [ ] OHLCV candlestick aggregator + historical price API
- [ ] Risk engine + automated liquidation worker for margin positions

## Build — Frontend

- [ ] **Price chart** (candlesticks) on the Trade screen
- [ ] **Margin trading UI** — leverage selector, liquidation price display, position management

## ✅ Definition of Done

A simulated leveraged position breaches its maintenance margin and the liquidation worker closes it automatically; the UI reflects the closed position and updated balance without manual intervention.

---

# 🔀 Phase 13: Multi-Chain Expansion — Solana & Tron (Optional Stretch Goal)

_Deferred until the primary EVM+Bitcoin wallet and exchange features (Phases 1–12) are fully working end-to-end._

## Learn

- [ ] Solana Accounts model & Program Derived Addresses (PDAs)
- [ ] Tron Resource Model (Energy & Bandwidth)

## Build — Backend

- [ ] Solana address derivation + SPL token transfer module
- [ ] Tron address derivation + TRX/TRC20 transfer + resource estimator

## Build — Frontend

- [ ] Add Solana and Tron to the existing chain selector — Addresses, Send, Receive, Assets, History all extend automatically

## ✅ Definition of Done

The wallet UI supports 4 chains end-to-end (EVM, Bitcoin, Solana, Tron) through the chain selector, with no chain-specific screens.

---

# 📝 Notes on Using This File

- Don't start a phase's Backend/Frontend build until the previous phase's Definition of Done passes in the browser — each phase is a real vertical slice, and later phases assume the earlier ones actually work, not just that the code exists.
- If a phase feels too big to finish before moving on, that's a signal to split it further (like 3.5, 4.5 were split out) — not a signal to skip the UI half and "come back to it later." The UI is how you know the feature actually works.
- Check off **Learn** items once you could explain the concept to someone else. Check off **Build** items once the phase's Definition of Done depending on them actually passes.