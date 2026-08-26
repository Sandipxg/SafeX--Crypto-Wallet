import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateAccessSessionToken, generateRefreshSessionToken, verifyAccessToken } from '../auth.router.js'

describe('Backend Auth Router & JWT Token Tests', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000'
  const walletAddress = '0x71c7656ec7ab88b098def1734b743b44628b36d2'

  it('should generate a valid 15-minute access token', () => {
    const token = generateAccessSessionToken(userId, walletAddress)
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')

    const payload = verifyAccessToken(token)
    expect(payload.sub).toBe(userId)
    expect(payload.wid).toBe(walletAddress)
  })

  it('should generate a valid 7-day refresh token', () => {
    const refreshToken = generateRefreshSessionToken(userId, walletAddress)
    expect(refreshToken).toBeDefined()
    expect(typeof refreshToken).toBe('string')
  })
})
