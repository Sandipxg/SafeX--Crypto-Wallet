# 🧬 Phase 2 — HD Multi-Address Wallet (SafeX Engineering Handbook)

# Chapter 2.1 — Elliptic Curve Mathematics (`secp256k1`)

> **Objective**: Understand the exact mathematics behind wallet key generation without drowning in academic jargon.

### Key Takeaways Covered in this Lesson:
- Why Bitcoin and Ethereum chose `secp256k1`.
- What an elliptic curve actually is.
- What points, scalars, and the generator point $G$ mean.
- Why scalar multiplication is a one-way function.
- Why this creates un-hackable non-custodial crypto wallets.

---

## 1. Demystifying the Name "Elliptic Curve"

Despite the name, elliptic curves are not ellipses!

The `secp256k1` elliptic curve used by Bitcoin and Ethereum is described by a simple Weierstrass equation:

$$y^2 = x^3 + 7$$

Everything in Bitcoin and Ethereum wallet security starts from this single equation.

### 💡 Mathematical Intuition
This curve isn't just a continuous smooth drawing; it defines a **set of valid mathematical coordinates $(x, y)$** over a finite prime field. A coordinate $(x, y)$ is a valid point on the curve **only if** it satisfies $y^2 = x^3 + 7 \pmod p$.

---

## 2. What is a Point?

The curve contains billions of valid discrete coordinate points $(x, y)$.

| Point | Cryptographic Meaning |
| :--- | :--- |
| **$P = (x, y)$** | A valid coordinate location on the curve. |
| **$Q = (x, y)$** | Another valid coordinate location. |
| **$G = (x, y)$** | The special standardized **Generator Point**. |

> 🔑 **Huge Realization**: A Public Key is literally just a valid coordinate Point $(x, y)$ on the curve!

---

## 3. The Generator Point ($G$)

$G$ is one of the most important concepts in Elliptic Curve Cryptography (ECC).

- $G$ is a predefined, hardcoded starting coordinate point chosen by the `secp256k1` specification.
- Nobody "generates" or changes it. Every Ethereum wallet, Bitcoin node, and SafeX instance uses the exact same $G$.

### 🗺️ Analogy
| Real World | Elliptic Curve Cryptography (ECC) |
| :--- | :--- |
| **Origin on a map** (0,0) | **Generator Point $G$** |
| Everyone starts navigating from the origin | Every wallet derives keys starting from $G$ |

### What does $G$ look like in Hexadecimal?
Its coordinates are fixed 256-bit numbers:

```text
G.x = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
G.y = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8
```

---

## 4. What is a Scalar?

In mathematics, a **scalar** is simply a single integer number (a 1D magnitude).

| Scalar Term | Meaning in ECC |
| :--- | :--- |
| `5` | Multiply generator point by 5 |
| `25` | Multiply generator point by 25 |
| **Private Key** | A giant, randomly generated 256-bit scalar integer |

> 💡 **Core Identity**: **Private Key = 256-Bit Scalar Integer**

---

## 5. Scalar Multiplication (The Heart of Wallets)

This is the core formula used to derive a Public Key from a Private Key:

$$\text{PublicKey} = \text{PrivateKey} \times G$$

### Visual Walk:
Suppose your Private Key (scalar) is `7`:

$$7G = G + G + G + G + G + G + G$$

We "walk" 7 times across the curve following elliptic curve point-addition rules. The final destination coordinate point $(x, y)$ is your **Public Key**!

```text
[ G ] ──+G──► [ 2G ] ──+G──► [ 3G ] ... ──+G──► [ 7G = Public Key Point (x,y) ]
```

---

## 6. Normal Math vs. ECC Math

| Property | Normal Arithmetic | Elliptic Curve Arithmetic (ECC) |
| :--- | :--- | :--- |
| **Formula** | $5 \times 2 = 10$ | $5 \times G = P$ |
| **Output Type** | Another number ($10$) | A coordinate point $P = (x, y)$ |
| **Reversibility** | Easy division ($10 / 2 = 5$) | **No practical inverse division algorithm!** |

The output of scalar multiplication is not another number — it is a geometric coordinate $(x, y)$ on the curve.

---

## 7. Why is the Reverse Impossible? (ECDLP)

