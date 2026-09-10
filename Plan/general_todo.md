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

- [x] Number Systems (Binary, Hexadecimal, Base58, Base64)
- [x] Data Representation (Bits, Bytes, Endianness, UTF-8, Unicode)
- [x] HTTP/S, WebSockets, TLS basics
- [x] Node.js + TypeScript workspace configuration & tsconfig strict mode
- [x] PostgreSQL + ORM schema design & migration workflows
- [x] oRPC server setup & type inference mechanics (shared types between frontend/backend)
- [x] Docker Compose orchestration for local dev services
- [x] Testing fundamentals (Vitest/Jest)
- [x] Environment/secrets management conventions
- [x] Next.js App Router basics, Tailwind, shadcn/ui component conventions

## Build — Backend

- [x] Initialize TypeScript workspace & build scripts
- [x] Docker Compose for PostgreSQL
- [x] ORM connected to PostgreSQL + initial health migration
- [x] oRPC server with a healthcheck router
- [x] Vitest/Jest configured with one passing test

## Build — Frontend

- [x] Next.js app scaffolded, connected to oRPC client
- [x] App shell: nav bar, layout, dark/light theme, empty dashboard route
- [x] `/status` page rendering live backend healthcheck (proves frontend ↔ backend ↔ DB are wired)

## ✅ Definition of Done

Open the app in a browser, see a styled shell with a working nav, and a status page showing "API: healthy, DB: connected" pulled live from the backend.

---

# 🔑 Phase 1: Seed-Phrase Account — Create Wallet & Login

## Learn

- [x] CSPRNG & Entropy collection (`node:crypto` / Web Crypto API)
- [x] Encoding Schemes (Hex, Base64, Base58, Base58Check, Bech32)
- [x] Hash functions (SHA-256, Keccak-256)
- [x] Symmetric Encryption (AES-256-GCM, IV/Nonces)
- [x] Password/Secret Hashing (PBKDF2, scrypt, Argon2, Salt)
- [x] BIP39 Mnemonic specification & checksum calculation from entropy
- [x] Session strategy: JWT vs signed cookies for a "prove you hold the seed" login model

## Build — Backend

- [x] Entropy/randomness utility module (+ tests)
- [x] BIP39 mnemonic generator & validator (+ tests against official test vectors)
- [x] Encrypted-vault module: derive an encryption key from the mnemonic (or a user passphrase) and store only the encrypted seed, never plaintext
- [x] Auth endpoints: `registerWallet`, `loginWallet`, `getMe`, `logout` issuing session cookies
- [x] Session/JWT middleware guarding authenticated oRPC routes

## Build — Frontend

- [x] **Onboarding: Create Wallet** — generate mnemonic screen, "write it down" warning, confirm-by-reselecting-words step, done screen
- [x] **Onboarding: Import/Login** — 12/24-word input grid, validation feedback, submit → session
- [x] Auth-guarded dashboard shell (redirects to login if no session)
- [x] Basic account settings page (logout, "reveal seed phrase" behind a 30s auto-hide confirmation)

## ✅ Definition of Done

In the browser: create a new wallet, back up the seed phrase, log out, log back in using only that seed phrase, and land on an authenticated dashboard. No plaintext seed ever touches the database.

---


# 🧬 Phase 2: HD Multi-Address Wallet

## Learn

- [x] Elliptic Curve math (secp256k1, Ed25519, Scalar Multiplication)
- [x] BIP32 HD Wallet Extended Keys (`xprv`/`xpub`) & Hardened Derivation
- [x] BIP44 Multi-Chain Derivation Paths (`m/44'/60'/0'/0/0`)
- [x] Address Formats (EVM EIP-55 Checksum, Bitcoin P2PKH/Bech32/Taproot)

## Build — Backend

- [x] BIP32 master seed → HD key derivation tree module (+ tests against official test vectors)
- [x] Multi-chain address generator (EVM EIP-55, Bitcoin Bech32/Taproot) from the user's derived keys
- [x] `getMyAddresses` oRPC endpoint returning derived addresses per chain

