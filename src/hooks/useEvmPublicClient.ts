/**
 * Cliente público viem para la red seleccionada.
 */

import { useEffect, useState, useRef } from 'react'
import {
  createPublicClient,
  http,
  type PublicClient,
  type Transport,
} from 'viem'
import type { ChainInfo } from '@/config/chains'

export function createChainPublicClient(chain: ChainInfo): PublicClient {
  return createPublicClient({
    chain: chain.viemChain,
    transport: http(chain.endpoint, {
      timeout: 20_000,
      retryCount: 2,
    }),
  })
}

export function useEvmPublicClient(chain: ChainInfo | null) {
  const [client, setClient] = useState<PublicClient | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectedEndpoint, setConnectedEndpoint] = useState<string | null>(null)
  const [blockNumber, setBlockNumber] = useState<bigint | null>(null)
  const genRef = useRef(0)

  useEffect(() => {
    if (!chain) {
      setClient(null)
      setConnectedEndpoint(null)
      setBlockNumber(null)
      setError(null)
      setIsConnecting(false)
      return
    }

    const gen = ++genRef.current
    let cancelled = false

    const connect = async () => {
      setIsConnecting(true)
      setError(null)
      setClient(null)
      setBlockNumber(null)

      try {
        const publicClient = createChainPublicClient(chain)
        const bn = await publicClient.getBlockNumber()

        if (cancelled || gen !== genRef.current) return

        setClient(publicClient)
        setConnectedEndpoint(chain.endpoint)
        setBlockNumber(bn)
        setIsConnecting(false)
        console.log(
          `[EVM] Conectado a ${chain.name} (chainId=${chain.chainId}) @ block ${bn}`
        )
      } catch (err) {
        if (cancelled || gen !== genRef.current) return
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[EVM] Error conectando a ${chain.name}:`, message)
        setError(message)
        setClient(null)
        setConnectedEndpoint(null)
        setIsConnecting(false)
      }
    }

    connect()

    return () => {
      cancelled = true
    }
  }, [chain?.id, chain?.endpoint])

  return {
    client,
    isConnecting,
    error,
    connectedEndpoint,
    blockNumber,
  }
}

export type { PublicClient, Transport }
