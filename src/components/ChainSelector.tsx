import { DEFAULT_CHAINS, type ChainInfo } from '@/config/chains'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ChainSelectorProps {
  selectedChain: ChainInfo | null
  onSelectChain: (chain: ChainInfo) => void
  isConnecting: boolean
}

export function ChainSelector({ selectedChain, onSelectChain, isConnecting }: ChainSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleccionar Red</CardTitle>
        <CardDescription>
          Ethereum, Base y Arbitrum (mainnet y testnet)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEFAULT_CHAINS.map((chain) => (
            <Button
              key={chain.id}
              variant={selectedChain?.id === chain.id ? 'default' : 'outline'}
              onClick={() => onSelectChain(chain)}
              disabled={isConnecting}
              className="h-auto py-4 flex flex-col items-start"
            >
              <div className="flex items-center justify-between w-full gap-2">
                <span className="font-semibold">{chain.name}</span>
                <div className="flex gap-1">
                  {chain.testnet && <Badge variant="outline">test</Badge>}
                  {selectedChain?.id === chain.id && (
                    <Badge variant="secondary">Conectado</Badge>
                  )}
                </div>
              </div>
              {chain.description && (
                <span className="text-xs text-muted-foreground mt-1 text-left">
                  {chain.description} · chainId {chain.chainId}
                </span>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