```text
EASY DIRECTION (Forward):
Private Key (Scalar) ──► [ Scalar Multiplication ] ──► Public Key Point (x, y)

IMPOSSIBLE DIRECTION (Reverse):
Public Key Point (x, y) ──► [ ??? Cannot Divide ] ──► Private Key (Scalar)
```

This one-way mathematical difficulty is called the:

### 🛡️ Elliptic Curve Discrete Logarithm Problem (ECDLP)
No algorithm exists in computer science to reverse a public key point $P$ back to its scalar private key $k$. This property forms the security bedrock of Bitcoin and Ethereum.

### 🌌 Astronomical State Space
Private keys range from $1$ to $2^{256} - 1$:

$$\approx 1.1579 \times 10^{77} \text{ possible private keys}$$

Even if a supercomputer checked 1 trillion private keys every single second, it would take billions of times longer than the age of the universe to brute-force a private key!

---

## 8. Why `secp256k1`?

| Property | Architectural Advantage |
| :--- | :--- |
| **256-bit Security** | Equivalent to 3072-bit RSA key strength |
| **Koblitz Curve** | Efficient, deterministic point doubling & addition algorithms |
| **Zero Hidden Backdoors** | Constants ($y^2 = x^3 + 7$) chosen transparently without arbitrary parameters |
| **Maturity** | Selected by Satoshi Nakamoto for Bitcoin in 2009; inherited by Ethereum |

---

## 9. `secp256k1` vs `Ed25519`

| Feature | `secp256k1` | `Ed25519` |
| :--- | :--- | :--- |
| **Chains Used** | Ethereum, Bitcoin, Polygon, Arbitrum, BSC | Solana, Aptos, Near, Sui, Cardano |
| **Signature Scheme** | **ECDSA** (Elliptic Curve Digital Signature Algorithm) | **EdDSA** (Edwards-curve Digital Signature Algorithm) |
| **Formula** | $PublicKey = PrivateKey \times G$ | Twisted Edwards Curve $r x^2 + y^2 = 1 + d x^2 y^2$ |
| **PubKey Recovery** | Supports Recovery ID ($v$) to derive address from signature | No public key recovery from signature |

```text
SafeX Multi-Chain Support:
├── Ethereum / EVM  ──► secp256k1
├── Bitcoin         ──► secp256k1
└── Solana          ──► Ed25519
```

---

## 10. How SafeX Uses ECC

```text
User Clicks "Create Wallet"
          │
          ▼
Generate 256-bit Random Number (entropy.ts)
          │
          ▼
Private Key (Scalar k)
          │
          ▼
ECC Scalar Multiplication (k × G) via @noble/secp256k1
          │
          ▼
Public Key Point (x, y)
          │
          ├── Keccak-256 ──► Ethereum Address (0x...)
          └── HASH160    ──► Bitcoin Address (bc1q...)
```

---

## 12. 🎯 Interview & Concept Revision Cheat Sheet

| Question | Standard Engineering Answer |
| :--- | :--- |
| **What is a Private Key?** | A cryptographically secure random 256-bit scalar integer $k \in [1, 2^{256}-1]$. |
| **What is a Public Key?** | A coordinate point $P = (x, y)$ on `secp256k1` derived via scalar multiplication $P = k \times G$. |
| **Why can't someone reverse a Public Key?** | Solves the ECDLP (Elliptic Curve Discrete Logarithm Problem), which is computationally infeasible. |
| **Which curve does Ethereum use?** | `secp256k1` (Koblitz curve $y^2 = x^3 + 7$). |
| **Which curve does Solana use?** | `Ed25519` (Edwards curve). |

---

# Chapter 2.2 — BIP32 Extended Keys (`xprv`/`xpub`) & Hardened Derivation

> **Objective**: Understand how a single seed phrase generates billions of sub-accounts without leaking master private keys.

---

## 1. What Problem Does BIP32 Solve?

Before BIP32 was invented:
- Wallets were **"JBOK" (Just a Bag Of Keys)**. Every time you wanted a new receiving address, your wallet generated a new, completely unrelated random private key.
- **The Disaster**: If you backed up your 12 words on paper on Monday, and generated a new address on Tuesday, your paper backup did **NOT** contain Tuesday's key!

