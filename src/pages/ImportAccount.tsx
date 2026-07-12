import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKeyringContext } from '@/contexts/KeyringContext'
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff, Key, FileText } from 'lucide-react'

type ImportMethod = 'mnemonic' | 'uri' | 'json'

function looksLikePolkadotJsJson(parsed: Record<string, unknown>): boolean {
  if (parsed.address && parsed.encoded) return true
  if (parsed.encoded && Array.isArray(parsed.accounts)) return true
  return false
}

export default function ImportAccount() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addFromMnemonic, addFromPrivateKey, isUnlocked, unlock } = useKeyringContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const methodFromUrl = searchParams.get('method') as ImportMethod | null
  const [method, setMethod] = useState<ImportMethod>(methodFromUrl || 'mnemonic')

  useEffect(() => {
    if (methodFromUrl && ['mnemonic', 'uri', 'json'].includes(methodFromUrl)) {
      setMethod(methodFromUrl)
    }
  }, [methodFromUrl])

  const [mnemonic, setMnemonic] = useState('')
  const [uri, setUri] = useState('')
  const [jsonData, setJsonData] = useState('')
  const [jsonFile, setJsonFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [importedAddress, setImportedAddress] = useState<string | null>(null)

  const validateMnemonic = (value: string): boolean => {
    const words = value.trim().split(/\s+/)
    return words.length === 12 || words.length === 24
  }

  const handleImport = async () => {
    setError('')
    setSuccess(false)
    setImportedAddress(null)

    if (password) {
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres')
        return
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden')
        return
      }
    }

    setLoading(true)

    try {
      if (!isUnlocked && password) {
        const unlocked = await unlock(password)
        if (!unlocked) {
          setError('Error al desbloquear el wallet. Verifica tu contraseña.')
          setLoading(false)
          return
        }
      }

      let account = null

      switch (method) {
        case 'mnemonic':
          if (!mnemonic.trim()) {
            setError('Por favor ingresa tu frase de recuperación (mnemonic)')
            setLoading(false)
            return
          }

          if (!validateMnemonic(mnemonic)) {
            setError('La frase de recuperación debe tener 12 o 24 palabras')
            setLoading(false)
            return
          }

          account = await addFromMnemonic(
            mnemonic.trim(),
            name.trim() || undefined,
            password || undefined
          )
          break

        case 'uri':
          if (!uri.trim()) {
            setError('Por favor ingresa tu clave privada')
            setLoading(false)
            return
          }

          account = await addFromPrivateKey(
            uri.trim(),
            name.trim() || undefined,
            password || undefined
          )
          break

        case 'json': {
          try {
            let parsed: Record<string, unknown>

            if (jsonFile) {
              const fileContent = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = (e) => resolve(e.target?.result as string)
                reader.onerror = () => reject(new Error('Error al leer el archivo'))
                reader.readAsText(jsonFile)
              })
              parsed = JSON.parse(fileContent)
            } else if (jsonData) {
              parsed = JSON.parse(jsonData)
            } else {
              setError('Por favor selecciona un archivo JSON o pega el contenido')
              setLoading(false)
              return
            }

            if (
              parsed.version &&
              Array.isArray(parsed.accounts) &&
              !parsed.encoded
            ) {
              setError(
                'Este es un archivo de backup completo. Por favor, usa la opción "Importar Backup Completo" desde la pantalla de inicio (onboarding) o desde Configuración > Seguridad > Backup e Importación.'
              )
              setLoading(false)
              return
            }

            if (looksLikePolkadotJsJson(parsed)) {
              setError(
                'Los backups de Polkadot.js no están soportados. Usa un JSON con "mnemonic" o "privateKey"/"seed", o importa con frase de recuperación / clave privada Ethereum.'
              )
              setLoading(false)
              return
            }

            if (typeof parsed.mnemonic === 'string') {
              if (!validateMnemonic(parsed.mnemonic)) {
                setError('El mnemonic en el JSON debe tener 12 o 24 palabras')
                setLoading(false)
                return
              }
              account = await addFromMnemonic(
                parsed.mnemonic,
                (typeof parsed.name === 'string' ? parsed.name : name.trim()) || undefined,
                password || undefined
              )
            } else if (
              typeof parsed.privateKey === 'string' ||
              typeof parsed.seed === 'string'
            ) {
              const pk =
                (typeof parsed.privateKey === 'string' && parsed.privateKey) ||
                (typeof parsed.seed === 'string' && parsed.seed) ||
                ''
              account = await addFromPrivateKey(
                pk,
                (typeof parsed.name === 'string' ? parsed.name : name.trim()) || undefined,
                password || undefined
              )
            } else if (parsed.version || Array.isArray(parsed.accounts)) {
              setError(
                'Este parece ser un archivo de backup completo de Ejército Reforestador. Por favor, usa la opción "Importar Backup Completo" desde la pantalla de inicio o desde Configuración > Seguridad > Backup e Importación.'
              )
              setLoading(false)
              return
            } else {
              setError(
                'El JSON debe contener "mnemonic" o "privateKey"/"seed". Los backups de Polkadot.js no están soportados.'
              )
              setLoading(false)
              return
            }
          } catch (err) {
            setError(
              err instanceof Error ? err.message : 'JSON inválido. Por favor verifica el formato.'
            )
            setLoading(false)
            return
          }
          break
        }
      }

      if (account) {
        setImportedAddress(account.address)
        setSuccess(true)

        setMnemonic('')
        setUri('')
        setJsonData('')
        setJsonFile(null)
        setName('')
        setPassword('')
        setConfirmPassword('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        setTimeout(() => {
          navigate('/accounts')
        }, 2000)
      } else {
        setError('Error al importar la cuenta. Por favor verifica los datos e intenta de nuevo.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar la cuenta')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAddress = async () => {
    if (importedAddress) {
      await navigator.clipboard.writeText(importedAddress)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recuperar Cuenta</h1>
        <p className="text-muted-foreground mt-2">
          Importa una cuenta Ethereum existente usando tu frase de recuperación, clave privada o
          archivo JSON
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Método de Importación</CardTitle>
          <CardDescription>Elige cómo deseas importar tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={method}
            onValueChange={(v) => setMethod(v as ImportMethod)}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mnemonic">
                <Key className="mr-2 h-4 w-4" />
                Frase de Recuperación
              </TabsTrigger>
              <TabsTrigger value="uri">
                <Key className="mr-2 h-4 w-4" />
                Clave privada
              </TabsTrigger>
              <TabsTrigger value="json">
                <FileText className="mr-2 h-4 w-4" />
                Archivo JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mnemonic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mnemonic">Frase de Recuperación (12 o 24 palabras)</Label>
                <div className="relative">
                  <Input
                    id="mnemonic"
                    type={showMnemonic ? 'text' : 'password'}
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    placeholder="palabra1 palabra2 palabra3 ..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowMnemonic(!showMnemonic)}
                  >
                    {showMnemonic ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ingresa las 12 o 24 palabras de tu frase de recuperación separadas por espacios
                </p>
              </div>
            </TabsContent>

            <TabsContent value="uri" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uri">Clave privada</Label>
                <Input
                  id="uri"
                  type="password"
                  value={uri}
                  onChange={(e) => setUri(e.target.value)}
                  placeholder="0x… o hex sin prefijo"
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa tu clave privada Ethereum en formato hexadecimal
                </p>
              </div>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jsonFile">Seleccionar Archivo JSON</Label>
                  <input
                    ref={fileInputRef}
                    id="jsonFile"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setJsonFile(file)
                        setJsonData('')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {jsonFile ? jsonFile.name : 'Seleccionar Archivo JSON'}
                  </Button>
                  {jsonFile && (
                    <p className="text-xs text-muted-foreground">
                      Archivo seleccionado: {jsonFile.name}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="json">Pegar Contenido JSON</Label>
                  <textarea
                    id="json"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    value={jsonData}
                    onChange={(e) => {
                      setJsonData(e.target.value)
                      setJsonFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    placeholder='{"mnemonic": "palabra1 palabra2 ..."} o {"privateKey": "0x..."}'
                  />
                  <p className="text-xs text-muted-foreground">
                    JSON simple con &quot;mnemonic&quot; o &quot;privateKey&quot;/&quot;seed&quot;. No se
                    admiten backups de Polkadot.js.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de la Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Cuenta (Opcional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi Cuenta Recuperada"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña para Proteger la Cuenta (Opcional)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            <p className="text-xs text-muted-foreground">
              Si proporcionas una contraseña, la cuenta se encriptará antes de guardarse
            </p>
          </div>

          {password && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && importedAddress && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Cuenta importada exitosamente</strong>
                <p className="text-sm mt-1">Dirección: {importedAddress}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyAddress}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate('/accounts')} className="flex-1">
          Cancelar
        </Button>
        <Button
          onClick={handleImport}
          disabled={
            loading ||
            (method === 'mnemonic' && !mnemonic.trim()) ||
            (method === 'uri' && !uri.trim()) ||
            (method === 'json' && !jsonFile && !jsonData.trim())
          }
          className="flex-1"
        >
          {loading ? 'Importando...' : 'Importar Cuenta'}
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Asegúrate de estar en un entorno seguro al ingresar tu
          frase de recuperación o clave privada. Nunca las compartas con nadie.
        </AlertDescription>
      </Alert>
    </div>
  )
}
