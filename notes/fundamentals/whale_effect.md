# 5.1 Whale Effect — How a Large Swap Changes Price in an AMM

## Core Concept (Memorize This)

> An AMM never stores price. It only stores reserves. Price is derived from the reserve ratio.

$$Price_{ETH} = \frac{Reserve_{USDC}}{Reserve_{ETH}}$$

The liquidity pool only stores two numbers:

| Reserve | Amount |
| :--- | :--- |
| USDC Reserve ($x$) | 10,000 USDC |
| ETH Reserve ($y$) | 300 ETH |

### Constant Product Invariant:

$$k = x \times y = 10,000 \times 300 = 3,000,000$$

This value must remain constant after every swap (ignoring LP fees).

---

# 5.1.1 Initial Pool State

## Pool Storage Before Swap

| Reserve | Amount |
| :--- | :--- |
| Reserve USDC | 10,000 |
| Reserve ETH | 300 |

### Spot Price

$$\frac{10,000}{300} = 33.33 \text{ USDC/ETH}$$

### Meaning

* 1 ETH currently costs 33.33 USDC.
* This is called the Spot Price.
* It is computed directly from reserves.

---

# 5.1.2 Whale Wants 240 ETH

A whale opens SafeX and chooses:

### Swap Request

| Field | Value |
| :--- | :--- |
| **From** | USDC |
| **To** | 240 ETH |

The whale wants exactly 240 ETH.

The pool therefore must end with:

$$300 - 240 = 60 \text{ ETH}$$

---

# 5.1.3 Calculate Final Pool State

Apply the invariant:

$$x_{new} \times 60 = 3,000,000$$

$$x_{new} = 50,000 \text{ USDC}$$

## Pool After Swap

| Reserve | Amount |
| :--- | :--- |
| USDC Reserve | 50,000 |
| ETH Reserve | 60 |

### Verification:

$$50,000 \times 60 = 3,000,000$$

Invariant preserved.

---

# 5.1.4 How Much USDC Does the Whale Actually Pay?

This is the accounting step.

The pool already owned 10,000 USDC.  
After the swap it owns 50,000 USDC.

Therefore:

$$\text{Whale Deposit} = 50,000 - 10,000 = 40,000 \text{ USDC}$$

## Ledger View

| Moment | USDC Reserve | ETH Reserve |
| :--- | :--- | :--- |
| Before swap | 10,000 | 300 |
| Whale deposits USDC | +40,000 | 300 |
| Pool sends ETH | 50,000 | -240 |
| **Final pool state** | **50,000** | **60** |

### Important Distinction

* **50,000 USDC** = final pool reserve.
* **40,000 USDC** = whale's actual payment.

---

# 5.1.5 How Does Price Increase?

Price is recalculated from reserves.

## Before Swap

$$Price = \frac{10,000}{300} = 33.33 \text{ USDC/ETH}$$

## After Swap

$$Price = \frac{50,000}{60} = 833.33 \text{ USDC/ETH}$$

| Metric | Value |
| :--- | :--- |
| Spot Price Before | 33.33 USDC |
| Spot Price After | 833.33 USDC |

### Why?

Because:
* USDC reserve increased dramatically.
* ETH reserve became scarce.
* The reserve ratio changed.

> Less ETH inside the pool means ETH becomes more expensive inside that pool.

---

# 5.1.6 Does the Whale Buy Everything at 33.33 USDC?

**No.** This is the biggest misconception.

The whale experiences the price increase during the same transaction. Think of the trade as millions of microscopic purchases:

| ETH Purchased | Approx Spot Price |
| :--- | :--- |
| First ETH | 33 USDC |
| 50th ETH | 45 USDC |
| 100th ETH | 70 USDC |
| 180th ETH | 180 USDC |
| 220th ETH | 400 USDC |
| Last ETH | 833 USDC |

The spot price rises continuously along the AMM curve.

---

# 5.1.7 Spot Price vs Average Execution Price

These are two different concepts:

| Metric | Value |
| :--- | :--- |
| Spot Price Before Swap | 33.33 USDC/ETH |
| Total USDC Paid | 40,000 USDC |
| ETH Received | 240 ETH |
| **Average Execution Price** | **166.67 USDC/ETH** |
| Spot Price After Swap | 833.33 USDC/ETH |

Average execution price is:

$$\frac{40,000}{240} = 166.67 \text{ USDC/ETH}$$

