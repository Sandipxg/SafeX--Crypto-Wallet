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

---

## Topic 5: Symmetric Encryption (AES-256-GCM & IV/Nonces)

### 1. Introduction: Symmetric vs. Asymmetric Encryption
* **Symmetric Encryption**: Uses a **single shared secret key** ($K$) for both encryption and decryption.
  $$\text{Ciphertext} = E(K, \text{Plaintext})$$
  $$\text{Plaintext} = D(K, \text{Ciphertext})$$
* **Primary Wallet Use Case**: Encrypting sensitive wallet secrets (such as raw seed phrases or master seed entropy) on disk/database so that even if the database is leaked, the secrets remain unreadable without the user's password.

---

### 2. AES-256-GCM Breakdown
* **AES (Advanced Encryption Standard)**: Block cipher algorithm operating on fixed 128-bit (16-byte) blocks.
* **256-Bit Key**: Key size of 256 bits (32 bytes / 64 hex characters) — the mandatory crypto wallet security standard.
* **GCM (Galois/Counter Mode)**: An **AEAD** (Authenticated Encryption with Associated Data) mode that turns block encryption into a stream cipher via counter increments and computes a Galois authentication tag for tamper resistance.

### Cipher Modes Comparison:

| Mode | Authenticated? | Security Status | Primary Characteristic / Flaw |
| :--- | :--- | :--- | :--- |
| **ECB** | ❌ No | 🛑 **Banned** | Identical plaintext blocks produce identical ciphertext blocks (leaks structural patterns). |
| **CBC** | ❌ No | ⚠️ **Unsafe without HMAC** | Chains blocks with IV, but lacks built-in integrity verification (vulnerable to bit-flipping). |
| **GCM** | ✅ **Yes (AEAD)** | 🟢 **Gold Standard** | Combines CTR stream mode encryption with a Galois MAC. Guarantees Confidentiality + Integrity + Authenticity. |

---

### 3. IV / Nonce & Auth Tag Mechanics

* **IV / Nonce (Initialization Vector / Number Used Once)**:
  * Standard length: 96 bits (**12 bytes**).
  * Purpose: Randomizes encryption so that encrypting the same data twice with the same key produces completely different ciphertexts.
  * 🚨 **CRITICAL SECURITY RULE**: **NEVER reuse an IV under the same key!** Reusing an IV in GCM mode allows an attacker to XOR ciphertexts together, cancel out the keystream, and recover plaintexts.
* **Authentication Tag (Auth Tag / MAC)**:
  * Standard length: 128 bits (**16 bytes**).
  * Purpose: Guarantees ciphertext integrity and authenticity. If an attacker modifies even a single bit in the stored database payload, decryption fails immediately with an authentication error.

---

### 4. End-to-End Visual Encryption & Decryption Flow

#### Encryption Flow:
```text
Plaintext Seed Phrase: "wallet index isolate ..."
Key:                    32-Byte Secret Buffer
IV:                     12-Byte Random Buffer (CSPRNG)
                               │
                               ▼
                        [ AES-256-GCM ]
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
       Encrypted Ciphertext            16-Byte Auth Tag
```

#### Decryption Flow:
```text
Inputs: Encrypted Ciphertext + 12-Byte IV + 16-Byte Auth Tag + 32-Byte Secret Key
                               │
                               ▼
                        [ AES-256-GCM ]
                               │
                Verify Auth Tag vs Recalculated Tag
                               │
             ┌─────────────────┴─────────────────┐
             ▼                                   ▼
        ✅ Valid                              ❌ Invalid
 Return Decrypted Plaintext              Throw Auth Error!
```

---

### 5. Node.js Code Implementation

```typescript
import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits standard for GCM

/**
 * Encrypts plaintext string using AES-256-GCM
 */
export function encrypt(plaintext: string, key: Buffer) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex')
  ciphertext += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return {
    iv: iv.toString('hex'),
    ciphertext,
    authTag: authTag.toString('hex'),
  }
}

/**
 * Decrypts ciphertext and verifies Auth Tag
 */
export function decrypt(
  encryptedData: { iv: string; ciphertext: string; authTag: string },
  key: Buffer
): string {
  const iv = Buffer.from(encryptedData.iv, 'hex')
  const authTag = Buffer.from(encryptedData.authTag, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedData.ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8') // Throws error if Auth Tag verification fails

  return decrypted
}
```

---

## Topic 6: Password/Secret Hashing & Key Derivation Functions (KDFs)

### 1. Why Fast Hashes (SHA-256) Fail for Encryption Keys & Passwords
* Fast hash functions (SHA-256, Keccak-256) are optimized for throughput (calculating billions of hashes/sec on GPUs).
* Using `SHA256(user_password)` as an encryption key allows attackers to brute-force dictionary passwords in milliseconds.
* **Goal**: Password hashing must be deliberately **slow, compute-intensive, and memory-heavy** to defend against offline hardware cracking.

