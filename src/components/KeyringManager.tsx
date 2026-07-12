import { useState } from 'react'
import { useKeyringContext } from '@/contexts/KeyringContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Key, Plus, Trash2, Copy, Check, ExternalLink } from 'lucide-react'
import type { KeyringAccount } from '@/hooks/useKeyring'
import Identicon from '@polkadot/react-identicon'

export function KeyringManager() {
  const {
    isReady,
    accounts,
    isUnlocked,
    generateMnemonic,
    addFromMnemonic,
    addFromPrivateKey,
    addFromUri,
    removeAccount,
  } = useKeyringContext()
  const [mnemonic, setMnemonic] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [accountName, setAccountName] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [generatedMnemonic, setGeneratedMnemonic] = useState('')
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [password, setPassword] = useState('')

  const handleGenerateMnemonic = () => {
    const newMnemonic = generateMnemonic()
    setGeneratedMnemonic(newMnemonic)
    setMnemonic(newMnemonic)
    setShowMnemonic(true)
  }

  const handleAddFromMnemonic = async () => {
    if (!mnemonic.trim()) return
    if (!isUnlocked) {
      alert('Por favor desbloquea el keyring primero')
      return
    }

    await addFromMnemonic(mnemonic.trim(), accountName || undefined, password || undefined)
    setMnemonic('')
    setAccountName('')
    setPassword('')
  }

  const handleAddFromPrivateKey = async () => {
    if (!privateKey.trim()) return
    if (!isUnlocked) {
      alert('Por favor desbloquea el keyring primero')
      return
    }

    const name = accountName.trim() || undefined
    if (addFromPrivateKey) {
      await addFromPrivateKey(privateKey.trim(), name, password || undefined)
    } else {
      await addFromUri(privateKey.trim(), name, undefined, password || undefined)
    }
    setPrivateKey('')
    if (name) setAccountName('')
    setPassword('')
  }

  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  if (!isReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Cuentas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Inicializando keyring...</p>
        </CardContent>
      </Card>
    )
  }

  if (!isUnlocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Cuentas</CardTitle>
          <CardDescription>
            Genera mnemonics o desbloquea el keyring para gestionar tus cuentas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button onClick={handleGenerateMnemonic} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Generar Nuevo Mnemonic
            </Button>
            {showMnemonic && generatedMnemonic && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Mnemonic generado (guárdalo de forma segura):</p>
                <p className="text-sm font-mono break-all mb-2">{generatedMnemonic}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                  ⚠️ Desbloquea el keyring primero para poder crear una cuenta con este mnemonic
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Para crear cuentas:</strong> Desbloquea el keyring usando el componente "Desbloquear Keyring" arriba.
              Si no tienes cuentas almacenadas, puedes desbloquear con cualquier contraseña (se creará una nueva sesión).
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Cuentas (Keyring)</CardTitle>
          <CardDescription>
            Crea y gestiona cuentas Ethereum (secp256k1 / viem)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs">
              secp256k1
            </Badge>
            <p className="text-xs text-muted-foreground">
              Todas las cuentas usan ECDSA secp256k1 (compatible con Ethereum)
            </p>
          </div>

          {/* Generar Mnemonic */}
          <div className="space-y-2">
            <Button onClick={handleGenerateMnemonic} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Generar Nuevo Mnemonic
            </Button>
            {showMnemonic && generatedMnemonic && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Mnemonic generado (guárdalo de forma segura):</p>
                <p className="text-sm font-mono break-all mb-2">{generatedMnemonic}</p>
                <Button
                  size="sm"
                  onClick={() => {
                    setMnemonic(generatedMnemonic)
                    setShowMnemonic(false)
                  }}
                  variant="outline"
                >
                  Usar este mnemonic
                </Button>
                <Button
                  size="sm"
                  className="ml-2"
                  onClick={async () => {
                    if (!isUnlocked) {
                      alert('Por favor desbloquea el keyring primero')
                      return
                    }
                    setMnemonic(generatedMnemonic)
                    setShowMnemonic(false)
                    await addFromMnemonic(
                      generatedMnemonic,
                      accountName.trim() || undefined,
                      password || undefined
                    )
                    setMnemonic('')
                    setAccountName('')
                    setGeneratedMnemonic('')
                    setShowMnemonic(false)
                    setPassword('')
                  }}
                  disabled={!isUnlocked}
                >
                  Usar y crear cuenta
                </Button>
              </div>
            )}
          </div>

          {/* Agregar desde Mnemonic */}
          <div className="space-y-2">
            <Input
              placeholder="Mnemonic (12, 15, 18, 21 o 24 palabras)"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              disabled={!isUnlocked}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de la cuenta (opcional)"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="flex-1"
                disabled={!isUnlocked}
              />
              <Button onClick={handleAddFromMnemonic} disabled={!mnemonic.trim() || !isUnlocked}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
            {isUnlocked && (
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Contraseña para encriptar (opcional, se guardará encriptada)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Si proporcionas una contraseña, la cuenta se guardará encriptada en IndexedDB
                </p>
              </div>
            )}
          </div>

          {/* Agregar desde clave privada */}
          <div className="space-y-2">
            <Input
              placeholder="Clave privada hex (0x… o sin prefijo)"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              disabled={!isUnlocked}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de la cuenta (opcional)"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="flex-1"
                disabled={!isUnlocked}
              />
              <Button
                onClick={handleAddFromPrivateKey}
                disabled={!privateKey.trim() || !isUnlocked}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar desde clave privada
              </Button>
            </div>
            {isUnlocked && (
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Contraseña para encriptar (opcional, se guardará encriptada)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Si proporcionas una contraseña, la cuenta se guardará encriptada en IndexedDB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cuentas */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cuentas ({accounts.length})</CardTitle>
            <CardDescription>
              Cuentas Ethereum agregadas al keyring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accounts.map((account: KeyringAccount) => (
                <div
                  key={account.address}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Identicon
                        value={account.address}
                        size={24}
                        theme="ethereum"
                      />
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium truncate">
                        {account.meta.name || 'Sin nombre'}
                      </p>
                    </div>
                    <p className="text-sm font-mono break-all text-muted-foreground">
                      {account.address}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          window.open(`https://etherscan.io/address/${account.address}`, '_blank')
                        }}
                        title="Ver en Etherscan"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        secp256k1
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      >
                        Ethereum
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyAddress(account.address)}
                    >
                      {copiedAddress === account.address ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAccount(account.address)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
