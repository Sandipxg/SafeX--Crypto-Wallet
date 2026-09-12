/**
 * String formatting utilities for addresses and transaction hashes
 */

export const truncateAddress = (
  address?: string | null,
  startChars = 8,
  endChars = 6
): string => {
  if (!address) return ''
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

export const truncateHash = (
  hash?: string | null,
  startChars = 6,
  endChars = 4
): string => {
  if (!hash) return ''
  if (hash.length <= startChars + endChars) return hash
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`
}
