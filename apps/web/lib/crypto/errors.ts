export class CryptoWalletError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CryptoWalletError'
  }
}

export class InvalidMnemonicError extends CryptoWalletError {
  constructor(message = 'Invalid seed phrase provided.') {
    super(message)
    this.name = 'InvalidMnemonicError'
  }
}

export class InvalidChecksumError extends CryptoWalletError {
  constructor(message = 'Mnemonic checksum verification failed.') {
    super(message)
    this.name = 'InvalidChecksumError'
  }
}

export class VaultLockedError extends CryptoWalletError {
  constructor(message = 'Vault is currently locked.') {
    super(message)
    this.name = 'VaultLockedError'
  }
}

export class InvalidPasswordError extends CryptoWalletError {
  constructor(message = 'Incorrect password provided.') {
    super(message)
    this.name = 'InvalidPasswordError'
  }
}

export class CorruptedVaultError extends CryptoWalletError {
  constructor(message = 'Vault record in storage is corrupted or invalid.') {
    super(message)
    this.name = 'CorruptedVaultError'
  }
}
