# 🚀 Ethereum Blockchain Fundamentals (SafeX Notes)

> Personal revision notes while building **SafeX Wallet**.
>
> Format: Question → Answer.
> Covers only the blockchain concepts we discussed from scratch.

---

# Table of Contents

1. What is Blockchain?
2. Blocks & Transactions
3. Blockchain vs World State
4. Ethereum Account Object
5. How World State Updates
6. How Nodes Stay Synced
7. Gossip Protocol
8. Bootstrap Nodes & Peer Discovery
9. How a New Node Downloads Blockchain
10. Why Blockchain is Huge
11. Full Node vs Wallet (SafeX)
12. Wallet Creation (Seed Phrase)
13. When Wallet Appears on Blockchain
14. Gas Fees Explained
15. Validators Explained
16. RPC Nodes vs Validators
17. Final SafeX Architecture

---

# Chapter 1 — What is Blockchain?

## Q1. What is a blockchain?

A blockchain is an **append-only distributed database** that stores the complete history of transactions.

Think of it like Git.

- New blocks are appended.
- Old blocks never change.
- Every node has a copy of the same history.

**Remember**

> Blockchain = Immutable History.

---

## Q2. What does blockchain store?

Blockchain stores:

- Transactions.
- Block timestamps.
- Previous block hashes.
- State root.
- Gas information.

Blockchain **does not** store current wallet balances.

---

## Q3. Why is blockchain immutable?

Each block contains the hash of the previous block.

```text
Block 1 ---> Block 2 ---> Block 3
   Hash A      Prev A      Prev B
```

If Block 1 changes:

- Hash changes.
- Block 2 becomes invalid.
- Entire chain after it becomes invalid.

That is immutability.

---

# Chapter 2 — Blocks & Transactions

## Q4. What is a block?

A block is a container of transactions plus metadata.

```text
Block
│
├── Header
│     ├── Timestamp
│     ├── Previous Block Hash
│     ├── State Root
│     └── Gas Used
│
└── Transactions
      ├── TX1
      ├── TX2
      └── TX3
```

---

## Q5. What is a transaction?

A transaction is a signed instruction sent by a wallet.

Example:

```json
{
  "from": "Alice",
  "to": "Bob",
  "value": "1 ETH",
  "nonce": 5,
  "gasLimit": 21000,
  "signature": "..."
}
```

Private key signs.

Public key verifies.

---

# Chapter 3 — Blockchain vs World State

## Q6. Does blockchain store wallet balances?

**No.**

Blockchain stores history only.

Example:

```text
Alice -> Bob : 2 ETH
Bob -> Charlie : 1 ETH
Alice -> David : 3 ETH
```

These are historical events.

---

## Q7. Then where are balances stored?

Inside **World State**.

World State is Ethereum's current snapshot.

```text
World State

Alice   -> 5 ETH
Bob     -> 1 ETH
Charlie -> 4 ETH
```

---

## Q8. What is World State?

World State is an indexed database containing the latest state of every Ethereum account.

Think SQL.

### Blockchain

```sql
Transactions Table
```

Millions of rows.

### World State

```sql
Accounts Table
```

One row per account with current balance.

---

## Q9. Difference between Blockchain and World State?

| Blockchain | World State |
|------------|-------------|
| History | Current Snapshot |
| Immutable | Changes every block |
| Transactions | Current balances |
| Can rebuild state | Used for fast lookups |

**Golden Rule**

> Blockchain remembers what happened.

> World State remembers what exists now.

---

# Chapter 4 — Ethereum Account Object

## Q10. What is stored for every Ethereum account?

Each address points to an Account Object.

```text
Account Object

Balance
Nonce
Storage Root
Code Hash
```

---

## Q11. Wallet account vs Smart Contract account?

### Wallet Account

- Balance
- Nonce

### Smart Contract Account

- Balance
- Nonce
- Contract Code
- Contract Storage

---

# Chapter 5 — How World State Updates

## Q12. How does World State change after transactions?

Genesis:

| Address | Balance |
|---------|---------|
| Alice | 10 ETH |
| Bob | 0 ETH |

Block contains:

```text
Alice -> Bob : 2 ETH
```

World State becomes:

| Address | Balance |
|---------|---------|
| Alice | 8 ETH |
| Bob | 2 ETH |

Blockchain stores transaction.

World State stores updated balance.

---

## Q13. Can World State be recreated?

