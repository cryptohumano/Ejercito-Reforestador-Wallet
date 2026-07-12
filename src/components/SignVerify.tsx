import { useState } from 'react'
import { useKeyringContext } from '@/contexts/KeyringContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle, XCircle } from 'lucide-react'
import { verifyMessage, type Hex } from 'viem'
import Identicon from '@polkadot/react-identicon'

/**
 * Firmar / verificar mensajes con cuentas Ethereum (viem)
 */
export function SignVerify() {
  const { accounts, getAccount } = useKeyringContext()
  const [selectedAddress, setSelectedAddress] = useState('')
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean
    address?: string
  } | null>(null)

  const handleSign = async () => {
    if (!selectedAddress || !message.trim()) return

    const account = getAccount(selectedAddress)
    if (!account) {
      alert('Cuenta no encontrada')
      return
    }

    try {
      const sig = await account.account.signMessage({ message })
      setSignature(sig)
      setVerificationResult(null)
    } catch (error: any) {
      alert(`Error al firmar: ${error.message}`)
    }
  }

  const handleVerify = async () => {
    if (!message.trim() || !signature.trim()) {
      alert('Por favor completa el mensaje y la firma')
      return
    }

    try {
      const sig = (signature.startsWith('0x') ? signature : `0x${signature}`) as Hex

      for (const account of accounts) {
        const ok = await verifyMessage({
          address: account.address,
          message,
          signature: sig,
        })
        if (ok) {
          setVerificationResult({ isValid: true, address: account.address })
          return
        }
      }

      setVerificationResult({ isValid: false })
    } catch (error: any) {
      alert(`Error al verificar: ${error.message}`)
      setVerificationResult({ isValid: false })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Firmar / Verificar
        </CardTitle>
        <CardDescription>
          Firma mensajes con tu cuenta Ethereum (personal_sign / viem)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Cuenta</label>
          <div className="space-y-2">
            {accounts.map((acc) => (
              <button
                key={acc.address}
                type="button"
                onClick={() => setSelectedAddress(acc.address)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left ${
                  selectedAddress === acc.address ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <Identicon value={acc.address} size={32} theme="ethereum" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{acc.meta.name || 'Account'}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {acc.address}
                  </div>
                </div>
                <Badge variant="outline" className="ml-auto">
                  secp256k1
                </Badge>
              </button>
            ))}
            {accounts.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay cuentas desbloqueadas</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mensaje</label>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Texto a firmar"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSign} disabled={!selectedAddress || !message.trim()}>
            Firmar
          </Button>
          <Button variant="outline" onClick={handleVerify} disabled={!message.trim() || !signature}>
            Verificar
          </Button>
        </div>

        {signature && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Firma</label>
            <p className="text-xs font-mono break-all bg-muted p-2 rounded">{signature}</p>
          </div>
        )}

        {verificationResult && (
          <div
            className={`flex items-center gap-2 text-sm ${
              verificationResult.isValid ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {verificationResult.isValid ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Válida
                {verificationResult.address && (
                  <span className="font-mono text-xs">({verificationResult.address})</span>
                )}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Inválida
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