---

### 2. Defensive Mechanics: Salt, Pepper & Cost Factors

$$\text{Vault Key } K_{\text{vault}} = \text{KDF}(\text{Passphrase}, \text{Salt}, \text{Pepper}, \text{Work Factor Parameters})$$

* **Salt**: Random $\ge 16$-byte CSPRNG buffer unique to each user vault stored in **plaintext** alongside the ciphertext.
  * Prevents pre-computed Rainbow Table lookup attacks.
  * Ensures identical passwords produce completely different hash outputs.
  * Forces attackers to target each user individually instead of attacking an entire database in parallel.
* **Pepper**: Secret key stored **outside the database** (e.g. in app environment secrets or HSM). Protects vault ciphertexts even if the database is leaked.
* **Work Factors (Cost Parameters)**:
  * **Iteration / Time Cost ($t$)**: Number of computation loops.
  * **Memory Cost ($m$)**: RAM allocation required per hash computation.
  * **Parallelism ($p$)**: Number of execution threads required.

---

### 3. Deep Dive: How Memory Hardness (64 MB) Slows Down Attacks

#### The GPU Attacker Analogy:
* A high-end **GPU** has ~10,000 tiny, fast cores (workers) and ~8 GB (8,000 MB) of VRAM.
* **Fast Hash (SHA-256)**: Requires 32 bytes of RAM. All 10,000 workers can sit side-by-side and execute $10^{11}$ parallel guesses/sec.
* **Memory-Hard Hash (Argon2id with 64 MB)**: Forces **each guess attempt** to allocate a **64 MB memory notebook** in RAM, write random pseudo-random data, and jump back and forth reading/writing pages.

#### Physical Bottleneck Math:
$$\text{Max GPU Worker Capacity} = \frac{8,000 \text{ MB VRAM}}{64 \text{ MB per guess}} = \text{Only } 125 \text{ Parallel Workers}$$

* **Result**: **9,875 GPU workers sit idle** due to memory space exhaustion.
* **Impact**: For a legitimate user logging in, 64 MB for 0.5s takes $<1\%$ of phone/laptop RAM (unnoticeable). For a hacker trying millions of combinations, it completely strangles GPU hardware and makes brute-forcing economically impossible.

---

### 4. Algorithm Comparison & Trade-Offs

| Algorithm | Type | Memory Hardness | GPU / ASIC Resistance | Max Input Limit | Primary Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PBKDF2** | KDF | ❌ Low (CPU-bound) | ⚠️ Vulnerable to GPU parallelization | Unlimited | Legacy standard, FIPS |
| **bcrypt** | Hashing | ⚠️ Low (4 KB state) | ⚠️ Vulnerable to GPUs/FPGAs | **72 Bytes** (truncates rest) | Legacy Web server user passwords |
| **scrypt** | KDF | ✅ High | 🟢 Strong GPU resistance | Unlimited | **Ethereum UTC Keystore files** |
| **Argon2id**| KDF/Hash | ✅ High (Configurable) | 🟢 **Maximum Security** (PHC Winner) | Unlimited | Modern password storage & vault key derivation |

#### Why Argon2id is the Gold Standard:
* Winner of the international **Password Hashing Competition (2015)**.
* **Argon2i**: Data-independent memory access (resists side-channel timing attacks).
* **Argon2d**: Data-dependent memory access (maximum resistance to GPU attacks).
* **Argon2id**: **Hybrid model**. Uses Argon2i logic for the first pass and Argon2d logic for subsequent passes $\rightarrow$ Best of both worlds!

---

### 5. SafeX Encrypted Vault Architecture Flow

```text
 User Passphrase ("MySecretPass!2026")
        │
        ├──► CSPRNG ──► Generate Random 16-Byte Salt
        │
        ▼
 [ Argon2id KDF (m=64MB, t=3, p=4) ]
        │
        ▼
 Derived 256-Bit Master Key (K_vault)
        │
        ├──► CSPRNG ──► Generate Random 12-Byte IV
        │
        ▼
 [ AES-256-GCM Encrypt( Seed Phrase ) ]
        │
        ├───────────────────────────┐
        ▼                           ▼
 Encrypted Ciphertext       16-Byte Auth Tag
        │                           │
        └─────────────┬─────────────┘
                      ▼
         Final Stored Vault JSON Payload:
         {
           "salt": "a1b2c3...",
           "iv": "9f8e7d...",
           "authTag": "1a2b3c...",
           "ciphertext": "e8a1c9..."
         }
```

---

### 6. Node.js Code Implementation (`scrypt` / Argon2 Key Derivation)

