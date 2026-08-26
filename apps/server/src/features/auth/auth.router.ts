import jwt from 'jsonwebtoken'
import { config } from '../../core/config/env.js'
import { db } from '../../core/db/client.js'

export interface JwtPayload {
  sub: string
  wid: string
  iat?: number
  exp?: number
}

export function generateAccessSessionToken(userId: string, walletAddress: string): string {
  return jwt.sign(
    { sub: userId, wid: walletAddress },
    config.jwtSecret,
    { expiresIn: '15m' }
  )
}

export function generateRefreshSessionToken(userId: string, walletAddress: string): string {
  return jwt.sign(
    { sub: userId, wid: walletAddress },
    config.jwtRefreshSecret,
    { expiresIn: '7d' }
  )
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}

export const authRouter = {
  async registerWallet(input: { walletAddress: string; publicKey: string }) {
    const normalizedAddress = input.walletAddress.toLowerCase()

    let user = await db.users.findByOptional({ walletAddress: normalizedAddress })

    if (!user) {
      user = await db.users.create({
        walletAddress: normalizedAddress,
        publicKey: input.publicKey,
      })
    }

    const accessToken = generateAccessSessionToken(user.id, user.walletAddress)
    const refreshToken = generateRefreshSessionToken(user.id, user.walletAddress)

    return {
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        publicKey: user.publicKey,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    }
  },

  async loginWallet(input: { walletAddress: string }) {
    const normalizedAddress = input.walletAddress.toLowerCase()

    const user = await db.users.findByOptional({ walletAddress: normalizedAddress })
    if (!user) {
      throw new Error('Wallet not registered on backend server.')
    }

    const accessToken = generateAccessSessionToken(user.id, user.walletAddress)
    const refreshToken = generateRefreshSessionToken(user.id, user.walletAddress)

    return {
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        publicKey: user.publicKey,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    }
  },

  async getMe(input: { walletAddress: string }) {
    const normalizedAddress = input.walletAddress.toLowerCase()
    const user = await db.users.findByOptional({ walletAddress: normalizedAddress })
    if (!user) {
      return { user: null }
    }
    return {
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        publicKey: user.publicKey,
        createdAt: user.createdAt,
      },
    }
  },

  async logout() {
    return { success: true }
  },
}
