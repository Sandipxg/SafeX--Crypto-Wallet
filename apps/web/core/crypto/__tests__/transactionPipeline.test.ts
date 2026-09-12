import { describe, it, expect, vi } from 'vitest'
import { executeTransactionPipeline, fetchTxReceiptStatus } from '../transactions/transactionPipeline'
import { signEip1559Transaction } from '../transactions/transactionSigner'
import { saveClientTx } from '../transactions/transactionStorage'
import { orpc } from '../../orpc/client'

vi.mock('../transactions/transactionSigner', () => ({
  signEip1559Transaction: vi.fn().mockResolvedValue({
    signedHex: '0x02f86c...signed',
    senderAddress: '0x71C7656EC7ab88b098def1734b743b44628b36d2',
  }),
}))

vi.mock('../transactions/transactionStorage', () => ({
  saveClientTx: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../transactions/transactionPoller', () => ({
  startClientTxPoller: vi.fn(),
}))

vi.mock('../../orpc/client', () => ({
  orpc: {
    wallet: {
      broadcastTx: vi.fn().mockResolvedValue({ hash: '0xmocktxhash123', status: 'broadcasted' }),
      getTxReceipt: vi.fn().mockResolvedValue({ status: 'confirmed' }),
    },
  },
}))

describe('Transaction Pipeline Service Tests', () => {
  it('should sign, broadcast, and save transaction to client IndexedDB', async () => {
    const preparedTxRequest = {
      chainId: 11155111,
      nonce: 10,
      to: '0x1234567890123456789012345678901234567890' as const,
      valueEth: '0.1',
      gasLimit: 21000n,
      maxFeePerGas: 20000000000n,
      maxPriorityFeePerGas: 1000000000n,
    }

    const result = await executeTransactionPipeline({
      password: 'password123',
      preparedTxRequest,
      from: '0x71C7656EC7ab88b098def1734b743b44628b36d2',
      to: '0x1234567890123456789012345678901234567890',
      valueEth: '0.1',
    })

    expect(result.broadcastTxHash).toBe('0xmocktxhash123')
    expect(signEip1559Transaction).toHaveBeenCalled()
    expect(orpc.wallet.broadcastTx).toHaveBeenCalledWith({
      signedHex: '0x02f86c...signed',
      chainId: 11155111,
    })
    expect(saveClientTx).toHaveBeenCalled()
  })

  it('should fetch transaction receipt status', async () => {
    const status = await fetchTxReceiptStatus('0xmocktxhash123')
    expect(status).toBe('confirmed')
  })
})