### Interpretation

* The whale did not pay 833 USDC for every ETH.
* The whale paid an average of 166.67 USDC across the entire swap.

---

# 5.1.8 Price Impact (Whale Effect)

Price impact measures how much your own trade changed the pool price:

$$\text{Price Impact} = \frac{833.33 - 33.33}{33.33} \times 100 = 2400\%$$

This enormous price impact happens because:
* Trade size is huge relative to liquidity.
* Whale removed 80% of the ETH reserve.
* Remaining ETH became extremely scarce.

> [!IMPORTANT]
> **Price Impact $\neq$ Fee**  
> Price impact is fundamentally created by AMM bonding curve mathematics, not by fees.

---

# 5.1.9 Why Large Pools Have Smaller Whale Effects

Compare two pools:

| Small Pool | Large Pool |
| :--- | :--- |
| 10,000 USDC / 300 ETH | 10,000,000 USDC / 300,000 ETH |
| Whale swaps 1,000 USDC | Whale swaps 1,000 USDC |
| 10% of pool liquidity | 0.01% of pool liquidity |
| Large price movement | Almost no price movement |

Liquidity depth reduces price impact.

---

# 5.1.10 Can a Whale Manipulate the Price?

Temporarily — yes. Permanently — no.

After the whale swap:

| Location | Price |
| :--- | :--- |
| Uniswap Pool Price | 833 USDC/ETH |
| Rest of Market | 33 USDC/ETH |

This creates an arbitrage opportunity.

### Arbitrage Bot Strategy:

1. Buy ETH from the cheaper market (33 USDC).
2. Sell ETH into the expensive pool (833 USDC).
3. Receive excess USDC from the pool.
4. Pool reserves rebalance.
5. Pool price falls back toward the global market price.

### Result:

* Whale paid heavy price impact.
* Arbitrage bot earns profit.
* Pool returns close to market equilibrium.

---

# 5.1.11 What Happens If Whale Requests More ETH Than Exists?

Suppose whale requests 350 ETH, but the pool only contains 300 ETH:

$$300 - 350 = -50$$

Negative reserves are impossible. The router checks liquidity before execution.

If requested output exceeds available reserves:
* Transaction reverts.
* No tokens move.
* User only loses gas for the reverted execution.

A constant-product pool can never reach 0 ETH because the required input approaches infinity as reserves approach zero.

---

# 5.1.12 LP Fee vs Whale Effect

These are completely independent:

| Liquidity Provider Fee | Whale Effect / Price Impact |
| :--- | :--- |
| Fixed percentage (0.30% in Uniswap V2). | Depends on trade size relative to pool liquidity. |
| Charged once on input amount. | Changes average execution price. |
| Remains inside pool reserves. | Created by reserve ratio changing. |

### Example:

| Step | Amount |
| :--- | :--- |
| Whale sends | 40,000 USDC |
| LP Fee (0.30%) | 120 USDC |
| Amount used in AMM math | 39,880 USDC |

The fee percentage is constant. The changing price comes from reserve updates, not changing fee percentages.

---

# 5.1.13 SafeX Developer Mental Model (Final Summary)

## End-to-End Whale Swap Lifecycle

| Phase / Factor | Details |
| :--- | :--- |
| **Initial Pool** | 10,000 USDC / 300 ETH |
| **Spot Price** | 33.33 USDC/ETH |
| **User Request** | Swap for exactly 240 ETH. |
| **AMM Calculation** | Compute final reserves using $x \cdot y = k$. |
| **Whale Deposit** | 40,000 USDC enters the pool. |
| **Pool Output** | 240 ETH leaves the pool. |
| **Final Pool** | 50,000 USDC / 60 ETH |
| **New Spot Price** | 833.33 USDC/ETH |
| **Average Execution Price** | 166.67 USDC/ETH |
| **Price Impact** | Created by the whale consuming liquidity. |
| **LP Fee** | Separate fixed 0.30% fee retained by liquidity providers. |
| **Market Correction** | Arbitrage traders restore pool price toward the global market. |

---

## ⭐ Phase 5 Takeaway (Memorize)

> A whale does not "cause the price hike after buying." The whale buys along an increasingly expensive AMM curve, pays the average execution price created by that curve, leaves the pool with new reserves, and those new reserves define the new spot price seen by everyone after the transaction.
