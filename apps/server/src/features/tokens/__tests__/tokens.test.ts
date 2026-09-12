import { describe, it, expect } from 'vitest'
import { tokenRouter } from '../routers/token.router.js'

describe('Backend Tokens Feature Tests', () => {
  const usdcSepolia = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  const validUser = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'

  it('should fetch ERC-20 token metadata via tokenRouter.getMetadata', async () => {
    const meta = await (tokenRouter.getMetadata as unknown as (input: unknown) => Promise<{
      name: string
      symbol: string
      decimals: number
    }>)({
      tokenAddress: usdcSepolia,
      chainId: 11155111,
    })

    expect(meta).toBeDefined()
    expect(meta.symbol).toBe('USDC')
    expect(meta.decimals).toBe(6)
  }, 15000)

  it('should fetch token balance via tokenRouter.getBalance', async () => {
    const res = await (tokenRouter.getBalance as unknown as (input: unknown) => Promise<{
      rawBalance: string
      formattedBalance: string
    }>)({
      walletAddress: validUser,
      tokenAddress: usdcSepolia,
      chainId: 11155111,
    })

    expect(res).toBeDefined()
    expect(res.rawBalance).toBeDefined()
    expect(res.formattedBalance).toBeDefined()
  }, 15000)
})
