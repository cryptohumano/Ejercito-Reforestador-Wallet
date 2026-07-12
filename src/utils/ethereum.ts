/**
 * Utilidades Ethereum con viem (reemplaza derivación Substrate→ETH)
 */

import { getAddress, isAddress, type Address } from 'viem'
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts'
import type { Hex } from 'viem'

/**
 * Dirección checksummed desde mnemonic BIP-39 (path Ethereum por defecto)
 */
export function addressFromMnemonic(
  mnemonic: string,
  path: `m/44'/60'/${string}` = "m/44'/60'/0'/0/0"
): Address {
  return mnemonicToAccount(mnemonic, { path }).address
}

/**
 * Dirección desde private key hex
 */
export function addressFromPrivateKey(privateKey: Hex): Address {
  return privateKeyToAccount(privateKey).address
}

/**
 * Normaliza / valida dirección Ethereum
 */
export function normalizeAddress(address: string): Address | null {
  try {
    if (!isAddress(address)) return null
    return getAddress(address)
  } catch {
    return null
  }
}

/** @deprecated Usar addressFromMnemonic */
export function deriveEthereumAddress(seed: string): string {
  // Si parece mnemonic (varias palabras), derivar HD; si no, private key
  if (seed.trim().includes(' ')) {
    return addressFromMnemonic(seed.trim())
  }
  const pk = (seed.startsWith('0x') ? seed : `0x${seed}`) as Hex
  return addressFromPrivateKey(pk)
}

/** @deprecated Ya no hay KeyringPair Substrate */
export function deriveEthereumAddressFromPair(_pair: unknown, seed?: string): string | null {
  if (!seed) return null
  try {
    return deriveEthereumAddress(seed)
  } catch {
    return null
  }
}

/** Valida dirección Ethereum (checksum opcional) */
export function isValidEthereumAddress(address: string): boolean {
  return isAddress(address)
}
