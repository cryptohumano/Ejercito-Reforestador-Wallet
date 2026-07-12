import { useState, useEffect, useCallback } from 'react'
import { type Address, isAddress } from 'viem'
import { DEFAULT_CHAINS, type ChainInfo } from '@/config/chains'
import { createChainPublicClient } from '@/hooks/useEvmPublicClient'
import { useNetwork } from '@/contexts/NetworkContext'

export interface AccountBalance {
  chain: string
  chainName: string
  chainId: number
  address: string
  free: bigint
  reserved: bigint
  frozen: bigint
  total: bigint
  nonce?: number
  lastUpdate?: number
}

export interface MultiChainBalanceResult {
  balances: AccountBalance[]
  isLoading: boolean
  error: string | null
  lastUpdate: number | null
}

/**
 * Balances nativos (ETH) en varias cadenas EVM
 */
export function useMultiChainBalances(
  address: string | null,
  chains: ChainInfo[] = DEFAULT_CHAINS.filter((c) => c.family !== 'local')
): MultiChainBalanceResult {
  const [balances, setBalances] = useState<AccountBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)

  const fetchBalance = useCallback(
    async (chain: ChainInfo, addr: Address): Promise<AccountBalance | null> => {
      try {
        const client = createChainPublicClient(chain)
        const [free, nonce] = await Promise.all([
          client.getBalance({ address: addr }),
          client.getTransactionCount({ address: addr }),
        ])

        return {
          chain: chain.id,
          chainName: chain.name,
          chainId: chain.chainId,
          address: addr,
          free,
          reserved: 0n,
          frozen: 0n,
          total: free,
          nonce,
          lastUpdate: Date.now(),
        }
      } catch (err) {
        console.error(`[Balance] Error en ${chain.name}:`, err)
        return null
      }
    },
    []
  )

  const fetchAllBalances = useCallback(async () => {
    if (!address || !isAddress(address)) {
      setBalances([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const results = await Promise.all(chains.map((c) => fetchBalance(c, address as Address)))
      setBalances(results.filter((b): b is AccountBalance => b !== null))
      setLastUpdate(Date.now())
    } catch (err: any) {
      setError(err.message || 'Error al obtener balances')
    } finally {
      setIsLoading(false)
    }
  }, [address, chains, fetchBalance])

  useEffect(() => {
    fetchAllBalances()
  }, [fetchAllBalances])

  return { balances, isLoading, error, lastUpdate }
}

/**
 * Balance de la red actualmente seleccionada
 */
export function useCurrentChainBalance(address: string | null) {
  const { client, selectedChain } = useNetwork()
  const [balance, setBalance] = useState<AccountBalance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!client || !address || !selectedChain || !isAddress(address)) {
      setBalance(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    ;(async () => {
      try {
        const [free, nonce] = await Promise.all([
          client.getBalance({ address: address as Address }),
          client.getTransactionCount({ address: address as Address }),
        ])
        if (cancelled) return
        setBalance({
          chain: selectedChain.id,
          chainName: selectedChain.name,
          chainId: selectedChain.chainId,
          address,
          free,
          reserved: 0n,
          frozen: 0n,
          total: free,
          nonce,
          lastUpdate: Date.now(),
        })
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Error al obtener balance')
          setBalance(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [client, address, selectedChain])

  return { balance, isLoading, error }
}
