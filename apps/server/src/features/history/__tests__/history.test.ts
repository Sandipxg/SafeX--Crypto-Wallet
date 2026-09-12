import { describe, it, expect } from 'vitest'
import { fetchOnChainTransactions } from '../services/history.service.js'
import { historyRouter } from '../routers/history.router.js'

describe('Backend History Feature Tests', () => {
  const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'

  it('should reject invalid EVM address in service', async () => {
    await expect(fetchOnChainTransactions('invalid-address', 11155111)).rejects.toThrow(
      'Invalid EVM address format'
    )
  })

  it('should reject missing address in router', async () => {
    await expect(
      (historyRouter.getTransactions as unknown as (input: unknown) => Promise<unknown>)({
        address: '',
      })
    ).rejects.toThrow('Address is required')
  })

  it('should query live or fallback transaction history array for a valid address', async () => {
    const txs = await fetchOnChainTransactions(validAddress, 11155111)
    expect(Array.isArray(txs)).toBe(true)
  }, 15000)
})
