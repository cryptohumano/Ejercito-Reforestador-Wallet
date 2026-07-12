/**
 * Helpers de dirección Ethereum
 */

import { getAddress, isAddress, type Address } from 'viem'

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return ''
  if (address.length < chars * 2 + 2) return address
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`
}

export function toChecksumAddress(address: string): Address | null {
  try {
    if (!isAddress(address)) return null
    return getAddress(address)
  } catch {
    return null
  }
}

export function explorerAddressUrl(explorerBase: string | undefined, address: string): string | null {
  if (!explorerBase) return null
  return `${explorerBase.replace(/\/$/, '')}/address/${address}`
}

export function explorerTxUrl(explorerBase: string | undefined, hash: string): string | null {
  if (!explorerBase) return null
  return `${explorerBase.replace(/\/$/, '')}/tx/${hash}`
}
