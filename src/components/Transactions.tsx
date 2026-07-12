import { useState } from 'react'
import type { PublicClient, Hex, Account } from 'viem'
import { createWalletClient, http, parseEther, isAddress } from 'viem'
import { useKeyringContext } from '@/contexts/KeyringContext'
import { useNetwork } from '@/contexts/NetworkContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Identicon from '@polkadot/react-identicon'
import { formatBalanceForDisplay } from '@/utils/balance'

interface TransactionsProps {
  client: PublicClient | null
}

/**
 * Envío nativo EVM (viem). Preferir la página /send para la UX completa.
 */
export function Transactions({ client }: TransactionsProps) {
  const { accounts, getAccount, isUnlocked } = useKeyringContext()
  const { selectedChain } = useNetwork()
  const [selectedAddress, setSelectedAddress] = useState('')
  const [destAddress, setDestAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<{ partialFee: bigint } | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleEstimateFee = async () => {
    if (!client || !selectedAddress || !destAddress || !amount || !isAddress(destAddress)) {
      setError('Completa los campos con una dirección válida')
      return
    }
    setIsEstimating(true)
    setError(null)
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
      setError(err.message || 'Error al estimar la tarifa')
    } finally {
      setIsEstimating(false)
    }
  }

  const handleSendTransaction = async () => {
    if (!client || !selectedChain || !selectedAddress || !destAddress || !amount) {
      setError('Completa todos los campos')
      return
    }
    if (!isAddress(destAddress)) {
      setError('Dirección destino inválida')
      return
    }
    setIsSending(true)
    setError(null)
    setSuccess(false)
    setTxHash(null)
    try {
      const kr = getAccount(selectedAddress)
      if (!kr?.account) throw new Error('Cuenta no encontrada')
      const wallet = createWalletClient({
        account: kr.account as Account,
        chain: selectedChain.viemChain,
        transport: http(selectedChain.endpoint),
      })
      const hash = await wallet.sendTransaction({
        to: destAddress as `0x${string}`,
        value: parseEther(amount),
      })
      setTxHash(hash)
      const receipt = await client.waitForTransactionReceipt({ hash: hash as Hex })
      setSuccess(receipt.status === 'success')
      if (receipt.status !== 'success') setError('Transacción revertida')
    } catch (err: any) {
      setError(err.message || 'Error al enviar')
    } finally {
      setIsSending(false)
    }
  }

  if (!isUnlocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transacciones</CardTitle>
          <CardDescription>Desbloquea el wallet para enviar</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar {selectedChain?.nativeCurrency.symbol || 'ETH'}</CardTitle>
        <CardDescription>Transferencia nativa vía viem</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedAddress}
          onChange={(e) => setSelectedAddress(e.target.value)}
        >
          <option value="">Cuenta</option>
          {accounts.map((a) => (
            <option key={a.address} value={a.address}>
              {a.meta.name || a.address}
            </option>
          ))}
        </select>
        {selectedAddress && (
          <div className="flex items-center gap-2">
            <Identicon value={selectedAddress} size={24} theme="ethereum" />
            <code className="text-xs font-mono">{selectedAddress}</code>
          </div>
        )}
        <Input
          placeholder="0x destino"
          value={destAddress}
          onChange={(e) => setDestAddress(e.target.value)}
        />
        <Input
          placeholder="Cantidad (ETH)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {paymentInfo && (
          <p className="text-sm">
            Fee: {formatBalanceForDisplay(paymentInfo.partialFee, selectedChain)}
          </p>
        )}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {txHash && (
          <div className="flex items-center gap-2 text-sm">
            {success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
            <code className="font-mono text-xs break-all">{txHash}</code>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEstimateFee} disabled={isEstimating || isSending}>
            {isEstimating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Estimar'}
          </Button>
          <Button onClick={handleSendTransaction} disabled={isSending || isEstimating}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar
          </Button>
        </div>
        {success && <Badge className="bg-green-500">Confirmada</Badge>}
      </CardContent>
    </Card>
  )
}