## Build — Frontend

- [x] **"My Addresses" page** — one card per chain (EVM, Bitcoin) showing the address, a QR code, and a copy button
- [x] Chain selector component (reused by later phases)

## ✅ Definition of Done

Logged-in user sees their real EVM and Bitcoin receiving addresses with scannable QR codes, and those addresses match a known-good reference wallet given the same seed.

---

# 📡 Phase 3: Send & Receive — EVM Testnet

## Learn

- [x] Core Blockchain Architecture (Blocks, Transactions, Serialization)
- [x] Account model, nonces
- [x] Raw EVM transaction serialization (RLP & EIP-1559 fields)
- [x] ECDSA signing/verification (`@noble/secp256k1`)
- [x] JSON-RPC methods (`eth_call`, `eth_sendRawTransaction`, `eth_estimateGas`)
- [x] `viem` transport & client configuration

## Build — Backend

- [x] Raw EVM transaction builder & serializer
- [x] Offline transaction signer using the user's derived key
- [x] JSON-RPC provider client (Sepolia testnet)
- [x] Gas fee estimator (`maxFeePerGas`, `maxPriorityFeePerGas`)
- [x] Transaction broadcaster & receipt/confirmation poller
- [x] `getBalance`, `getTxHistory` endpoints

## Build — Frontend

- [x] **Wallet dashboard** — live native balance (ETH) for the selected chain
- [x] **Send screen** — address input, amount, live gas estimate, review step, sign & broadcast, pending → confirmed status
- [x] **Receive screen** — address + QR (reuse Phase 2 component)
- [x] **Transaction history list** — pending/confirmed states, link to block explorer

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

# 🪙 Phase 4: Token Assets (ERC-20)

## Learn

- [x] Native Coins vs. Smart Contract Tokens & Wrapped ETH (WETH)
- [x] EVM Calldata, 4-byte function selectors (`0xa9059cbb`) & ABI encoding
- [x] ERC-20 state architecture (`mapping(address => uint256)`, `balanceOf`, `transfer`)
- [x] The Allowance pattern (`approve` + `transferFrom`), Infinite Approvals & EIP-2612 Permit
- [x] Fixed-point arithmetic & variable decimals (18 vs 6 vs 8, no floating-point in EVM)
- [x] Event logs, topics & token discovery (`event Transfer`)
- [x] Real-world token quirks (USDT missing-bool, `SafeERC20`, fee-on-transfer, blacklists)

## Build — Backend

- [x] ERC-20 read/write module (`balanceOf`, `decimals`, `symbol`, `name`, `allowance`)
- [x] EVM calldata builder & ABI encoder for `transfer` and `approve`
- [x] Batch token balance scanner (`getTokenBalances` via Multicall3/parallel RPC)
- [x] Token event log decoder (parse raw logs for incoming/outgoing transfers)

## Build — Frontend

- [x] **Assets tab on Dashboard** — token list showing Native ETH + tracked ERC-20 balances with live USD rates
- [x] **"Import Token" modal** — paste contract address, auto-fetch symbol/decimals, save to IndexedDB
- [x] **Multi-asset Send screen** — token selector dropdown, balance checks, automatic calldata generation, dynamic gas limit (~65,000)
- [x] **Transaction history extension** — decode and display ERC-20 transfers alongside ETH

## ✅ Definition of Done

- [x] Import a testnet ERC-20 token (e.g. Sepolia USDC) into your wallet, see its balance and metadata appear in the Assets tab, and send a portion out through the Send screen with verified on-chain confirmation.

---

# 🔄 Phase 5: On-Chain Swapping (DEX / AMM Architecture & Execution)

## Learn

