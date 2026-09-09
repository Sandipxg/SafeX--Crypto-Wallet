# 🪙 Phase 4 — Smart Contracts & ERC-20 Token Standards (Technical Handbook)

---

## Table of Contents
1. [Protocol Native Coins vs. Smart Contract Tokens](#1-protocol-native-coins-vs-smart-contract-tokens)
2. [EVM Calldata, 4-Byte Function Selectors & ABI Encoding](#2-evm-calldata-4-byte-function-selectors--abi-encoding)
3. [ERC-20 State Architecture & Core Interface](#3-erc-20-state-architecture--core-interface)
4. [The Allowance Mechanism (`approve` + `transferFrom`) & EIP-2612 Permit](#4-the-allowance-mechanism-approve--transferfrom--eip-2612-permit)
5. [Fixed-Point Arithmetic & Token Decimals](#5-fixed-point-arithmetic--token-decimals)
6. [Event Logs, Topics & Token Discovery](#6-event-logs-topics--token-discovery)
7. [Real-World Token Quirks & Security Pitfalls](#7-real-world-token-quirks--security-pitfalls)

---

## 1. Protocol Native Coins vs. Smart Contract Tokens

### 1.1 State Machine Architecture
Ethereum maintains a single global state trie (**World State**). Every address on Ethereum maps to an account object containing four fields:
- `nonce`: Transaction counter for EOAs; contract creation counter for Contract Accounts.
- `balance`: Quantity of native **Wei** owned by the account.
- `storageRoot`: 256-bit hash of the root node of the account's persistent storage trie (empty for EOAs).
- `codeHash`: Immutable hash of the EVM bytecode stored at this address (empty for EOAs).

```text
World State (Global State Trie)
│
├── User EOA (0xAlice...)
│     ├── nonce: 12
│     ├── balance: 1.845 ETH (Native Wei in account object)
│     ├── storageRoot: 0x00... (EOAs have no storage)
│     └── codeHash: 0x00...    (EOAs have no bytecode)
│
└── USDC Contract Account (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)
      ├── nonce: 1
      ├── balance: 0 ETH
      ├── storageRoot: 0x9f8b... ──► [Contract Storage Trie]
      │                                ├── balances[0xAlice] = 1,000,000,000
      │                                └── allowances[0xAlice][0xSpender] = 500,000,000
      └── codeHash: 0x3a4b...    ──► [Compiled EVM Bytecode]
```

### 1.2 Comparison Matrix

| Property | Native Coin (ETH) | Smart Contract Token (ERC-20: USDC, LINK, etc.) |
| :--- | :--- | :--- |
| **Origin** | Protocol-level primitive defined in execution specs | User-space bytecode deployed to the blockchain |
| **Balance Location** | Direct account field (`account.balance`) | Key-value mapping inside contract storage (`_balances[address]`) |
| **Transfer Type** | Native state transition (no code execution required) | EVM opcode execution (`CALL`, `SLOAD`, `SSTORE`) |
| **Gas Payment** | Natively pays for EVM gas consumption | Cannot pay for gas directly; gas is always burned in native ETH |
| **Base Transfer Gas** | Exactly `21,000` gas units | Variable (`~45,000` to `65,000+` gas units depending on EVM writes) |
| **`to` Field in Tx** | Recipient wallet address | Token contract address |
| **`value` Field in Tx**| Amount of native Wei transferred | `0` Wei (token quantity is encoded in `data`) |

### 1.3 Why Native ETH Is Not an ERC-20 Token & What is WETH
The ERC-20 token standard was finalized in 2015 (EIP-20). Native ETH existed before ERC-20 was standardized. 
- Because native ETH does not implement the ERC-20 interface methods (`transfer`, `transferFrom`, `approve`, `allowance`), decentralized protocols (e.g. Uniswap, Aave) cannot handle ETH using the same code path they use for tokens.
- **Wrapped ETH (WETH9)** is an ERC-20 smart contract that wraps native ETH 1:1.
- To convert ETH to WETH: The user sends ETH to the WETH contract invoking `deposit() { _balances[msg.sender] += msg.value; }`.
- To convert WETH back to ETH: The user calls `withdraw(uint256 wad) { _balances[msg.sender] -= wad; payable(msg.sender).transfer(wad); }`.

---

## 2. EVM Calldata, 4-Byte Function Selectors & ABI Encoding

### 2.1 Function Dispatch Mechanism
The EVM executes bytecode sequentially. When a transaction contains non-empty `data`, the contract's compiler-generated dispatcher inspects the **first 4 bytes** of `msg.data` to identify which function to execute.

$$\text{Function Selector} = \text{bytes4}(\text{keccak256}(\text{"functionSignature"}))$$

> **Rule**: Function signatures must not contain spaces or parameter names, only canonical type names (e.g., `uint256`, not `uint`; `address`, not `address account`).

```text
Function Signature: "transfer(address,uint256)"
Keccak-256 Hash:    0xa9059cbb2ab09eb219583f4a59a5d0623ade346d962bcd4e46b11da047c9049b
4-Byte Selector:    0xa9059cbb
```

Common standard selectors:
- `balanceOf(address)`: `0x70a08231`
- `transfer(address,uint256)`: `0xa9059cbb`
- `approve(address,uint256)`: `0x095ea7b3`
- `transferFrom(address,address,uint256)`: `0x23b872dd`
- `decimals()`: `0x313ce567`

### 2.2 32-Byte Slot Packing & Padding Rules
All function parameters in the ABI specification are encoded in 32-byte (256-bit) words:
- **Value types (`uint256`, `uint8`, `bool`)**: Big-endian formatted, **left-padded** with zeros.
- **Addresses (`address`)**: 20 bytes long, treated as unsigned integers, **left-padded** with 12 bytes of zeros.
- **Dynamic types (`bytes`, `string`, `arrays`)**: Encoded using offset pointers pointing to length-prefixed data sections.

### 2.3 Concrete Example: Encoding `transfer(0xBob..., 100 USDC)`

Target:
- Recipient: `0x742d35Cc6634C0532925a3b844Bc454e4438f44e`
- Amount: `100 USDC` (with 6 decimals: $100 \times 10^6 = 100,000,000 = \text{0x05f5e100}$)

Resulting Calldata:
```text
0xa9059cbb                                                         // [0..4]   Function selector
000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e  // [4..36]  Recipient (address left-padded to 32 bytes)
0000000000000000000000000000000000000000000000000000000005f5e100  // [36..68] Amount (100000000 uint256 left-padded to 32 bytes)
```
Total calldata length: Exactly $4 + 32 + 32 = 68$ bytes.

---

## 3. ERC-20 State Architecture & Core Interface

### 3.1 Contract Storage Layout
The state of an ERC-20 contract is maintained in EVM persistent storage slots:

```solidity
contract ERC20 {
    // Slot 0 (conceptual): Token identification
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    uint256 private _totalSupply;

    // Slot mappings:
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
}
```

- **Storage mapping calculation**: A mapping does not store entries sequentially. The storage slot for `_balances[userAddress]` is computed deterministically via Keccak-256:
  $$\text{Slot} = \text{keccak256}(\text{abi.encode}(userAddress, \text{balancesMappingSlotNumber}))$$

### 3.2 Standard Interface (EIP-20)

```solidity
interface IERC20 {
    // View Functions (Read-only, 0 gas when called off-chain via eth_call)
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);

    // State Modifying Functions (Require signed transaction, gas consumed)
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    // Event Logs
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
```

### 3.3 Low-Level Execution Trace of `transfer`
When a validator executes an ERC-20 `transfer(to, amount)`:
1. `CALLER`: Recovers the transaction signer address (`msg.sender`).
2. `SLOAD`: Retrieves the balance at `keccak256(msg.sender, slot)`.
3. `LT`: Asserts `balance >= amount`. If false, EVM reverts with `0xfd` (`REVERT`).
4. `SSTORE`: Writes `balance - amount` back to sender slot ($2,900$–$5,000$ gas).
5. `SSTORE`: Writes `recipientBalance + amount` to recipient slot ($2,900$–$20,000$ gas if slot was uninitialized).
6. `LOG3`: Emits the `Transfer` event log containing topic hashes and payload data.

---

## 4. The Allowance Mechanism (`approve` + `transferFrom`) & EIP-2612 Permit

### 4.1 The Fundamental Two-Step Problem
Smart contracts cannot pull funds from an EOA without prior consent. 
- If you want a Decentralized Exchange (DEX Router) to take 1,000 USDC from your wallet to execute a swap, you cannot simply invoke `router.swap()`.
- The Router cannot initiate a transaction on your behalf because it does not possess your private key.

### 4.2 The Two-Step Lifecycle
1. **Step 1 — Grant Allowance (`approve`)**:
   - The user signs an on-chain transaction calling `USDC.approve(spenderAddress, amount)`.
   - The USDC contract updates its internal table:
     ```solidity
     _allowances[msg.sender][spenderAddress] = amount;
     ```
2. **Step 2 — Execute Pull (`transferFrom`)**:
   - The user calls `router.swap(...)`.
   - Inside the swap execution, the Router contract calls:
     ```solidity
     USDC.transferFrom(userAddress, poolAddress, amount);
     ```
   - The USDC contract checks that `_allowances[userAddress][msg.sender] >= amount`, decrements the allowance, and updates the token balances.

```text
Step 1: User ──(tx: approve)──► USDC Contract
                                  └── _allowances[User][Router] = 1000

Step 2: User ──(tx: swap)─────► Router Contract
                                  └── calls USDC.transferFrom(User, Pool, 1000)
                                        ├── verifies allowance >= 1000
                                        ├── _allowances[User][Router] -= 1000
                                        ├── _balances[User] -= 1000
                                        └── _balances[Pool] += 1000
```

### 4.3 The Danger of Infinite Approvals
Many dApps request an "Infinite Approval" (`type(uint256).max = 2^256 - 1 = 115792089237316195423570985008687907853269984665640564039457584007913129639935`).
- **Advantage**: The user pays the gas fee for `approve()` only once and never has to approve again for subsequent interactions.
- **Catastrophic Risk**: If the approved smart contract has a security vulnerability or backdoor, an attacker can invoke `transferFrom` at any time in the future and drain 100% of the tokens from the user's wallet without requiring any signature.

### 4.4 EIP-2612: Gasless Approvals via Off-Chain Signatures (Permit)
To eliminate the friction and cost of a separate on-chain `approve()` transaction, **EIP-2612** introduces the `permit()` function.

```solidity
function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external;
```

**How Permit Works**:
1. The user signs an off-chain structured typed data message (**EIP-712**) containing `(owner, spender, value, nonce, deadline)`. **No gas is paid.**
2. The user passes this `(v, r, s)` signature to the target protocol (e.g. Router).
3. The protocol submits the signature directly in its single transaction (`router.swapWithPermit(...)`).
4. Inside the transaction, the contract calls `token.permit(...)`, which verifies the signer via `ecrecover` and updates the allowance in the same atomic execution.

---

## 5. Fixed-Point Arithmetic & Token Decimals

### 5.1 The Deterministic Consensus Invariant
The EVM contains **zero native support for floating-point arithmetic** (`float`, `double`, decimal points).
- Floating-point implementations conforming to IEEE 754 allow slight discrepancies across compilers, microarchitectures, and hardware register widths (e.g. 80-bit x87 vs 64-bit SSE).
- If two validators computed `0.30000000000000004` vs `0.30000000000000000`, their computed state root hashes would mismatch, instantly causing a consensus split.
- **Solution**: Every balance and currency unit in Ethereum is strictly represented as an unsigned integer (`uint256`).

### 5.2 Decimals as Metadata
The `decimals()` return value is strictly presentation metadata:

$$\text{Human Balance} = \frac{\text{Stored Raw Integer}}{10^{\text{decimals}}}$$

$$\text{Stored Raw Integer} = \text{Human Balance} \times 10^{\text{decimals}}$$

| Token | Decimals | Factor ($10^d$) | Human: `1.0` | Human: `0.005` |
| :--- | :--- | :--- | :--- | :--- |
| **ETH / WETH** | `18` | $10^{18}$ | `1000000000000000000n` | `5000000000000000n` |
| **USDC / USDT**| `6` | $10^6$ | `1000000n` | `5000n` |
| **WBTC** | `8` | $10^8$ | `100000000n` | `500000n` |

### 5.3 Conversion Mechanics: `parseUnits` and `formatUnits`

```typescript
import { parseUnits, formatUnits } from 'viem'

// 1. Inbound (User Interface String -> Raw Blockchain BigInt)
const sendAmountUsdc = parseUnits("2.75", 6)   // Returns 2750000n
const sendAmountEth  = parseUnits("0.05", 18)  // Returns 50000000000000000n

// 2. Outbound (Raw Blockchain BigInt -> User Interface String)
const displayUsdc = formatUnits(2750000n, 6)   // Returns "2.75"
const displayEth  = formatUnits(50000000000000000n, 18) // Returns "0.05"
```

### 5.4 The JavaScript Precision Trap
Standard JavaScript `Number` is an IEEE 754 double float with an integer precision limit of:
$$\text{Number.MAX\_SAFE\_INTEGER} = 2^{53} - 1 = 9,007,199,254,740,991 \approx 9 \times 10^{15}$$

1 ETH is $10^{18}$ Wei, which exceeds `Number.MAX_SAFE_INTEGER` by a factor of 100.
```javascript
// ❌ FATAL PRECISION TRUNCATION:
Number("1000000000000000001") // Evaluates to 1000000000000000000 (Lost 1 Wei!)

// ✅ LOSSLESS INTEGRITY:
BigInt("1000000000000000001") // Exactly 1000000000000000001n
```
**Architecture Standard**: All balances, allowances, and currency values must remain typed as native `bigint` throughout state and storage layers, converting to `string` only at the presentation boundary.

---

## 6. Event Logs, Topics & Token Discovery

### 6.1 EVM Log Architecture
Contracts cannot read past transactions or access historical data. However, they can write asynchronous diagnostic data to transaction receipts using the `LOG0` through `LOG4` opcodes.
- Event logs are stored in transaction receipts, **not** in the state trie.
- Reading logs is roughly 10x cheaper in gas than writing to persistent contract storage slots (`SSTORE`).

### 6.2 Structure of a Log Entry

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
```

An event log consists of up to 4 **Topics** (32-byte indexed search keys) and arbitrary unindexed **Data**:

```text
Log Entry Components:
├── Address : Contract that emitted the event (e.g. 0xUSDC...)
├── Topics  :
│     ├── Topic 0: Keccak-256 hash of event signature
│     │            keccak256("Transfer(address,address,uint256)")
│     │            = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
│     ├── Topic 1: Indexed parameter 1 ("from" address, left-padded to 32 bytes)
│     └── Topic 2: Indexed parameter 2 ("to" address, left-padded to 32 bytes)
└── Data    : Unindexed parameter ("value" uint256: 0x000...05f5e100)
```

### 6.3 Real-Time Wallet Indexing via `eth_getLogs`
Wallets do not poll the entire blockchain state. To detect incoming token transfers, SafeX issues an RPC filter query:

```json
{
  "method": "eth_getLogs",
  "params": [{
    "fromBlock": "0x112233",
    "toBlock": "latest",
    "topics": [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer signature
      null,                                                                     // from: any sender
      "0x000000000000000000000000mywalletaddress000000000000000000000000"     // to: my wallet
    ]
  }]
}
```
Block headers contain a **Bloom Filter** that allows validator and archive nodes to quickly check whether a block contains relevant logs without scanning the block body.

---

## 7. Real-World Token Quirks & Security Pitfalls

### 7.1 The USDT Missing Return Value Bug & `SafeERC20`
The official ERC-20 specification states that `transfer` and `transferFrom` must return a boolean (`returns (bool)`).
- **The Bug**: The Tether (USDT) contract deployed on Ethereum mainnet (`0xdAC17F958D2ee523a2206206994597C13D831ec7`) omits the return statement:
  ```solidity
  // Actual USDT mainnet code:
  function transfer(address _to, uint _value) public { // Missing returns (bool)!
      ...
  }
  ```
- **Consequence**: Solidity code compiled with version `^0.5.0` or higher expects 32 bytes of return data. When calling USDT's `transfer`, the EVM detects 0 return bytes and halts execution with a revert (`REVERT`).
- **Solution**: OpenZeppelin's `SafeERC20` wrapper library. It executes low-level calls (`call`) and accepts either 0 return bytes or a boolean `true`, ensuring compatibility with non-standard tokens like USDT.

### 7.2 Fee-on-Transfer Tokens
Certain tokens automatically deduct a transaction tax or burn fee on every transfer:
- If a user sends $100$ tokens, the recipient may only receive $98$ tokens ($2\%$ burned).
- **Wallet/Exchange Implication**: Naive accounting assumes `balanceAfter = balanceBefore + amountSent`. In fee-on-transfer tokens, this causes internal reconciliation drift. Code must measure `balanceAfter - balanceBefore` rather than trusting the input parameter.

### 7.3 Rebasing Tokens (Dynamic Elastic Supply)
Rebasing tokens (e.g. Lido Staked ETH `stETH`, Ampleforth `AMPL`) change user balances automatically without any on-chain transfer transactions taking place.
- Balances are computed dynamically as:
  $$\text{balanceOf}(user) = \text{shares}[user] \times \text{totalPooledEther} / \text{totalShares}$$
- **Wallet Implication**: Event listeners looking for `Transfer` events will miss balance increases caused by staking rewards. The wallet must regularly poll `balanceOf` directly.

### 7.4 Centralized Administrative Backdoors: Blacklisting & Freezing
Tokens managed by centralized entities (USDC by Centre/Circle, USDT by Tether) contain administrative functions in their contract bytecode:
- **`blacklist(address account)`**: Prevents the blacklisted address from calling `transfer` or `approve`, permanently freezing all token assets held at that address.
- **`pause()`**: Halts all token transfers across the entire network during emergencies.

### 7.5 Address Poisoning & Zero-Value Transfer Scams
Scammers exploit the fact that anyone can call `transferFrom` with an amount of `0` without needing an allowance:
- An attacker monitors your transaction history.
- The attacker generates a vanity address that matches the first 4 and last 4 characters of an address you frequently send funds to.
- The attacker broadcasts a `0 token` transfer from that address to your wallet.
- The fake address now appears in your wallet's transaction history list.
- If a user lazily copies the recipient address from their transaction history rather than checking every character, they send their real funds directly to the attacker.
