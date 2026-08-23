# Phase 1: Seed-Phrase Account — Cryptographic Revision Notes

This document contains revision notes and mathematical/technical concepts covered in Phase 1 of the SafeX Crypto Exchange & Wallet build.

---

## Topic 1: CSPRNG & Entropy Collection

### 1. What is Entropy?
* **Definition**: A measure of randomness, unpredictable noise, or state space density in a sequence of bits.
* **Wallet Security**: Entropy is the root of all wallet secrets. Predictable entropy leads directly to key compromise.
* **Sizes**:
  * 128 bits (16 bytes) → 12-word BIP-39 mnemonic.
  * 256 bits (32 bytes) → 24-word BIP-39 mnemonic.

### 2. PRNG vs. CSPRNG
* **PRNG (`Math.random()`)**:
  * Deterministic algorithm (e.g. `xorshift128+`).
  * Observing a small set of outputs allows an attacker to reconstruct the internal seed state and predict future numbers.
  * **❌ Banned for security-sensitive cryptographic operations.**
* **CSPRNG (Cryptographically Secure PRNG)**:
  * Guarantees **Next-Bit Unpredictability** (50% max guess probability).
  * Guarantees **State Compromise Extension** (learning current state reveals nothing about past outputs).

### 3. OS Entropy Gathering
Computers derive true entropy by mixing physical hardware noise into a kernel entropy pool:
* Mouse/keyboard interrupt timings.
* Disk I/O activity timings and network packet arrivals.
* CPU hardware instructions (`RDRAND` / `RDSEED`).
* System calls: Linux `getrandom()` / `/dev/urandom`, Windows `BCryptGenRandom`, macOS `SecRandomCopyBytes`.

### 4. Code API Reference
* **Node.js**:
  ```typescript
  import crypto from 'node:crypto'
  const entropy128 = crypto.randomBytes(16) // Uint8Array / Buffer
  ```
* **Browser / Web Crypto API**:
  ```typescript
  const entropy128 = new Uint8Array(16)
  window.crypto.getRandomValues(entropy128)
  ```

---

## Topic 2: Encoding Schemes

Encoding converts raw non-printable binary data (`Uint8Array`/`Buffer`) into human-readable, transferable text strings.

### 1. Hexadecimal (Base16)
* **Alphabet**: `0-9`, `a-f` (or `A-F`), usually prepended with `0x`.
* **Density**: 1 byte = 2 hex characters.
* **Usage**: Ethereum / EVM (addresses, signatures, contract bytecode).

### 2. Base64
* **Alphabet**: `A-Z`, `a-z`, `0-9`, `+`, `/`, with `=` padding.
* **Density**: 3 bytes = 4 characters.
* **Drawbacks for Wallets**: Visually ambiguous characters (`0`/`O`, `1`/`I`/`l`) and URL-unsafe punctuation (`+`, `/`).

### 3. Base58 (Satoshi Nakamoto)
* **Alphabet** (58 chars): `123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`
* **Exclusions**: Strips 6 confusing characters: `0`, `O`, `I`, `l`, `+`, `/`.
* **Usage**: Bitcoin legacy addresses, Solana public keys & signatures.

### 4. Base58Check
Adds checksum validation to Base58 to prevent typos from resulting in lost funds.
* **Payload Structure**: `[Version Byte] + [Data Bytes / PubKey Hash] + [4-Byte Checksum]`
* **Checksum Math**: First 4 bytes of `SHA256(SHA256(Version + Data))`.

### 5. Bech32 / Bech32m
* **Alphabet**: 32 lowercase characters (`0-9`, `a-z` excluding `1`, `b`, `i`, `o`).
* **Format**: `[HRP] + "1" + [Data Payload] + [Checksum]`
* **Checksum**: Uses BCH (Bose-Chaudhuri-Hocquenghem) polynomial error detection over $GF(32)$.
* **Usage**: Modern Bitcoin SegWit (`bc1q...`), Taproot (`bc1p...`), Cosmos.

### Encoding Matrix Summary

| Encoding | Base Size | Case Sensitive? | Checksum / Typo Protection? | Primary Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hex (Base16)** | 16 | No (`0x` prefix) | No (EIP-55 capitalizes bytes for checksum) | EVM (Ethereum, Polygon, Arbitrum) |
| **Base64** | 64 | Yes | No | Web APIs, JWTs, HTTP payloads |
| **Base58** | 58 | Yes | No | Solana, Ripple |
| **Base58Check**| 58 | Yes | **Yes** (4-byte double SHA-256) | Legacy Bitcoin (`1...`, `3...`) |
| **Bech32 / Bech32m** | 32 | **No** (Lowercase) | **Yes** (BCH Polynomial Error Code) | Modern Bitcoin SegWit (`bc1q...`), Taproot (`bc1p...`) |

---

## Topic 3: Cryptographic Hash Functions — SHA-256

### 1. Core Properties
1. **Fixed Output**: Always 256 bits (32 bytes / 64 hex characters).
2. **Deterministic**: Same input always yields the exact same hash.
3. **Pre-Image Resistance (One-Way)**: Impossible to reverse a hash back to its input.
4. **Collision Resistance**: Practically impossible to find $m_1 \neq m_2$ where $\text{SHA256}(m_1) = \text{SHA256}(m_2)$.
5. **Avalanche Effect**: Changing a single bit in the input flips ~50% of the output bits randomly.