Yes.

Replay every transaction from Genesis.

Executing every block rebuilds the World State.

---

# Chapter 6 — How Nodes Stay Synced

## Q14. Every node has blockchain copy. How do they stay synchronized?

Nodes do **not** connect to every node.

Each node connects to only dozens of peers.

```text
Node A
 / | \
B  C  D
   |
   E
```

This creates a mesh network.

---

## Q15. Why doesn't every node connect to every other node?

Because it would require millions of network connections.

Instead Ethereum uses peer-to-peer mesh networking.

---

# Chapter 7 — Gossip Protocol

## Q16. How does one transaction reach every node?

Using **Gossip Protocol**.

Flow:

```text
Wallet
   ↓
Node A
 ↓ ↓ ↓
B C D
 ↓ ↓
E F
 ↓
G
```

Every node forwards transactions to its peers.

---

## Q17. Won't transactions loop forever?

No.

Each transaction has a hash.

If node already saw that hash:

> Ignore it.

Duplicates are discarded.

---

## Q18. What is a mempool?

Mempool is a waiting room.

```text
Mempool

TX1
TX2
TX3
TX4
```

Transactions wait there until included in a block.

---

# Chapter 8 — Bootstrap Nodes

## Q19. How does a brand-new node find peers?

Using **Bootstrap Nodes**.

```text
New Node
   ↓
Bootstrap Node
   ↓
Peer List
```

Bootstrap nodes only introduce peers.

---

## Q20. What happens after bootstrap?

Nodes discover additional peers automatically.

They exchange:

- IP address.
- Port.
- Node ID.
- Known peers.

Eventually node maintains many peer connections.

---

# Chapter 9 — Downloading Blockchain

## Q21. Does every node download blockchain?

**Yes.**

A node downloads blockchain from other peers.

Not from one central server.

---

## Q22. How does downloading happen?

Peers send different block ranges.

```text
Peer A -> Blocks 1–500000

Peer B -> Blocks 500001–1000000

Peer C -> Blocks 1000001–1500000
```

Parallel download.

Very similar to BitTorrent.

---

## Q23. Does node trust peers?

No.

Every downloaded block is verified.

Checks include:

- Previous hash.
- Block hash.
- Transactions.
- State root.

Fake blocks are rejected.

---

# Chapter 10 — Why Blockchain is Huge

## Q24. Isn't blockchain too large?

Yes.

It contains years of blocks.

Millions of transactions.

Hundreds of GB.

---

## Q25. Does node replay everything from Genesis?

Not always.

Modern nodes usually use **Snap Sync**.

---

## Q26. What is Snap Sync?

Instead of replaying everything:

Download:

- Current World State snapshot.
- Block history.
- Recent blocks.

Then verify forward.

Much faster.

---

# Chapter 11 — Wallet vs Node

## Q27. Is Trust Wallet an Ethereum node?

No.

Trust Wallet is a client.

| Wallet | Ethereum Node |
|--------|---------------|
| Stores seed phrase | Stores blockchain |
| Signs transactions | Validates transactions |
| Uses JSON-RPC | Executes JSON-RPC |

---

## Q28. How does Trust Wallet show balance?

Wallet sends:

```text
eth_getBalance(address)
```

RPC node looks inside World State.

Returns balance.

Wallet itself stores no blockchain.

---

# Chapter 12 — Wallet Creation

## Q29. Does creating wallet register account on Ethereum?

**No.**

Wallet creation is pure mathematics.

No blockchain interaction.

No server request.

---

## Q30. Wallet creation flow?

```text
Random Number
      ↓
12 Words (BIP39)
      ↓
Seed
      ↓
Private Key
      ↓
Public Key
      ↓
Ethereum Address
```

Everything happens locally.

---

## Q31. Does Ethereum know this address exists?

No.

Address is just mathematically valid.

Blockchain has never seen it.

---

## Q32. When does address appear on blockchain?

First time it participates in a transaction.

Example:

```text
Alice -> New Address : 2 ETH
```

Now World State creates entry.

---

# Chapter 13 — Gas Fees

## Q33. Why does Ethereum charge gas?

Gas prevents spam.

Without gas hackers could send millions of transactions for free.

Gas makes computation expensive.

---

## Q34. What is Gas?

Gas measures computation performed by Ethereum.

It is **not ETH**.

---

## Q35. Difference between ETH, Gas and Gwei?

