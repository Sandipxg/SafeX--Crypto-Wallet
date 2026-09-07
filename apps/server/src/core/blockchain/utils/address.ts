import { isAddress, getAddress } from 'viem'

export function validateEvmAddress(address: string): `0x${string}` {
  if (!address || typeof address !== 'string') {
    throw new Error('Target EVM address is required.')
  }

  const trimmed = address.trim()
  if (!isAddress(trimmed)) {
    throw new Error(`Invalid EVM address format: "${address}".`)
  }

  const checksummed = getAddress(trimmed)
  if (checksummed === '0x0000000000000000000000000000000000000000') {
    throw new Error('Cannot send transaction to zero address (0x000...000).')
  }

  return checksummed
}