```typescript
import crypto from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(crypto.scrypt)

/**
 * Derives a 256-bit encryption key from a user passphrase and salt using scrypt (Node native)
 */
export async function deriveVaultKeyScrypt(passphrase: string, salt: Buffer): Promise<Buffer> {
  const keyLength = 32 // 256 bits for AES-256
  const options = {
    N: 32768, // CPU/memory cost parameter (2^15)
    r: 8,     // Block size parameter
    p: 1,     // Parallelization parameter
    maxmem: 64 * 1024 * 1024 // 64 MB RAM limit
  }

  const derivedKey = (await scryptAsync(passphrase, salt, keyLength, options)) as Buffer
  return derivedKey
}
---

## Topic 7: BIP39 Mnemonic Specification & Checksum Calculation

### 1. What is BIP39 & Why It Exists
* **BIP39 (Bitcoin Improvement Proposal 39)**: Standard for converting raw binary entropy (random numbers) into a human-readable sequence of words (mnemonic phrases) and deriving a 512-bit master binary key.
* **Core Problem Solved**: Humans cannot reliably write or type 40-character hex strings (`0x4d2a...`). Words are easy to write on paper, and BIP39 adds a **built-in checksum** to catch typos instantly.

---

### 2. Entropy to Word Count Table

$$\text{Total Bits} = \text{Entropy Bits } (ENT) + \text{Checksum Bits } (CS)$$

$$\text{Word Count} = \frac{ENT + CS}{11}$$

| Entropy Bits ($ENT$) | Checksum Bits ($CS = ENT / 32$) | Total Bits ($ENT + CS$) | Mnemonic Word Count |
| :--- | :--- | :--- | :--- |
| **128 bits** (16 bytes) | 4 bits | 132 bits | **12 words** |
| **160 bits** (20 bytes) | 5 bits | 165 bits | **15 words** |
| **192 bits** (24 bytes) | 6 bits | 198 bits | **18 words** |
| **224 bits** (28 bytes) | 7 bits | 231 bits | **21 words** |
| **256 bits** (32 bytes) | 8 bits | 264 bits | **24 words** |

---

### 3. Step-by-Step Generation Math ($11$-Bit Chunking)

Why $11$ bits? $2^{11} = 2,048$. The official BIP39 dictionary contains **exactly 2,048 unique words** (index 0 = `"abandon"`, index 2047 = `"zulu"`).

```text
 1. Generate CSPRNG Entropy (ENT): 128 bits (16 bytes)
                         │
                         ▼
 2. Compute SHA-256 Hash of ENT: SHA256(ENT)
    Take First 4 Bits as Checksum (CS = 4 bits)
                         │
                         ▼
 3. Combine Entropy + Checksum: 128 + 4 = 132 bits total
                         │
                         ▼
 4. Slice into 12 Chunks of 11 Bits Each (132 / 11 = 12):
    Chunk 1:  [ 11010110101 ] ──► Decimal 1717 ──► Word #1717: "tree"
    Chunk 2:  [ 10111110010 ] ──► Decimal 1522 ──► Word #1522: "ripple"
    ...
    Chunk 12: [ 10010110101 ] ──► Decimal 1205 ──► Word #1205: "ocean"
```

---

### 4. Checksum Typo Validation Mechanics
When restoring a wallet from 12 words:
1. Words are converted back to 11-bit indices to reconstruct the **132-bit payload**.
2. Split payload: First 128 bits = **Entropy**, Last 4 bits = **Stored Checksum**.
3. Calculate $\text{SHA256}(\text{Entropy})[0:4\text{ bits}]$ and compare against the stored checksum.
4. If a word is mistyped or word order is altered, checksum comparison **fails immediately**, warning the user before generating wrong keys.

---

### 5. Master Seed Derivation (512-Bit Binary Seed)

The wallet converts the 12 words into a **512-bit (64-byte) Master Seed** using **PBKDF2-HMAC-SHA512**:

$$\text{Master Seed} = \text{PBKDF2-HMAC-SHA512}(\text{Password} = \text{Mnemonic}, \text{Salt} = \text{"mnemonic" + Passphrase}, \text{Iterations} = 2048)$$

* **Optional 25th Word (Passphrase)**: Appended to the salt (`"mnemonic" + passphrase`). Acts as a secret password for plausible deniability—stealing the 12 words alone is insufficient to access funds without the 25th word.

---

### 6. Topic 7 Summary Checklist
- [x] BIP39 maps entropy to 12-24 words via a 2,048-word dictionary.
- [x] $2^{11} = 2,048$ $\implies$ 11 bits per word.
- [x] Checksum ($CS = ENT/32$ bits) is appended to entropy before 11-bit slicing.
- [x] Checksum validation catches typos and invalid word ordering on wallet import.
- [x] PBKDF2-HMAC-SHA512 (2,048 rounds) derives 512-bit master seed from mnemonic + optional passphrase.