| Unit | Meaning |
|------|---------|
| ETH | Cryptocurrency |
| Gas | Computational work |
| Gwei | Price of one Gas |

---

## Q36. What is Gas Limit?

Gas Limit is maximum gas user allows transaction to consume.

ETH transfer always needs **21,000 gas**.

---

## Q37. What is Gas Price?

Price paid per gas unit.

Example:

20 Gwei means every gas costs 20 Gwei.

---

## Q38. Formula for Gas Fee?

```text
Gas Fee = Gas Used × Gas Price
```

Example:

```text
21,000 × 20 Gwei

= 420,000 Gwei

= 0.00042 ETH
```

---

## Q39. Who pays gas?

Sender.

Receiver gets full amount.

Example:

Alice sends 1 ETH.

Gas = 0.00042 ETH.

Alice pays:

```text
1.00042 ETH
```

Bob receives:

```text
1 ETH
```

---

## Q40. Does SafeX earn gas?

No.

Gas belongs to Ethereum protocol.

SafeX may optionally charge its own fee.

---

# Chapter 14 — Base Fee & Priority Fee

## Q41. Is entire gas burned?

No.

Gas has two parts.

| Part | Goes To |
|------|----------|
| Base Fee | Burned forever |
| Priority Fee | Validator |

---

## Q42. What is burning ETH?

Burning means ETH is permanently removed from circulation.

Nobody receives it.

Supply decreases.

---

## Q43. What is Priority Fee?

Extra incentive paid to validator that includes transaction inside a block.

---

# Chapter 15 — Validators

## Q44. Who are validators?

Validators are computers participating in Ethereum consensus.

Jobs:

- Receive transactions.
- Verify transactions.
- Execute EVM.
- Create blocks.
- Broadcast blocks.

---

## Q45. Why do validators earn money?

They spend:

- CPU.
- RAM.
- SSD.
- Internet.
- Electricity.

Priority fees compensate validators.

---

## Q46. Who owns validators?

Anyone.

Examples:

- Individuals.
- Coinbase.
- Lido operators.
- Universities.
- Companies.

Ethereum has no owner.

---

## Q47. Can I become validator?

Yes.

Requirements discussed:

- Stake 32 ETH.
- Run validator software.
- Stay online.

Anyone can do this.

---

# Chapter 16 — RPC Nodes vs Validators

## Q48. Are Infura and Alchemy validators?

No.

This was an important correction.

Infura and Alchemy are **RPC Providers**.

They provide API access.

---

## Q49. Difference between RPC Node and Validator?

| RPC Node | Validator |
|----------|-----------|
| Answers JSON-RPC requests. | Creates/validates blocks. |
| Broadcasts transactions. | Earns priority tips. |
| Doesn't earn gas fees for RPC requests. | Earns validator rewards. |

---

## Q50. Can SafeX run its own node?

Yes.

Running Geth means SafeX has its own RPC endpoint.

No dependency on Infura.

But Geth alone does **not** earn validator rewards.

---

# Chapter 17 — SafeX Architecture

## Q51. SafeX wallet creation architecture?

Everything happens locally.

```text
User

↓

SafeX

↓

Generate Seed

↓

Generate Keys

↓

Generate Address
```

No blockchain interaction.

---

## Q52. SafeX send transaction architecture?

```text
SafeX Wallet
     ↓
Sign Transaction
     ↓
RPC Node
     ↓
Ethereum Network
     ↓
Validator
     ↓
Block
```

---

## Q53. Does SafeX need backend for wallet creation?

No.

Backend is optional.

Backend may store:

- User login.
- Encrypted backup.
- Portfolio cache.

Private keys should remain on user's device for non-custodial wallet.

---

## Q54. Where is ETH balance stored?

Inside World State.

Wallet queries node.

Node reads World State.

Returns balance.

---

## Q55. Final Ethereum Mental Model

```text
Ethereum

├── Blockchain
│     Immutable history.
│
├── World State
│     Current balances and contract state.
│
├── Mempool
│     Waiting transactions.
│
├── RPC Nodes
│     API access for wallets.
│
└── Validators
      Execute transactions and create blocks.
```

**The One Sentence Revision**

> Blockchain tells what happened.

> World State tells what exists now.

> Wallets generate keys locally.

> Nodes store blockchain and world state.

> Validators execute transactions and earn priority fees.

> RPC nodes help wallets communicate with Ethereum.
