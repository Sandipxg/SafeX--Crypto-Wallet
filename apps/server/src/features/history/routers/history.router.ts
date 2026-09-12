import { os } from '../../../core/orpc/server.js'
import { fetchOnChainTransactions } from '../services/history.service.js'

export const historyRouter = {
  getTransactions: os.handler(async (rawInput: unknown) => {
    const input = rawInput as {
      address: string
      chainId?: number
    }
    if (!input || !input.address) {
      throw new Error('Address is required to fetch transaction history.')
    }
    const chainId = input.chainId ?? 11155111
    const transactions = await fetchOnChainTransactions(input.address, chainId)
    return { transactions }
  }),
}