### The BIP32 Solution:
BIP32 (Hierarchical Deterministic Wallets) allows **1 master seed** to derive an infinite tree of child keys deterministically:

```text
                       Master Seed (64 Bytes)
                                 │
                                 ▼
                         Master Node (m)
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
   Ethereum Branch (m/44'/60'/0')                Bitcoin Branch (m/84'/0'/0')
         │                                               │
   ┌─────┴─────┐                                   ┌─────┴─────┐
   ▼           ▼                                   ▼           ▼
Address #0   Address #1                          Address #0   Address #1
```

If you back up your 12 words once, you have backed up **every future address forever**!

---

## 2. What are Extended Keys (`xprv` and `xpub`)?

A regular private key is **32 bytes**. A regular public key is **33 bytes**.

An **Extended Key** is **78 bytes** long because it attaches an extra 32-byte secret called the **Chain Code**.

$$\text{Extended Key (78 Bytes)} = \text{Key (32B or 33B)} + \text{Chain Code (32B)} + \text{Depth/Metadata (13B)}$$

---

### 🔑 `xprv` (Extended Private Key)
- Format: Base58 string starting with `xprv...`
- Contains: **Master Private Key + Chain Code**
- **Capability**: Can derive **ALL child private keys** AND **all child public keys**.

---

### 👁️ `xpub` (Extended Public Key)
- Format: Base58 string starting with `xpub...`
- Contains: **Master Public Key + Chain Code**
- **Capability**: Can derive **ALL child public keys**, but CANNOT derive any private keys!

> 💡 **Real-World E-Commerce Use Case**:
> An online store (like Shopify) puts your `xpub` on its web server. The web server can generate a fresh new payment address (`0x...` or `bc1q...`) for every customer checkout **without ever storing any private keys on the web server!** Even if hackers breach the server, they cannot steal any funds.

---

## 3. What is the Chain Code (32 Bytes)?

Why do we need the Chain Code?

If we derived child keys using *only* the parent public key, someone who knows Address #1 could easily guess Address #2. 

The **Chain Code** acts as a 32-byte secret salt during HMAC-SHA512 hashing:

$$\text{Child Key} = \text{HMAC-SHA512}(\text{Key}=\text{Parent Chain Code}, \text{Data}=\text{Parent Key} + \text{Index})$$

It ensures that child keys look completely random and unrelated to outside observers.

---

## 4. 🚨 The Fatal Security Leak: Why "Hardened Derivation" (`'`) Exists!

This is the most famous security concept in HD wallet engineering.

### Non-Hardened Derivation (Normal: `/0/0`)
In non-hardened derivation, child public keys are derived using the **Parent Public Key**:

$$\text{Child Public Key} = \text{Parent Public Key} + \text{HMAC-SHA512}(\text{Parent xpub}, \text{index}) \times G$$

