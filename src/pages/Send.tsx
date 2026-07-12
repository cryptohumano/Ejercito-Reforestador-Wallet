import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useKeyringContext } from '@/contexts/KeyringContext'
import { useNetwork } from '@/contexts/NetworkContext'
import { Send as SendIcon, Loader2, CheckCircle, XCircle, AlertCircle, Copy, Check } from 'lucide-react'
import Identicon from '@polkadot/react-identicon'
import { Avatar } from '@/components/ui/avatar'
import { saveTransaction, updateTransactionStatus, type StoredTransaction } from '@/utils/transactionStorage'
import { formatBalanceForDisplay } from '@/utils/balance'
import { shortenAddress } from '@/utils/address'
import {
  createWalletClient,
  http,
  parseEther,
  formatEther,
  isAddress,
  type Account,
  type Hex,
  type TransactionReceipt,
} from 'viem'

type TxUiStatus = 'idle' | 'pending' | 'inBlock' | 'finalized' | 'error'

export default function Send() {
  const { accounts, getAccount, isUnlocked } = useKeyringContext()
  const { client, selectedChain } = useNetwork()
  const [selectedAddress, setSelectedAddress] = useState('')
  const [destAddress, setDestAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [nonce, setNonce] = useState<string>('')
  const [isSending, setIsSending] = useState(false)
  const [txStatus, setTxStatus] = useState<TxUiStatus>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [finalizedBlock, setFinalizedBlock] = useState<{
    blockHash: string
    blockNumber: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<{
    partialFee: bigint
  } | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [copiedHash, setCopiedHash] = useState(false)

  const buildWalletClient = (address: string) => {
    if (!selectedChain) return null
    const krAccount = getAccount(address)
    if (!krAccount?.account) return null
    return createWalletClient({
      account: krAccount.account as Account,
      chain: selectedChain.viemChain,
      transport: http(selectedChain.endpoint),
    })
  }

  const handleEstimateFee = async () => {
    if (!client || !selectedChain || !selectedAddress || !destAddress || !amount) {
      setError('Por favor completa todos los campos requeridos')
      return
    }
    if (!isAddress(destAddress)) {
      setError('Dirección destino inválida')
      return
    }

    setIsEstimating(true)
    setError(null)
    setPaymentInfo(null)

    try {
      const value = parseEther(amount)
      const gas = await client.estimateGas({
        account: selectedAddress as `0x${string}`,
        to: destAddress as `0x${string}`,
        value,
      })
      const fees = await client.estimateFeesPerGas()
      const gasPrice = fees.maxFeePerGas ?? fees.gasPrice ?? 0n
      setPaymentInfo({ partialFee: gas * gasPrice })
    } catch (err: any) {
      setError(err.message || 'Error al estimar el fee')
    } finally {
      setIsEstimating(false)
    }
  }

  const handleSendTransaction = async () => {
    if (!client || !selectedChain || !selectedAddress || !destAddress || !amount) {
      setError('Por favor completa todos los campos requeridos')
      return
    }
    if (!isAddress(destAddress)) {
      setError('Dirección destino inválida')
      return
    }

    setIsSending(true)
    setError(null)
    setTxStatus('pending')
    setTxHash(null)
    setFinalizedBlock(null)

    try {
      const account = getAccount(selectedAddress)
      if (!account) {
        throw new Error('Cuenta no encontrada')
      }

      const wallet = buildWalletClient(selectedAddress)
      if (!wallet) {
        throw new Error('No se pudo crear WalletClient (¿wallet desbloqueado?)')
      }

      const value = parseEther(amount)
      const hash = await wallet.sendTransaction({
        to: destAddress as `0x${string}`,
        value,
        ...(nonce ? { nonce: parseInt(nonce, 10) } : {}),
      })

      setTxHash(hash)
      setTxStatus('pending')

      const storedTx: StoredTransaction = {
        id: hash,
        accountAddress: selectedAddress,
        toAddress: destAddress,
        amount: value.toString(),
        chain: selectedChain.name,
        chainEndpoint: selectedChain.endpoint,
        type: 'transfer',
        status: 'pending',
        txHash: hash,
        nonce: nonce ? parseInt(nonce, 10) : undefined,
        fee: paymentInfo ? paymentInfo.partialFee.toString() : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await saveTransaction(storedTx)

      const receipt: TransactionReceipt = await client.waitForTransactionReceipt({
        hash: hash as Hex,
      })

      const status: StoredTransaction['status'] =
        receipt.status === 'success' ? 'finalized' : 'invalid'
      setTxStatus(status === 'finalized' ? 'finalized' : 'error')
      setFinalizedBlock({
        blockHash: receipt.blockHash,
        blockNumber: Number(receipt.blockNumber),
      })

      await updateTransactionStatus(
        hash,
        status,
        receipt.blockHash,
        Number(receipt.blockNumber),
        status === 'invalid' ? 'Transacción revertida' : undefined
      )

      if (status === 'invalid') {
        setError('Transacción revertida en cadena')
      }
    } catch (err: any) {
      setTxStatus('error')
      setError(err.message || 'Error al enviar la transacción')
    } finally {
      setIsSending(false)
    }
  }

  const handleCopyHash = async () => {
    if (txHash) {
      await navigator.clipboard.writeText(txHash)
      setCopiedHash(true)
      setTimeout(() => setCopiedHash(false), 2000)
    }
  }

  if (!isUnlocked) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Enviar</h1>
          <p className="text-muted-foreground mt-2">
            El wallet debe estar desbloqueado para enviar transacciones
          </p>
        </div>
      </div>
    )
  }

  if (!selectedChain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Enviar</h1>
          <p className="text-muted-foreground mt-2">
            Selecciona una red en el navbar para enviar transacciones
          </p>
        </div>
      </div>
    )
  }

  const symbol = selectedChain.nativeCurrency.symbol

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enviar</h1>
        <p className="text-muted-foreground mt-2">
          Envía {symbol} desde tu cuenta a otra dirección
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Nueva Transacción</CardTitle>
            <CardDescription>
              Red: {selectedChain.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cuenta Origen</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(e.target.value)}
              >
                <option value="">Selecciona una cuenta</option>
                {accounts.map((account) => (
                  <option key={account.address} value={account.address}>
                    {account.meta.name || 'Sin nombre'} - {shortenAddress(account.address, 6)}
                  </option>
                ))}
              </select>
              {selectedAddress && (
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <Identicon value={selectedAddress} size={32} theme="ethereum" />
                  </Avatar>
                  <code className="text-xs font-mono">{shortenAddress(selectedAddress, 6)}</code>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destAddress">Dirección Destino</Label>
              <Input
                id="destAddress"
                value={destAddress}
                onChange={(e) => setDestAddress(e.target.value)}
                placeholder="0x…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Cantidad ({symbol})</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Cantidad en {symbol} (se convierte a wei al enviar)
              </p>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-medium">Opciones Avanzadas (Opcional)</Label>
              <div>
                <Label htmlFor="nonce" className="text-xs">Nonce</Label>
                <Input
                  id="nonce"
                  type="number"
                  value={nonce}
                  onChange={(e) => setNonce(e.target.value)}
                  placeholder="Auto"
                />
              </div>
            </div>

            {paymentInfo && (
              <Alert>
                <AlertDescription>
                  <strong>Fee estimado:</strong>{' '}
                  {formatBalanceForDisplay(paymentInfo.partialFee, selectedChain)}
                  {' '}({formatEther(paymentInfo.partialFee)} {symbol})
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleEstimateFee}
                disabled={!client || !selectedAddress || !destAddress || !amount || isEstimating || isSending}
                variant="outline"
                className="flex-1"
              >
                {isEstimating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Estimando...
                  </>
                ) : (
                  'Estimar Fee'
                )}
              </Button>
              <Button
                onClick={handleSendTransaction}
                disabled={!client || !selectedAddress || !destAddress || !amount || isSending || isEstimating}
                className="flex-1"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <SendIcon className="mr-2 h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de la Transacción</CardTitle>
            <CardDescription>
              Información sobre la última transacción enviada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!txHash && txStatus === 'idle' && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay transacciones enviadas aún</p>
              </div>
            )}

            {txHash && (
              <div className="space-y-2">
                <Label>Hash de Transacción</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono break-all p-2 bg-muted rounded">
                    {txHash}
                  </code>
                  <Button variant="ghost" size="sm" onClick={handleCopyHash}>
                    {copiedHash ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {txStatus !== 'idle' && (
              <div className="space-y-2">
                <Label>Estado</Label>
                <div>
                  {txStatus === 'finalized' ? (
                    <Badge className="gap-2 bg-green-500">
                      <CheckCircle className="h-3 w-3" />
                      Confirmada
                    </Badge>
                  ) : txStatus === 'error' ? (
                    <Badge variant="destructive" className="gap-2">
                      <XCircle className="h-3 w-3" />
                      Error
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {txStatus === 'pending' ? 'Pendiente' : txStatus}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {finalizedBlock && (
              <div className="space-y-2">
                <Label>Bloque</Label>
                <div className="space-y-1">
                  <p className="text-sm">
                    <strong>Número:</strong> {finalizedBlock.blockNumber}
                  </p>
                  <code className="text-xs font-mono break-all p-2 bg-muted rounded block">
                    {finalizedBlock.blockHash}
                  </code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
