import { describe, it, expect } from 'vitest'
import { truncateAddress, truncateHash } from '../format'
import {
  getExplorerBaseUrl,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  getExplorerTokenUrl,
} from '../explorer'

describe('format utilities', () => {
  const sampleAddress = '0x71C7656EC7ab88b098def1734b743b44628b36d2'
  const sampleHash = '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b'

  describe('truncateAddress', () => {
    it('truncates standard 42-char address with default lengths (8 start, 6 end)', () => {
      const result = truncateAddress(sampleAddress)
      expect(result).toBe('0x71C765...8b36d2')
    })

    it('respects custom start and end characters', () => {
      const result = truncateAddress(sampleAddress, 6, 4)
      expect(result).toBe('0x71C7...36d2')
    })

    it('returns empty string when address is null, undefined, or empty', () => {
      expect(truncateAddress(null)).toBe('')
      expect(truncateAddress(undefined)).toBe('')
      expect(truncateAddress('')).toBe('')
    })

    it('returns original address unchanged if length is less than or equal to startChars + endChars', () => {
      expect(truncateAddress('0x12345', 4, 4)).toBe('0x12345')
    })
  })

  describe('truncateHash', () => {
    it('truncates standard 66-char tx hash with default lengths (6 start, 4 end)', () => {
      const result = truncateHash(sampleHash)
      expect(result).toBe('0x88df...944b')
    })

    it('returns empty string when hash is null, undefined, or empty', () => {
      expect(truncateHash(null)).toBe('')
      expect(truncateHash(undefined)).toBe('')
      expect(truncateHash('')).toBe('')
    })
  })
})

describe('explorer utilities', () => {
  const sampleHash = '0xabcdef123456'
  const sampleAddress = '0x71C7656EC7ab88b098def1734b743b44628b36d2'

  describe('getExplorerBaseUrl', () => {
    it('returns mainnet etherscan for chainId 1', () => {
      expect(getExplorerBaseUrl(1)).toBe('https://etherscan.io')
    })

    it('returns sepolia etherscan for chainId 11155111 and others', () => {
      expect(getExplorerBaseUrl(11155111)).toBe('https://sepolia.etherscan.io')
      expect(getExplorerBaseUrl(5)).toBe('https://sepolia.etherscan.io')
    })
  })

  describe('getExplorerTxUrl', () => {
    it('generates valid tx url for Sepolia', () => {
      expect(getExplorerTxUrl(11155111, sampleHash)).toBe(
        `https://sepolia.etherscan.io/tx/${sampleHash}`
      )
    })

    it('generates valid tx url for Mainnet', () => {
      expect(getExplorerTxUrl(1, sampleHash)).toBe(
        `https://etherscan.io/tx/${sampleHash}`
      )
    })
  })

  describe('getExplorerAddressUrl', () => {
    it('generates valid address url', () => {
      expect(getExplorerAddressUrl(11155111, sampleAddress)).toBe(
        `https://sepolia.etherscan.io/address/${sampleAddress}`
      )
    })
  })

  describe('getExplorerTokenUrl', () => {
    it('generates valid token url', () => {
      expect(getExplorerTokenUrl(1, sampleAddress)).toBe(
        `https://etherscan.io/token/${sampleAddress}`
      )
    })
  })
})