### ⚠️ The Vulnerability (Master Key Recovery Attack):
Suppose an attacker obtains:
1. Your **Parent `xpub`** (which is public!).
2. **ONE single child private key** (e.g. child #0 private key leaks from a compromised phone).

Because of non-hardened elliptic curve math:

$$\text{Parent Private Key} = \text{Child Private Key} - \text{HMAC-SHA512}(\text{Parent xpub}, \text{index})$$

The attacker can do simple subtraction and **calculate your Master Private Key!** Once they have your Master Private Key, they can steal funds from **EVERY chain and EVERY account on your wallet!**

---

### 🛡️ The Solution: Hardened Derivation (`'`)

To stop this attack, BIP32 introduced **Hardened Derivation**, denoted by an apostrophe `'` or `h` (e.g. `m/44'/60'/0'`).

In Hardened Derivation:
- The child key is derived using the **Parent PRIVATE KEY** instead of the Parent Public Key.

$$\text{Hardened Child} = \text{HMAC-SHA512}(\text{Parent Chain Code}, \text{Parent PRIVATE Key} + \text{Index})$$

- Because the Parent Public Key (`xpub`) is **NOT** used in the math, an attacker who steals a child private key **CANNOT reverse-calculate the parent private key!**

---

## 5. Summary Rule of Thumb for Derivation Paths

Look at our Ethereum & Bitcoin derivation paths:

$$\text{Ethereum: } m / \underbrace{44'}_{\text{Hardened}} / \underbrace{60'}_{\text{Hardened}} / \underbrace{0'}_{\text{Hardened}} / \underbrace{0}_{\text{Normal}} / \underbrace{0}_{\text{Normal}}$$

$$\text{Bitcoin: } m / \underbrace{84'}_{\text{Hardened}} / \underbrace{0'}_{\text{Hardened}} / \underbrace{0'}_{\text{Hardened}} / \underbrace{0}_{\text{Normal}} / \underbrace{0}_{\text{Normal}}$$

| Level | Path Segment | Derivation Type | Why? |
| :--- | :--- | :--- | :--- |
| **Purpose** | `44'` or `84'` | 🔒 **Hardened (`'`)** | Prevents cross-purpose key leaks. |
| **Coin Type** | `60'` (ETH) or `0'` (BTC) | 🔒 **Hardened (`'`)** | Prevents Bitcoin key leaks from compromising Ethereum keys. |
| **Account** | `0'` (Account #1) | 🔒 **Hardened (`'`)** | Isolates user accounts completely. |
| **Change** | `0` (External receive) | 🔓 **Non-Hardened** | Allows `xpub` view-only tracking. |
| **Index** | `0` (Address index) | 🔓 **Non-Hardened** | Allows generating infinite receiving addresses. |

---

## 🎯 Revision Summary Checklist

- [x] **BIP32**: Derives an infinite tree of keys from 1 master seed.
- [x] **`xprv`**: Extended Private Key ($Key + ChainCode$). Can derive private + public keys.
- [x] **`xpub`**: Extended Public Key ($PubKey + ChainCode$). Can derive public keys only (ideal for view-only apps).
- [x] **Non-Hardened Leak Risk**: Leaking 1 child private key + parent `xpub` allows an attacker to compute the parent master private key.
- [x] **Hardened Derivation (`'`)**: Uses parent private key in HMAC-SHA512 hash, completely blocking reverse key calculation attacks.

---

# Chapter 2.3 — Address Formats (EVM EIP-55 & Bitcoin Evolutions)

> **Objective**: Understand how raw cryptographic public keys are converted into user-friendly, typo-protected receiving addresses across different blockchains.

---

## 🌐 Part 1: Ethereum / EVM Address Formats

An Ethereum address is derived by taking the **Keccak-256** hash of the 64-byte uncompressed public key and extracting the **last 20 bytes (40 hex characters)**.

However, there are two ways to display this address:

---

### 1. Raw Un-Checksummed Address (Dangerous 🛑)
- **Format**: All lowercase 40-character hex string.
- **Example**: `0x71c7656ec7ab88b098def1734b743b44628b36d2`
- **The Fatal Flaw**: Hex strings (`0-9`, `a-f`) contain **zero built-in error checking**. If a user mistypes 1 character (e.g., typing `a` instead of `b`), the network will happily send funds to that corrupted address, burning the money forever!

---

### 2. EIP-55 Checksummed Address (Gold Standard 🟢)
Invented by Vitalik Buterin in 2016 (EIP-55).

- **Format**: Mixed-case capitalization string.
- **Example**: `0x71C7656EC7ab88b098def1734b743b44628b36d2`

#### ⚙️ How EIP-55 Checksumming Works (The Algorithm):

1. Take the lowercase 40-character address: `"71c7656ec7ab88b098def1734b743b44628b36d2"`.
2. Compute `hash = Keccak256("71c7656ec7ab88b098def1734b743b44628b36d2")`.
3. Look at each character $i$ in the address:
   - Look at the $i$-th hex digit of the hash.
   - If the hash digit is **$\ge 8$** (i.e. `8, 9, a, b, c, d, e, f`), **CAPITALIZE** the character!
   - If the hash digit is **$< 8$**, keep it **lowercase**!

```text
Address char:   7   1   c   7   6   5   6   e   c   7   a   b ...
Hash hex digit: 3   f   c   9   2   1   8   b   d   4   e   a ...
               │   │   │   │   │   │   │   │   │   │   │   │
               ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼
Final EIP-55:   7   1   C   7   6   5   6   E   C   7   a   b ...
                       ▲                   ▲   ▲
                  (Capitalized!)       (Capitalized!)
```

#### Why this is brilliant:
EIP-55 requires zero additional bytes! It uses capitalization patterns as an **invisible checksum**. If a user mistypes a single letter or pastes a corrupted string into SafeX, `viem` or `ethers` rejects the address instantly!

---

## ₿ Part 2: Bitcoin Address Formats (The 4 Generations)

Bitcoin addresses have evolved through **4 distinct generations** to reduce block data sizes, lower transaction fees, and improve privacy.

```text
2009: Legacy (P2PKH)        ──►  Starts with "1..."   (Base58Check)
2012: Script Hash (P2SH)     ──►  Starts with "3..."   (Base58Check)
2017: Native SegWit (P2WPKH) ──►  Starts with "bc1q..." (Bech32)  <-- SafeX Implementation!
2021: Taproot (P2TR)        ──►  Starts with "bc1p..." (Bech32m)
```

---

### 1. Legacy (P2PKH — Pay-to-PubKey-Hash)
- **Introduced**: 2009 (Satoshi Nakamoto)
- **Starts with**: **`1...`** (e.g. `1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2`)
- **Encoding**: **Base58Check** (Uses Base58 + 4-byte double SHA-256 checksum).
- **Drawback**: Signatures are stored directly inside the main transaction data. This takes up massive block space, resulting in **highest transaction fees**.

---

### 2. Pay-to-Script-Hash (P2SH)
- **Introduced**: 2012 (BIP-16)
- **Starts with**: **`3...`** (e.g. `3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy`)
- **Encoding**: Base58Check
- **Primary Use**: Multi-signature wallets and wrapped SegWit (`P2SH-P2WPKH`).

---

### 3. Native SegWit (P2WPKH — Bech32) 🌟 *(SafeX Implementation in `btc.ts`)*
- **Introduced**: 2017 (BIP-173 / Segregated Witness)
- **Starts with**: **`bc1q...`** (e.g. `bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu`)
- **Encoding**: **Bech32** (32-character lowercase alphabet).

#### 🚀 Why Native SegWit (`bc1q...`) is Superior:
1. **30–40% Lower Transaction Fees**: Signatures are moved ("segregated") to a separate witness data block that gets a 75% fee discount!
2. **Built-in BCH Error Correction**: Bech32 checksum polynomial can detect up to 4 mistyped characters and identify their exact position.
3. **QR-Code Friendly**: 100% lowercase string makes QR codes smaller and easier for camera scanners to read.

---

### 4. Taproot (P2TR — Bech32m)
- **Introduced**: 2021 (BIP-340 / BIP-341 / BIP-350)
- **Starts with**: **`bc1p...`** (e.g. `bc1p0xlxvlhemja6...`)
- **Encoding**: **Bech32m**
- **Key Feature**: Uses **Schnorr Signatures** and MAST (Merkelized Alternative Script Trees).
- **Advantage**: Makes complex multi-signature smart contract transactions look **identical** to single-key transactions on-chain (maximum privacy + lowest storage fees!).

---

## 📊 Summary Comparison Matrix

| Address Standard | Network | Prefix | Encoding | Typo Protection | Fee Tier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EVM EIP-55** | Ethereum / EVM | `0x...` | Mixed-Case Hex | ✅ Keccak-256 Capitalization | Standard |
| **BTC Legacy (P2PKH)** | Bitcoin | `1...` | Base58Check | ✅ 4-Byte Double SHA-256 | 🔴 Highest Fees |
| **BTC Script (P2SH)** | Bitcoin | `3...` | Base58Check | ✅ 4-Byte Double SHA-256 | 🟡 Medium Fees |
| **BTC Native SegWit** | Bitcoin | `bc1q...` | **Bech32** | ✅ BCH Polynomial Error Code | 🟢 **Lowest Fees** |
| **BTC Taproot** | Bitcoin | `bc1p...` | **Bech32m** | ✅ BCH Polynomial Error Code | 🟢 **Lowest Fees + Max Privacy** |

---

# Chapter 2.4 — BIP44 Multi-Chain Derivation Paths (`m/44'/60'/0'/0/0`)

> **Objective**: Master the 5-level hierarchical derivation path standard that allows a single seed phrase to manage hundreds of blockchains cleanly.

---

## 1. What is BIP44?

BIP44 is an industry-wide specification building on BIP32 that defines a strict 5-level derivation path formula for multi-chain HD wallets:

$$m / \text{purpose}' / \text{coin\_type}' / \text{account}' / \text{change} / \text{address\_index}$$

```text
                                  m (Master Key)
                                  │
                       purpose'   │ (44' = BIP44 Multi-Chain Standard)
                                  ▼
                            m / 44'
                                  │
                      coin_type'  │ (60' = Ethereum, 0' = Bitcoin, 501' = Solana)
                                  ▼
                        m / 44' / 60'
                                  │
                       account'   │ (0' = Account #1, 1' = Account #2)
                                  ▼
                    m / 44' / 60' / 0'
                                  │
                        change    │ (0 = External Receiving, 1 = Internal Change)
                                  ▼
                  m / 44' / 60' / 0' / 0
                                  │
                 address_index    │ (0 = Address #1, 1 = Address #2 ...)
                                  ▼
                m / 44' / 60' / 0' / 0 / 0  ──►  0x71C7656EC7...
```

---

## 2. The 5 Path Segments In-Depth

### Level 1: `purpose'` (Hardened)
- Identifies the BIP specification rule being followed.
- `44'`: Standard BIP-44 multi-chain structure (Ethereum, Polygon, BSC, Legacy BTC).
- `84'`: Standard BIP-84 Native SegWit Bitcoin (`bc1q...`).
- `86'`: Standard BIP-86 Taproot Bitcoin (`bc1p...`).

### Level 2: `coin_type'` (Hardened)
- Registered cryptocurrency index in the global **SLIP-0044** registry.
- `60'`: **Ethereum (ETH)** (reused by all EVM-compatible chains: Polygon, Arbitrum, Base, BSC).
- `0'`: **Bitcoin (BTC)**.
- `501'`: **Solana (SOL)**.
- `2'`: Litecoin (LTC).
- **Hardened (`'`) Protection**: Prevents a security flaw or key compromise on one blockchain branch from exposing keys on a different blockchain!

### Level 3: `account'` (Hardened)
- Allows users to split their wallet into multiple logical accounts (e.g. Account #1, Account #2, Savings, Trading).
- `0'`: Primary Account #1.
- `1'`: Secondary Account #2.

### Level 4: `change` (Non-Hardened)
- Distinguishes receiving addresses from internal change addresses.
- `0`: **External Receiving Address** (shared publicly to receive payments).
- `1`: **Internal Change Address** (used by UTXO chains like Bitcoin to receive remaining balance outputs after sending a transaction).

### Level 5: `address_index` (Non-Hardened)
- Sequential index for individual receiving addresses under an account (`0`, `1`, `2`, `3` ...).

---

## 3. Real-World Multi-Chain Derivation Matrix

| Blockchain | Standard | Derivation Path | Derived Address Format |
| :--- | :--- | :--- | :--- |
| **Ethereum (EVM)** | BIP-44 | `m/44'/60'/0'/0/0` | `0x71C7656EC7ab88b098def...` |
| **Polygon (EVM)** | BIP-44 | `m/44'/60'/0'/0/0` | `0x71C7656EC7ab88b098def...` |
| **Arbitrum / Base** | BIP-44 | `m/44'/60'/0'/0/0` | `0x71C7656EC7ab88b098def...` |
| **Bitcoin (Native SegWit)** | BIP-84 | `m/84'/0'/0'/0/0` | `bc1qcr8te4kr609gcawut...` |
| **Bitcoin (Taproot)** | BIP-86 | `m/86'/0'/0'/0/0` | `bc1p0xlxvlhemja6...` |
| **Solana** | BIP-44 (Ed25519) | `m/44'/501'/0'/0'` | `7xKXtg2CW87d97TX...` |

---

## 🎯 Key Takeaway
BIP-44 enables **true interoperability**. Because derivation paths are standardized globally, when a user imports their SafeX 12-word seed phrase into Trust Wallet or MetaMask, the exact same accounts and addresses appear seamlessly!



