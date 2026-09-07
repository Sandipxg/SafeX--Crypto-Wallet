import { describe, it, expect } from 'vitest'
import { validateEvmAddress } from '../utils/address.js'
import { getBalance } from '../read/balance.js'
import { estimateGasFees } from '../read/gas.js'
import { getPendingNonce } from '../read/nonce.js'

describe('Backend Blockchain Services Tests', () => {
  const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'

  it('should validate and checksum EVM addresses', () => {
    const checksummed = validateEvmAddress('0x742d35cc6634c0532925a3b844bc454e4438f44e')
    expect(checksummed).toBe(validAddress)
  })

  it('should reject invalid EVM addresses', () => {
    expect(() => validateEvmAddress('invalid-address')).toThrow('Invalid EVM address format')
    expect(() => validateEvmAddress('0x0000000000000000000000000000000000000000')).toThrow('zero address')
  })

  it('should query live native ETH balance from Sepolia testnet', async () => {
    const res = await getBalance(validAddress, 11155111)
    expect(res.address).toBe(validAddress)
    expect(res.wei).toBeDefined()
    expect(res.formattedEth).toBeDefined()
  })

  it('should fetch pending account nonce from Sepolia testnet', async () => {
    const nonce = await getPendingNonce(validAddress, 11155111)
    expect(typeof nonce).toBe('number')
    expect(nonce).toBeGreaterThanOrEqual(0)
  })

  it('should estimate EIP-1559 gas fees for standard ETH transfer', async () => {
    const to = '0x1234567890123456789012345678901234567890'
    const gasEst = await estimateGasFees(validAddress, to, '0.01', '0x', 11155111)

    expect(gasEst.maxFeePerGas).toBeDefined()
    expect(gasEst.maxPriorityFeePerGas).toBeDefined()
    expect(gasEst.estimatedGasUnits).toBe('21000')
  })
})
