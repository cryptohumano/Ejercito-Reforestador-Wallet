import { ChainSelector } from '@/components/ChainSelector'
import { useNetwork } from '@/contexts/NetworkContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

export default function Networks() {
  const {
    selectedChain,
    setSelectedChain,
    isConnecting,
    error,
    connectedEndpoint,
    blockNumber,
  } = useNetwork()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Redes</h1>
        <p className="text-muted-foreground">
          Conecta a Ethereum, Base o Arbitrum (mainnet y testnet)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de conexión</CardTitle>
          <CardDescription>RPC activo para lecturas y transacciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {isConnecting ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Conectando…
            </div>
          ) : selectedChain ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant={selectedChain.testnet ? 'secondary' : 'default'}>
                  {selectedChain.name}
                </Badge>
                <span className="text-muted-foreground">chainId {selectedChain.chainId}</span>
              </div>
              <p className="font-mono text-xs break-all text-muted-foreground">
                {connectedEndpoint || selectedChain.endpoint}
              </p>
              {blockNumber !== null && (
                <p>
                  Bloque: <span className="font-mono">{blockNumber.toString()}</span>
                </p>
              )}
              {error && <p className="text-destructive">{error}</p>}
            </>
          ) : (
            <p className="text-muted-foreground">Sin red seleccionada</p>
          )}
        </CardContent>
      </Card>

      <ChainSelector
        selectedChain={selectedChain}
        onSelectChain={setSelectedChain}
        isConnecting={isConnecting}
      />
    </div>
  )
}
