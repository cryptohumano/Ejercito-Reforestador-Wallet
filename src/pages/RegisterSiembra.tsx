import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Camera, Loader2, MapPin, RefreshCw } from 'lucide-react'
import { MST_SPECIES_CATALOG, type SiembraPhoto } from '@/types/forestation'
import { useAutoGPS } from '@/hooks/useAutoGPS'
import { useActiveAccount } from '@/contexts/ActiveAccountContext'
import { useKeyringContext } from '@/contexts/KeyringContext'
import { createAndSaveSiembra } from '@/services/forestation/forestationService'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

export default function RegisterSiembra() {
  const { jornadaId } = useParams<{ jornadaId: string }>()
  const navigate = useNavigate()
  const { fix, error: gpsError, isLocating, ready, refresh } = useAutoGPS(true)
  const { activeAccount, activeAccountData } = useActiveAccount()
  const { getAccount, isUnlocked } = useKeyringContext()
  const fileRef = useRef<HTMLInputElement>(null)

  const [speciesId, setSpeciesId] = useState('oyamel')
  const [speciesOther, setSpeciesOther] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<SiembraPhoto[]>([])
  const [saving, setSaving] = useState(false)

  const selectedSpecies = MST_SPECIES_CATALOG.find((s) => s.id === speciesId)

  const onPickPhoto = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const photo: SiembraPhoto = {
      id: uuidv4(),
      dataUrl,
      mimeType: file.type || 'image/jpeg',
      capturedAt: Date.now(),
      lat: fix?.lat,
      lon: fix?.lon,
    }
    setPhotos((prev) => [...prev, photo].slice(0, 3))
  }

  const handleSave = async () => {
    if (!jornadaId) return
    if (!isUnlocked || !activeAccount) {
      toast.error('Desbloquea la wallet')
      return
    }
    if (!fix) {
      toast.error('Espera el GPS o activa la ubicación')
      return
    }
    if (photos.length === 0) {
      toast.error('Agrega al menos una foto')
      return
    }

    const common =
      speciesId === 'other'
        ? speciesOther.trim() || 'Otro'
        : selectedSpecies?.common || 'Desconocida'

    if (speciesId === 'other' && !speciesOther.trim()) {
      toast.error('Indica el nombre de la especie')
      return
    }

    const account = getAccount(activeAccount)
    if (!account?.account) {
      toast.error('Cuenta no disponible')
      return
    }

    setSaving(true)
    try {
      await createAndSaveSiembra(
        {
          jornada_id: jornadaId,
          species_id: speciesId === 'other' ? undefined : speciesId,
          species_common_name: common,
          species_scientific_name: selectedSpecies?.scientific,
          species_other: speciesId === 'other' ? speciesOther.trim() : undefined,
          quantity: Math.max(1, parseInt(quantity, 10) || 1),
          notes: notes.trim() || undefined,
          photos,
          lat: fix.lat,
          lon: fix.lon,
          accuracy_m: fix.accuracy_m,
          altitude_m: fix.altitude_m,
          related_account: activeAccount,
          recorder_display_name: activeAccountData?.meta?.name,
        },
        account.account
      )
      toast.success('Siembra firmada y guardada')
      navigate(`/jornadas/${jornadaId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/jornadas/${jornadaId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Registrar siembra</h1>
          <p className="text-xs text-muted-foreground">GPS y firma automáticos</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            {isLocating && !fix ? (
              <span className="text-sm text-muted-foreground">Obteniendo GPS…</span>
            ) : fix ? (
              <div className="text-sm min-w-0">
                <Badge variant={ready ? 'default' : 'secondary'} className="mb-1">
                  GPS {ready ? 'OK' : 'débil'}
                  {fix.accuracy_m != null ? ` · ±${Math.round(fix.accuracy_m)} m` : ''}
                </Badge>
                <div className="font-mono text-xs text-muted-foreground truncate">
                  {fix.lat.toFixed(6)}, {fix.lon.toFixed(6)}
                </div>
              </div>
            ) : (
              <span className="text-sm text-destructive">Sin GPS</span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} title="Reintentar GPS">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {gpsError && (
        <Alert variant="destructive">
          <AlertDescription>{gpsError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Datos de la planta</CardTitle>
          <CardDescription>Lo único que debes capturar tú</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Especie</Label>
            <Select value={speciesId} onValueChange={setSpeciesId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MST_SPECIES_CATALOG.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.common}
                    {s.scientific ? ` (${s.scientific})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {speciesId === 'other' && (
            <div className="space-y-1">
              <Label>Nombre de la especie</Label>
              <Input value={speciesOther} onChange={(e) => setSpeciesOther(e.target.value)} />
            </div>
          )}

          <div className="space-y-1">
            <Label>Cantidad</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Foto</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onPickPhoto(f)
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              Tomar / elegir foto
            </Button>
            {photos.length > 0 && (
              <div className="flex gap-2 mt-2">
                {photos.map((p) => (
                  <img
                    key={p.id}
                    src={p.dataUrl}
                    alt=""
                    className="h-16 w-16 rounded object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSave}
            disabled={saving || !fix || !isUnlocked}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Guardar y firmar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
