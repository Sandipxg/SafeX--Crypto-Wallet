import { describe, it, expect, vi } from 'vitest'
import { buildUnsignedTransaction } from '../transactions/transactionBuilder'
import { orpc } from '../../orpc'

vi.mock('../../orpc', () => ({
  orpc: {
    wallet: {
      getNonce: vi.fn().mockResolvedValue({ nonce: 42 }),
      getGasEstimate: vi.fn().mockResolvedValue({
        maxFeePerGas: '25000000000',
        maxPriorityFeePerGas: '1500000000',
        estimatedGasUnits: '21000',
        estimatedTotalFeeWei: '525000000000000',
      }),
    },
  },
}))

describe('Transaction Builder Service Tests', () => {
  it('should assemble a valid UnsignedEip1559Request from RPC estimates', async () => {
    const from = '0x71C7656EC7ab88b098def1734b743b44628b36d2' as const
    const to = '0x1234567890123456789012345678901234567890' as const
    const valueEth = '0.05'

    const result = await buildUnsignedTransaction({ from, to, valueEth })

    expect(result.txRequest).toEqual({
      chainId: 11155111,
      nonce: 42,
      to,
      valueEth: '0.05',
      gasLimit: 21000n,
      maxFeePerGas: 25000000000n,
      maxPriorityFeePerGas: 1500000000n,
      data: '0x',
    })

    expect(result.gasSummary.estimatedTotalFeeWei).toBe('525000000000000')
    expect(orpc.wallet.getNonce).toHaveBeenCalledWith({ walletAddress: from, chainId: 11155111 })
    expect(orpc.wallet.getGasEstimate).toHaveBeenCalledWith({
      from,
      to,
      valueEth: '0.05',
      data: '0x',
      chainId: 11155111,
    })
  })
})
