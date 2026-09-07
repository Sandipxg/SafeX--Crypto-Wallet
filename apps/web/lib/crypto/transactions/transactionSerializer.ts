import { serializeTransaction, parseEther, TransactionSerializableEIP1559 } from 'viem'

export interface UnsignedEip1559Request {
  chainId?: number
  nonce: number
  to: `0x${string}`
  valueEth: string
  gasLimit: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  data?: `0x${string}`
}

export function prepareUnsignedTransaction(req: UnsignedEip1559Request): TransactionSerializableEIP1559 {
  return {
    type: 'eip1559',
    chainId: req.chainId ?? 11155111,
    nonce: req.nonce,
    to: req.to,
    value: parseEther(req.valueEth),
    gas: req.gasLimit,
    maxFeePerGas: req.maxFeePerGas,
    maxPriorityFeePerGas: req.maxPriorityFeePerGas,
    data: req.data ?? '0x',
  }
}

export function serializeUnsignedEip1559Payload(req: UnsignedEip1559Request): `0x${string}` {
  const tx = prepareUnsignedTransaction(req)
  return serializeTransaction(tx)
}