- [x] AMM Constant Product Model ($x \cdot y = k$) & 0.30% LP fee retention in reserves
- [x] Multi-contract architecture: Router (orchestrator) vs. Factory (registry) vs. Liquidity Pools (reserves)
- [x] Multi-hop swap routing (`path = [USDC, WETH, WBTC]`) & token decimal scaling (6 vs. 18 vs. 8)
- [x] Calldata encoding for `swapExactTokensForTokens` (`amountIn`, `amountOutMin`, `path`, `recipient`, `deadline`)
- [x] The two-step lifecycle: ERC-20 `allowance` verification → `approve()` → Router `transferFrom()`
- [x] Atomic execution, gas metering (~150,000 units across 4 contracts), and slippage/sandwich defense
- [x] Receipt event log decoding: parsing multi-contract `Transfer` and `Swap` event topics

## Build — Backend

- [x] Factory pair resolver & pool reserve reader (`getPair`, `getReserves`)
- [x] Swap quote & slippage calculator (`getAmountOut`, `amountOutMin` with configurable slippage)
- [x] Swap calldata builder (`swapExactTokensForTokens`, `swapExactETHForTokens`, `swapExactTokensForETH`)
- [x] Multi-event receipt parser (extracting intermediate `Swap` and final `Transfer` logs)

## Build — Frontend

- [x] **Swap screen (`/swap`)** — From/To token selectors, live output quotation, exchange rate & price impact
- [x] **One-click Allowance approval gate** — detect if `allowance < amountIn`, prompt `approve()`, track authorization
- [x] **Slippage & transaction settings modal** — 0.1%, 0.5%, 1.0%, custom slippage tolerance + deadline timer
- [x] **Offline signing & execution pipeline** — construct EIP-1559 payload, sign in RAM via client vault, broadcast
- [x] **Swap receipt & history card** — visual route trace (`USDC → WETH → WBTC`), gas paid, confirmed output amount

## ✅ Definition of Done

- [x] Perform an end-to-end multi-hop swap on Sepolia (e.g. Sepolia USDC → WETH → test token), verifying the one-transaction atomic execution, receipt event log decoding, and accurate balance updates in the Assets tab.


---

# 🧪 Phase 6: Smart Contract Security Lab (internal — no UI)

_This phase is dev-tooling for your own understanding, not a user-facing feature. It's here so the vulnerability
concepts are fresh before Phase 7's custodial infrastructure, which is where a security mistake would matter most._

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

# 🚜 Phase 7: Custodial Deposits & Exchange Balance

_This is where the app splits into two coexisting halves: the self-custody **Wallet** (Phases 1–5, user controls
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

# ⚖️ Phase 8: Double-Entry Ledger & Balance Locking

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

# ⚡ Phase 9: Trading — Order Book & Matching Engine

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
- [ ] Ledger settlement integration (atomic buyer/seller balance updates via Phase 8's ledger)
- [ ] Elasticsearch audit logger

## Build — Frontend

- [ ] **Trade screen** — live order book depth, price ticker, buy/sell forms (limit + market)
- [ ] **Open orders / order history** view with cancel action
- [ ] **MFA setup flow** in account settings (passkey registration, TOTP QR enrollment)

## ✅ Definition of Done

Two test accounts place opposing limit orders through the Trade screen; they match, the trade settles atomically, and both accounts' Balance pages (Phase 8) update live via WebSocket with no page refresh.

---

# 💸 Phase 10: Withdrawals, Reconciliation & Circuit Breakers

## Learn

- [ ] On-chain vs off-chain balance auditing
- [ ] Circuit breakers & auto-halt guardrails
- [ ] Merkle Tree Proof of Reserves (concept-level)
- [ ] Nonce gap handling / RBF (applied to withdrawal payouts specifically)

## Build — Backend

- [ ] Withdrawal request → approval → on-chain payout pipeline (reuses Phase 7 hot wallet + Phase 3/3.5 tx builders)
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

# 🛡️ Phase 11: Enterprise Key Custody & Infra Hardening

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

# 📈 Phase 12: Compliance — KYC & AML

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

# 📊 Phase 13: Trading+ — Charts, Margin & Liquidations (stretch)

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

# 🔀 Phase 14: Multi-Chain Expansion — Solana & Tron (Optional Stretch Goal)

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