# 🛡️ SafeX — Zero-Trust, Non-Custodial Multi-Chain Web3 Wallet

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20(App%20Router)-black.svg)](https://nextjs.org/)
[![Viem](https://img.shields.io/badge/EVM%20Engine-Viem%202.x-black.svg)](https://viem.sh/)
[![Argon2id](https://img.shields.io/badge/KDF-Argon2id%20(64MB)-red.svg)](https://en.wikipedia.org/wiki/Argon2)
[![AES-256-GCM](https://img.shields.io/badge/Cipher-AES--256--GCM-green.svg)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
[![EIP-1559](https://img.shields.io/badge/EVM%20Standard-EIP--1559-purple.svg)](https://eips.ethereum.org/EIPS/eip-1559)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **SafeX** is an enterprise-grade, **100% non-custodial Web3 crypto wallet** built from fundamental cryptographic primitives. It provides client-side zero-trust security, multi-chain HD address derivation (EVM + Bitcoin Native SegWit), offline EIP-1559 transaction construction, and direct decentralized blockchain node interaction—**with zero central database storing your keys or balances**.

---

## 🔒 The Zero-Trust Guarantee (Why No Central Database?)

> [!IMPORTANT]
> **True self-custody means zero server trust.** 
> In authentic Web3 architecture, storing private keys, seed phrases, or user wallet balances in a centralized database (such as PostgreSQL or MongoDB) is a major anti-pattern and a critical security vulnerability. 
> 
> * **No Database for Wallets**: SafeX never records private keys, mnemonics, or balances to a server database.
> * **Pure Client-Side Cryptography**: 100% of entropy generation, key derivation, and transaction signing occurs exclusively in the user's browser sandbox.
> * **Direct Node Communication**: Signed raw bytecode is broadcast directly to decentralized Ethereum and Bitcoin JSON-RPC nodes.

---

## 📚 Deep-Dive Technical Handbooks & Architecture Infographics

> [!TIP]
> **For comprehensive architectural teardowns, mathematical proofs, and high-resolution diagrams, explore the [`/notes`](./notes) directory.**

| Phase / Topic | Technical Focus & Engineering Scope | Handbook Link |
| :--- | :--- | :--- |
| **Phase 1** | CSPRNG Entropy, BIP-39 Mnemonics, PBKDF2, Argon2id KDF, AES-256-GCM Vault, RAM Zeroization | [📘 Phase 1 Handbook](./notes/phase1.md) |
| **Phase 2** | EIP-1559 Transaction Anatomy, Gas Base Fee Burn, Priority Tips, ECDSA Secp256k1 Offline Signing | [📘 Phase 2 Handbook](./notes/phase2.md) |
| **Phase 3** | Nonce Management, Mempool Race Conditions, Replacement & Cancellation, Block Confirmations | [📘 Phase 3 Handbook](./notes/phase3.md) |
| **Phase 4** | Smart Contracts, 4-Byte EVM Calldata Selectors, ERC-20 Standard, Fixed-Point Arithmetic | [📘 Phase 4 Handbook](./notes/phase4.md) |
| **Phase 5** | Blockchain Data Indexing, Blockscout REST API, Historical Ledger Caching, Activity Feeds | [📘 Phase 5 Handbook](./notes/phase5.md) |
| **Math & Curves** | Secp256k1 Elliptic Curve Algebra, Discrete Logarithm Problem, Point Multiplication ($P = k \times G$) | [📘 Elliptic Curve Math](./notes/Maths_Eclliptic_curve.md) |
| **Fundamentals** | Consensus Algorithms, Cryptographic Hashes, Peer-to-Peer Networks, Block Structures | [📘 Blockchain Core](./notes/fundamentals/blockchain.md) |

### 🖼️ Featured Architecture Infographics
High-resolution technical diagrams located in [`/notes/infographics`](./notes/infographics):
* [Seed Phrase to Multi-Chain Address Pipeline](./notes/infographics/seedphraseTo_evm_btc_addresses.png)
* [Complete EIP-1559 Transaction Lifecycle](./notes/infographics/complete_transaction_lifecycle.png)
* [Offline ECDSA Signing & Public Key Recovery Tuple $(r, s, v)$](./notes/infographics/transaction_signing_pipeline.png)
* [Sender Address Extraction from Raw Byte Stream](./notes/infographics/How_ethereum_recover_senderAddress_from_transactionObjectBytes.png)
* [Resilient Multi-Tier JSON-RPC Architecture](./notes/infographics/safex_rpc_architecture.png)
* [EIP-1559 Transaction Anatomy Breakdown](./notes/infographics/eip1559_transaction_anatomy.png)

---

## 🏛️ System Architecture: Pure Non-Custodial Flow

All cryptographic operations occur on-device. The only external traffic is raw blockchain JSON-RPC calls.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CLIENT BROWSER SANDBOX                                   │
│                                                                                        │
│   [ Entropy (CSPRNG) ] ──► [ BIP-39 Mnemonic ] ──► [ PBKDF2 ] ──► [ 512-bit Root Seed ]│
│                                                                          │             │
│                 ┌────────────────────────────────────────────────────────┴──────┐      │
│                 ▼ (BIP-44: m/44'/60'/0'/0/0)        ▼ (BIP-84: m/84'/0'/0'/0/0) │      │
│         [ EVM Private Key ]                 [ BTC Private Key ]                 │      │
│                 │                                   │                           │      │
│         [ Secp256k1 Point Mult ]            [ Secp256k1 Point Mult ]            │      │
│                 │                                   │                           │      │
│         [ Keccak-256 + EIP-55 ]             [ HASH160 + Bech32 Encoding ]       │      │
│                 ▼                                   ▼                           │      │
│        Ethereum (0x5de9...Ac)              Bitcoin Native SegWit (bc1q...3x)    │      │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ Client-Side Vault Security (Zero Server Knowledge):                            │   │
│   │ • Master Password ──► Argon2id KDF (64MB RAM, 3 iterations) ──► 256-bit Key     │   │
│   │ • Plaintext Mnemonic ──► AES-256-GCM Authenticated Encryption ──► IndexedDB    │   │
│   │ • Tab Session Cache: Ephemeral sessionStorage with 10-min rolling timer         │   │
│   │ • Memory Protection: buffer.fill(0) active RAM zeroization on lock/timeout     │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ Offline Transaction Signing (secp256k1):                                       │   │
│   │ [ Unsigned EIP-1559 Tx ] ──► [ Sign with PrivKey in RAM ] ──► [ Signed Hex ]    │   │
│   └──────────────────────────────────────┬─────────────────────────────────────────┘   │
└──────────────────────────────────────────┼─────────────────────────────────────────────┘
                                           │ Direct JSON-RPC (eth_sendRawTransaction)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DECENTRALIZED BLOCKCHAIN NODES                                  │
│                                                                                        │
│   ┌─────────────────────────────┐               ┌──────────────────────────────────┐   │
│   │ Ethereum Mainnet / Sepolia  │               │ Bitcoin SegWit Network           │   │
│   │ • Viem JSON-RPC Multi-Pool  │               │ • Blockstream / Mempool.space    │   │
│   │ • Gas Oracle & Nonce Sync   │               │ • UTXO Tracking & Fee Estimator  │   │
│   └─────────────────────────────┘               └──────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Core Engineering & Cryptographic Concepts

### 1. Zero-Trust Cryptographic Vault & Key Derivation
* **Argon2id Memory-Hard KDF**: Replaces legacy PBKDF2/SHA-256 password hashing with **Argon2id** ($m=65,536\text{ KB}$, $t=3$, $p=1$) using `@noble/hashes`. By demanding 64 MB of dedicated RAM per hash attempt, brute-forcing master passwords on GPUs or ASICs is computationally infeasible.
* **Authenticated Symmetric Encryption (AES-256-GCM)**: Plaintext recovery phrases are encrypted with a 12-byte random CSPRNG initialization vector (`iv`) and sealed with a 16-byte Galois Field authentication tag (`authTag`). Any bit corruption or tampering immediately invalidates decryption.
* **Ephemeral Session Persistence**: Uses an in-memory / `sessionStorage` hybrid cache. Survives page reloads (F5) in the active tab, but **automatically self-destructs the moment the browser tab is closed**.
* **Active RAM Zeroization**: Decrypted private keys exist only in volatile JavaScript memory while unlocked. When locked or after a 10-minute inactivity timeout, buffers are actively scrubbed using `.fill(0)`.

### 2. Multi-Chain Address Derivation (EVM + Bitcoin)
* **BIP-39 Mnemonic Standards**: Cryptographically secure entropy collection supporting 128-bit (12 words) and 256-bit (24 words) recovery phrases with SHA-256 checksum bits.
* **BIP-32 / BIP-44 Hierarchical Deterministic (HD) Paths**:
  * **Ethereum / EVM**: Path `m/44'/60'/0'/0/0` $\rightarrow$ Uncompressed public key $\rightarrow$ `Keccak-256` hashing of $(X, Y)$ coordinates $\rightarrow$ Drop first 12 bytes $\rightarrow$ EIP-55 mixed-case checksum.
  * **Bitcoin Native SegWit (BIP-84)**: Path `m/84'/0'/0'/0/0` $\rightarrow$ Compressed public key (33 bytes) $\rightarrow$ `HASH160` (SHA-256 + RIPEMD-160) $\rightarrow$ Witness program version 0 with 5-bit Bech32 encoding (`bc1q...`).

### 3. EIP-1559 Modern Transaction Architecture
* **Type-2 Envelope Serialization**: Constructs and encodes native EIP-1559 transactions:
  $$\text{Payload} = \text{0x02} \mathbin{\Vert} \text{RLP}\left([ \text{chainId}, \text{nonce}, \text{maxPriorityFeePerGas}, \text{maxFeePerGas}, \text{gasLimit}, \text{to}, \text{value}, \text{data}, \text{accessList} ]\right)$$
* **Base Fee Burn & Priority Tip**:
  $$\text{Total Fee} = \text{Gas Units} \times (\text{Base Fee} + \text{Priority Fee})$$
* **Client-Side ECDSA Offline Signing**: Uses curve `secp256k1` to compute the signature tuple $(r, s, v)$ completely in the browser before broadcasting the signed hex bytecode to the blockchain mempool.
* **Sender Address Extraction**: Demonstrates mathematically how EVM miners recover the originating `from` address from $(r, s, v)$ without transmitting the sender's public key across the wire.

### 4. Smart Contracts & ERC-20 Token Integration
* **EVM Calldata Construction**: Manual calculation of 4-byte function selectors (`0xa9059cbb` for `transfer(address,uint256)`) and 32-byte left-padded hex encoding.
* **Fixed-Point Arithmetic (BigInt)**: Eliminates JavaScript IEEE-754 floating-point inaccuracies when handling token transfers with different decimal precisions (e.g. 6 decimals for USDC/USDT vs. 18 decimals for ETH/DAI).
* **Multi-Chain Verified Registry**: Seamlessly handles testnet assets (Sepolia USDC, LINK, WETH) and Ethereum Mainnet assets (native ETH, USDC, USDT, WBTC, DAI).
* **Custom Token Dynamic Import**: Paste any verified ERC-20 contract address to query `name()`, `symbol()`, `decimals()`, and `balanceOf(address)` directly from the blockchain state.

### 5. Resilient Multi-Provider RPC Failover Tier
* **Zero-Downtime Fallback Transports**: Configures multi-node resilient fallback pools:
  * **Sepolia Testnet**: PublicNode, dRPC, and Ethereum Foundation (`rpc.sepolia.org`).
  * **Ethereum Mainnet**: LlamaRPC, Ankr, Cloudflare, with plug-and-play support for dedicated Alchemy or Infura nodes.
* **Automatic Node Failover**: Network rate limits (HTTP 429) or node timeouts trigger instantaneous switching to healthy secondary RPC endpoints.

---

## 💻 Tech Stack & Codebase Structure

```text
SafeX---Crypto-Wallet/
├── apps/
│   ├── web/                        # Next.js 14 Client-Side Wallet Application
│   │   ├── app/                    # App Router (Dashboard, Send, Receive, History, Status)
│   │   ├── components/             # Reusable UI (TokenAssetsList, ChainSelector, VaultGate, QR)
│   │   └── lib/
│   │       ├── crypto/             # Pure client cryptography (BIP-39, HD Keys, Vault, EIP-1559)
│   │       └── services/           # History, token registry, price service
│   └── server/                     # Lightweight Blockchain Helper & Broadcast Node
│       └── src/
│           └── core/blockchain/    # RPC clients, gas estimation, read/write procedures
├── notes/                          # Deep Technical Handbooks (Phases 1–5), Math Proofs, Infographics
└── Plan/                           # Project Roadmap & Implementation Tracker
```

| Component | Technology | Role in Architecture |
| :--- | :--- | :--- |
| **Frontend UI** | `Next.js 14` + `React 18` + `Tailwind CSS` | Client application, responsive dark-mode dashboard |
| **RAM State** | `Zustand` + `sessionStorage` | Ephemeral in-memory vault state, 10-minute auto-lock |
| **Local Vault Storage** | `IndexedDB` (`safex_db`) | Encrypted ciphertext storage (`salt`, `iv`, `authTag`, `ciphertext`) |
| **Blockchain Engine** | `Viem 2.x` + `@scure/bip32` + `@scure/base` | RLP encoding, multi-provider JSON-RPC, Bech32 & EIP-55 formatting |
| **Cryptography** | `@noble/hashes` (Argon2id, Keccak-256, SHA-256) | Zero-trust client-side key derivation and authenticated encryption |

---

## 🚀 Getting Started Locally

### Prerequisites
* [Node.js](https://nodejs.org/) `>= 20.0.0`
* [npm](https://www.npmjs.com/) `>= 10.0.0`

---

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/Sandipxg/SafeX---Crypto-Wallet.git
cd SafeX---Crypto-Wallet
npm install
```

---

### Step 2: Configure Environment Variables

1. **Frontend Web (`apps/web/.env.local`)**:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
   *Pre-configured defaults:*
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   NEXT_PUBLIC_MAINNET_RPC_URL=https://eth.llamarpc.com
   ```

2. **Backend Server (`apps/server/.env`)**:
   ```bash
   cp apps/server/.env.example apps/server/.env
   ```

---

### Step 3: Run Development Server

Launch the web wallet application:
```bash
npm run dev
```

Open your browser to:
* 🌐 **SafeX Web Application**: [http://localhost:3000](http://localhost:3000)
* 🩺 **System Status & RPC Health**: [http://localhost:3000/status](http://localhost:3000/status)

---

## 🧪 Testing & Verification

Run the client-side cryptographic test suite:

```bash
# Execute unit tests for BIP-39, HD derivation, and AES-GCM vault security
npm run test --workspace=@safex/web
```

---

## 🔮 Phase 6+ Roadmap: Centralized Exchange (CEX) Infrastructure

*Note: SafeX is a progressive learning platform. While Phases 1–5 implement a pure zero-trust self-custodial wallet, upcoming phases demonstrate centralized exchange mechanics:*

* **Phase 6: Exchange Custody & Deposit Sweeper**: Hot/cold wallet segregation, auto-forwarding user deposits.
* **Phase 7: Double-Entry Ledger (PostgreSQL)**: Immutable debits/credits accounting ledger preventing balance drift.
* **Phase 8: High-Throughput Matching Engine**: In-memory limit order book (LOB) matching FIFO bids/asks.
* **Phase 9: Proof of Reserves (PoR)**: Cryptographic Merkle tree reserve audits allowing users to verify solvency.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for full details.
