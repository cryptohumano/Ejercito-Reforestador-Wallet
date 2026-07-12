/**
 * Cadenas EVM soportadas por Ejército Reforestador (viem).
 * @see https://viem.sh/docs/chains/introduction
 */

import {
  mainnet,
  sepolia,
  base,
  baseSepolia,
  arbitrum,
  arbitrumSepolia,
  localhost,
  type Chain,
} from 'viem/chains'

export type ChainFamily = 'ethereum' | 'base' | 'arbitrum' | 'local'

export interface ChainInfo {
  /** Id estable para UI / storage */
  id: string
  name: string
  /** RPC HTTP primario */
  endpoint: string
  chainId: number
  description?: string
  testnet?: boolean
  family: ChainFamily
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  blockExplorer?: {
    name: string
    url: string
  }
  /** Objeto Chain de viem */
  viemChain: Chain
}

function fromViem(
  id: string,
  chain: Chain,
  opts: {
    family: ChainFamily
    description: string
    testnet?: boolean
    rpcOverride?: string
  }
): ChainInfo {
  const rpc =
    opts.rpcOverride ||
    chain.rpcUrls.default.http[0] ||
    ''

  const explorer = chain.blockExplorers?.default

  return {
    id,
    name: chain.name,
    endpoint: rpc,
    chainId: chain.id,
    description: opts.description,
    testnet: opts.testnet ?? false,
    family: opts.family,
    nativeCurrency: {
      name: chain.nativeCurrency.name,
      symbol: chain.nativeCurrency.symbol,
      decimals: chain.nativeCurrency.decimals,
    },
    blockExplorer: explorer
      ? { name: explorer.name, url: explorer.url }
      : undefined,
    viemChain: chain,
  }
}

/** Catálogo de redes — mainnet + testnet por familia */
export const DEFAULT_CHAINS: ChainInfo[] = [
  fromViem('ethereum', mainnet, {
    family: 'ethereum',
    description: 'Ethereum Mainnet',
    // RPC públicos fiables (viem default a veces rate-limita)
    rpcOverride: 'https://ethereum.publicnode.com',
  }),
  fromViem('sepolia', sepolia, {
    family: 'ethereum',
    description: 'Ethereum Sepolia (testnet)',
    testnet: true,
    rpcOverride: 'https://ethereum-sepolia.publicnode.com',
  }),
  fromViem('base', base, {
    family: 'base',
    description: 'Base Mainnet (Coinbase L2)',
    rpcOverride: 'https://base.publicnode.com',
  }),
  fromViem('base-sepolia', baseSepolia, {
    family: 'base',
    description: 'Base Sepolia (testnet)',
    testnet: true,
    rpcOverride: 'https://base-sepolia.publicnode.com',
  }),
  fromViem('arbitrum', arbitrum, {
    family: 'arbitrum',
    description: 'Arbitrum One',
    rpcOverride: 'https://arbitrum-one.publicnode.com',
  }),
  fromViem('arbitrum-sepolia', arbitrumSepolia, {
    family: 'arbitrum',
    description: 'Arbitrum Sepolia (testnet)',
    testnet: true,
    rpcOverride: 'https://arbitrum-sepolia.publicnode.com',
  }),
  fromViem('localhost', localhost, {
    family: 'local',
    description: 'Anvil / Hardhat local (desarrollo)',
    testnet: true,
    rpcOverride: 'http://127.0.0.1:8545',
  }),
]

export const DEFAULT_CHAIN_ID = 'sepolia'

export function getChainById(id: string): ChainInfo | undefined {
  return DEFAULT_CHAINS.find((c) => c.id === id)
}

export function getChainByChainId(chainId: number): ChainInfo | undefined {
  return DEFAULT_CHAINS.find((c) => c.chainId === chainId)
}

export function getChainByEndpoint(endpoint: string): ChainInfo | undefined {
  return DEFAULT_CHAINS.find((c) => c.endpoint === endpoint)
}

const STORAGE_KEY = 'mst-wallet-selected-chain'

export function loadSavedChainId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function saveSelectedChainId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}