### 2. Internal Mechanics
* **Structure**: Merkle–Damgård Construction.
* **Block Size**: 512 bits (64 bytes).
* **Rounds**: 64 compression rounds using bitwise XOR, AND, NOT, bit shifts, and 64 constants derived from cube roots of the first 64 prime numbers.

---

### 3. Base58Check Encoding & Verification Diagrams

#### Encoding Flow:

```text
payload
   ↓
SHA-256
   ↓
SHA-256
   ↓
take first 4 BYTES
   ↓
checksum
```

#### Final Assembly:

```text
payload + checksum
        ↓
     Base58
        ↓
     ADDRESS
```

#### Formula:

```text
Base58(
    payload +
    SHA256(
        SHA256(payload)
    )[0:4]
)
```

#### Verification Flow:

```text
Address
   ↓
Base58 decode
   ↓
payload + checksum
       │
       ├── payload
       │     ↓
       │  SHA256
       │     ↓
       │  SHA256
       │     ↓
       │  first 4 bytes
       │
       └── stored checksum

calculated == stored ?
       ↓
    ✅ valid
    ❌ invalid
```

---

## Topic 4: Cryptographic Hash Functions — Keccak-256

### 1. What is a Hash Function?
Think of any hash function as a **meat grinder** or a **blender**:
* You put any amount of text, file, or data into the top.
* It scrambles and crushes it deterministically.
* Out comes a fixed-size string of length 256 bits (which looks like **64 hex characters**).

### 2. The Sponge Analogy: How Keccak Works Inside
SHA-256 (used in Bitcoin) processes data like a chain of linked blocks (Merkle-Damgård). 

**Keccak-256** works like a **Sponge** with a 1,600-bit internal memory tank ($5 \times 5 \times 64$ grid of bits).

```text
       MESSAGE DATA
            │
            ▼
┌─────────────────────────┐
│ Rate (r)    = 1088 bits │ ◄── [Data is absorbed here]
├─────────────────────────┤
│ Capacity (c)=  512 bits │ ◄── [Hidden Security Buffer]
└─────────────────────────┘
      Sponge (1600 bits)
```

It operates in **2 Simple Steps**:

#### Step 1: Absorbing Phase (Soaking up data)
1. Your message (e.g. `"hello"`) is split into chunks of 1088 bits (the **Rate** $r$).
2. The first chunk is mixed into the top 1088 bits of the sponge state.
3. The sponge scrambles its entire 1600-bit state 24 times (using bit shifts, XORs, ANDs).
4. If there is more data, the next chunk is mixed in and scrambled again.

#### Step 2: Squeezing Phase (Wringing out the hash)
Once all data is absorbed:
* You wring out the top **256 bits** (32 bytes) from the Rate section of the sponge.
* That 256-bit slice is your final **Keccak-256 Hash**!

---

### 3. Keccak-256 vs. NIST SHA-3 (Crucial Distinction!)

Why are there two things called Keccak and SHA-3?

Imagine a chef invents a recipe called **"Keccak"**:
1. **In 2014**: Ethereum creators needed a hash function. They loved the Keccak recipe and built Ethereum around it.
2. **In 2015**: The US Standards Institute (NIST) adopted Keccak as the official **SHA-3** standard, **BUT** they made one tiny modification: they added a different ending flag (`0x06` instead of `0x01`).

Because of that 1-byte change:
* `Keccak256("hello")` $\rightarrow$ `1c8aff7ebd2ac47b...`
* `NIST SHA3-256("hello")` $\rightarrow$ `3338be694f50c5f2...`

They produce **completely different outputs**!

> 💡 **Key Takeaway**: Ethereum uses the **original 2014 Keccak-256**, **NOT** the official 2015 NIST SHA-3!
>
> ⚠️ **Common Bug**: Node.js `crypto.createHash('sha3-256')` generates **NIST SHA-3**, which produces a different output than Ethereum's `keccak256`. Always use libraries like `@noble/hashes/sha3` (`keccak_256`) or `viem`.

---

### 4. Real Example: Deriving an Ethereum Address

How does Ethereum use Keccak-256 to create your `0x...` address?

```text
[ Uncompressed Public Key ]  (64 Bytes / 128 Hex Chars)
             │
             ▼
      Keccak-256 Hash
             │
             ▼
[ 32-Byte Hash Output ]     (64 Hex Chars)
             │
   (Drop first 12 bytes)
             │
             ▼
[ Last 20 Bytes ]           (40 Hex Chars)
             │
     (Add "0x" prefix)
             │
             ▼
  0x71C7656EC7ab88b098def... (Your EVM Address!)
```

#### Step-by-Step Derivation Trace:
1. Start with **Public Key**: 64 raw bytes (excluding `0x04` uncompressed prefix).
2. Hash with **Keccak-256**: `Keccak256(PublicKey)` $\rightarrow$ 32-byte hash (e.g. `c03264b38d3871c7656ec7ab88b098def1234567...`).
3. Truncate: Discard `c03264b38d38` (first 12 bytes / 24 hex characters).
4. Take remaining **last 20 bytes** (40 hex characters): `71c7656ec7ab88b098def...`
5. Prepend `0x`: `0x71c7656ec7ab88b098def...` (Your EVM Address).

---

### 5. Code API Reference (TypeScript)

```typescript
import { keccak_256 } from '@noble/hashes/sha3'
import { bytesToHex } from '@noble/hashes/utils'

// Input bytes or string
const msg = new TextEncoder().encode('Hello SafeX')
const hashBytes = keccak_256(msg)

console.log(bytesToHex(hashBytes))
// Outputs 32-byte (64 hex char) Keccak-256 hash
```

```
