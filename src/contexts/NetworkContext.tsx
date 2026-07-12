import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react'
import {
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Account,
} from 'viem'
import {
  DEFAULT_CHAINS,
  DEFAULT_CHAIN_ID,
  getChainById,
  loadSavedChainId,
  saveSelectedChainId,
  type ChainInfo,
} from '@/config/chains'
import { useEvmPublicClient } from '@/hooks/useEvmPublicClient'
import { useKeyringContext } from '@/contexts/KeyringContext'
import { useActiveAccount } from '@/contexts/ActiveAccountContext'

interface NetworkContextType {
  selectedChain: ChainInfo | null
  setSelectedChain: (chain: ChainInfo | null) => void
  /** Cliente de lectura RPC (viem) */
  client: PublicClient | null
  /**
   * Compat: antes era DedotClient.
   * Preferir `client` (PublicClient).
   */
  publicClient: PublicClient | null
  isConnecting: boolean
  error: string | null
  connectedEndpoint: string | null
  blockNumber: bigint | null
  chains: ChainInfo[]
  /** WalletClient listo para firmar txs con la cuenta activa (si está desbloqueada) */
  getWalletClient: () => WalletClient | null
}

export const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

function resolveInitialChain(): ChainInfo {
  const saved = loadSavedChainId()
  if (saved) {
    const found = getChainById(saved)
    if (found) return found
  }
  return getChainById(DEFAULT_CHAIN_ID) || DEFAULT_CHAINS[1] || DEFAULT_CHAINS[0]
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [selectedChain, setSelectedChainState] = useState<ChainInfo | null>(() =>
    resolveInitialChain()
  )

  const { client, isConnecting, error, connectedEndpoint, blockNumber } =
    useEvmPublicClient(selectedChain)

  const { isUnlocked, getAccount } = useKeyringContext()
  const { activeAccount } = useActiveAccount()

  const setSelectedChain = useCallback((chain: ChainInfo | null) => {
    if (!chain) return
    setSelectedChainState(chain)
    saveSelectedChainId(chain.id)
  }, [])

  useEffect(() => {
    if (!selectedChain) {
      setSelectedChainState(resolveInitialChain())
    }
  }, [selectedChain])

  const getWalletClient = useCallback((): WalletClient | null => {
    if (!selectedChain || !isUnlocked || !activeAccount) return null
    const krAccount = getAccount(activeAccount)
    if (!krAccount?.account) return null

    return createWalletClient({
      account: krAccount.account as Account,
      chain: selectedChain.viemChain,
      transport: http(selectedChain.endpoint),
    })
  }, [selectedChain, isUnlocked, activeAccount, getAccount])

  const value = useMemo<NetworkContextType>(
    () => ({
      selectedChain,
      setSelectedChain,
      client,
      publicClient: client,
      isConnecting,
      error: error || null,
      connectedEndpoint,
      blockNumber,
      chains: DEFAULT_CHAINS,
      getWalletClient,
    }),
    [
      selectedChain,
      setSelectedChain,
      client,
      isConnecting,
      error,
      connectedEndpoint,
      blockNumber,
      getWalletClient,
    ]
  )

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  )
}

export function useNetwork() {
  const context = useContext(NetworkContext)
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider')
  }
  return context
}
