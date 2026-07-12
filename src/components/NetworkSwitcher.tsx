import { DEFAULT_CHAINS, type ChainInfo } from '@/config/chains'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'

interface NetworkSwitcherProps {
  selectedChain: ChainInfo | null
  onSelectChain: (chain: ChainInfo) => void
  isConnecting: boolean
}

export function NetworkSwitcher({
  selectedChain,
  onSelectChain,
  isConnecting,
}: NetworkSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : selectedChain ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-muted-foreground" />
      )}
      <Select
        value={selectedChain?.id || ''}
        onValueChange={(id) => {
          const chain = DEFAULT_CHAINS.find((c) => c.id === id)
          if (chain) onSelectChain(chain)
        }}
        disabled={isConnecting}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Seleccionar red">
            {selectedChain ? (
              <span className="flex items-center gap-1.5 truncate">
                {selectedChain.name}
                {selectedChain.testnet && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    test
                  </Badge>
                )}
              </span>
            ) : (
              'Seleccionar red'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {DEFAULT_CHAINS.map((chain) => (
            <SelectItem key={chain.id} value={chain.id}>
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex flex-col">
                  <span>{chain.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {chain.description}
                  </span>
                </div>
                {chain.testnet && (
                  <Badge variant="secondary" className="text-[10px]">
                    testnet
                  </Badge>
                )}
                {selectedChain?.id === chain.id && (
                  <Badge variant="default" className="ml-1">
                    Activa
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
