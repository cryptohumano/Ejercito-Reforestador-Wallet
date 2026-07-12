/**
 * @deprecated Usar `@/config/chains` y `useEvmPublicClient`.
 * Re-exporta el catálogo EVM para no romper imports antiguos.
 */

export type { ChainInfo } from '@/config/chains'
export { DEFAULT_CHAINS, getChainById, getChainByEndpoint } from '@/config/chains'

/** Stub: ya no hay Dedot. Usar useNetwork().client (PublicClient). */
export function useDedotClient(_endpoint: string | null) {
  console.warn('[useDedotClient] Deprecado — usa useNetwork() / useEvmPublicClient')
  return {
    client: null,
    isConnecting: false,
    error: 'useDedotClient deprecado: la wallet usa viem/EVM',
    connectedEndpoint: null as string | null,
  }
}
