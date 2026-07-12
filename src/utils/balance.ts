/**
 * Formato de balances EVM (wei → ether)
 */

import { formatEther, formatUnits } from 'viem'
import { DEFAULT_CHAINS, type ChainInfo } from '@/config/chains'

export function getChainSymbol(chain?: ChainInfo | string | null): string {
  if (chain && typeof chain === 'object' && chain.nativeCurrency?.symbol) {
    return chain.nativeCurrency.symbol
  }
  if (typeof chain === 'string') {
    const found = DEFAULT_CHAINS.find(
      (c) => c.name === chain || c.id === chain || c.endpoint === chain
    )
    if (found) return found.nativeCurrency.symbol
  }
  return 'ETH'
}

export function formatNativeBalance(
  value: bigint | string | undefined | null,
  maxFractionDigits = 6
): string {
  if (value === undefined || value === null) return '0'
  const bi = typeof value === 'string' ? BigInt(value) : value
  const full = formatEther(bi)
  const [intPart, frac = ''] = full.split('.')
  if (!frac || maxFractionDigits === 0) return intPart
  const trimmed = frac.slice(0, maxFractionDigits).replace(/0+$/, '')
  return trimmed ? `${intPart}.${trimmed}` : intPart
}

export function formatBalanceForDisplay(
  value: bigint | string | undefined | null,
  _chain?: ChainInfo | string | null,
  opts?: { symbol?: string; digits?: number }
): string {
  const digits = opts?.digits ?? 6
  const formatted = formatNativeBalance(value, digits)
  const symbol =
    opts?.symbol ||
    (typeof _chain === 'object' && _chain?.nativeCurrency?.symbol) ||
    (typeof _chain === 'string' ? getChainSymbol(_chain) : null) ||
    'ETH'
  return `${formatted} ${symbol}`
}

export function formatTokenBalance(
  value: bigint,
  decimals: number,
  symbol?: string,
  maxFractionDigits = 6
): string {
  const full = formatUnits(value, decimals)
  const [intPart, frac = ''] = full.split('.')
  const trimmed = frac.slice(0, maxFractionDigits).replace(/0+$/, '')
  const num = trimmed ? `${intPart}.${trimmed}` : intPart
  return symbol ? `${num} ${symbol}` : num
}

/** @deprecated Alias — antes usaba plancks Substrate */
export function formatBalance(value: bigint | string, _decimals?: number): string {
  return formatNativeBalance(value)
}
