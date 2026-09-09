import { encodeFunctionData } from 'viem'
import { standardErc20Abi } from './tokenTypes'

/**
 * Encodes calldata for ERC-20 transfer(address recipient, uint256 amount)
 * Returns 4-byte selector (0xa9059cbb) + 32-byte recipient + 32-byte amount
 */
export function encodeTokenTransfer(
  recipient: `0x${string}`,
  amountRaw: bigint
): `0x${string}` {
  return encodeFunctionData({
    abi: standardErc20Abi,
    functionName: 'transfer',
    args: [recipient, amountRaw],
  })
}

/**
 * Encodes calldata for ERC-20 approve(address spender, uint256 amount)
 * Returns 4-byte selector (0x095ea7b3) + 32-byte spender + 32-byte amount
 */
export function encodeTokenApprove(
  spender: `0x${string}`,
  amountRaw: bigint
): `0x${string}` {
  return encodeFunctionData({
    abi: standardErc20Abi,
    functionName: 'approve',
    args: [spender, amountRaw],
  })
}

/**
 * Encodes calldata for ERC-20 transferFrom(address sender, address recipient, uint256 amount)
 * Returns 4-byte selector (0x23b872dd) + 32-byte sender + 32-byte recipient + 32-byte amount
 */
export function encodeTokenTransferFrom(
  sender: `0x${string}`,
  recipient: `0x${string}`,
  amountRaw: bigint
): `0x${string}` {
  return encodeFunctionData({
    abi: standardErc20Abi,
    functionName: 'transferFrom',
    args: [sender, recipient, amountRaw],
  })
}
