import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trees, Plus, Download, Loader2 } from 'lucide-react'
import { useJornadasList } from '@/hooks/useActiveJornada'
import { useActiveAccount } from '@/contexts/ActiveAccountContext'
import { useKeyringContext } from '@/contexts/KeyringContext'
import { createAndSaveJornada, downloadAllCsv, downloadCsv } from '@/services/forestation/forestationService'
import { toast } from 'sonner'

export default function Jornadas() {
  const navigate = useNavigate()
  const { jornadas, isLoading, refresh } = useJornadasList()
  const { activeAccount, activeAccountData } = useActiveAccount()
  const { isUnlocked } = useKeyringContext()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [siteName, setSiteName] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!activeAccount) {
      toast.error('Selecciona una cuenta activa')
      return
    }
    if (!title.trim() || !siteName.trim()) {
      toast.error('Título y sitio son requeridos')
      return
    }
    setSaving(true)
    try {
      const jornada = await createAndSaveJornada({
        title,
        site_name: siteName,
        municipality: municipality || undefined,
        created_by_account: activeAccount,
        created_by_display_name: activeAccountData?.meta?.name,
        organization_chapter: 'Tlaxcala',
      })
      toast.success('Jornada iniciada')
      setShowForm(false)
      setTitle('')
      setSiteName('')
      await refresh()
      navigate(`/jornadas/${jornada.jornada_id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear jornada')
    } finally {
      setSaving(false)
    }
  }

  const handleExportAll = async () => {
    try {
      await downloadAllCsv()
      toast.success('CSV descargado')
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al exportar')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trees className="h-6 w-6 text-primary" />
            Jornadas
          </h1>
          <p className="text-sm text-muted-foreground">
            Ejército Reforestador — registro de siembras
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)} disabled={!isUnlocked}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva
          </Button>
        </div>
      </div>

      {!isUnlocked && (
        <Alert>
          <AlertDescription>Desbloquea la wallet para crear jornadas y firmar siembras.</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva jornada</CardTitle>
            <CardDescription>Solo pedimos lo esencial; el resto se completa solo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Jornada Cerro X" />
            </div>
            <div className="space-y-1">
              <Label>Sitio / predio</Label>
              <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Nombre del lugar" />
            </div>
            <div className="space-y-1">
              <Label>Municipio (opcional)</Label>
              <Input value={municipality} onChange={(e) => setMunicipality(e.target.value)} placeholder="Tlaxcala" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Iniciar jornada'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : jornadas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Aún no hay jornadas. Crea la primera para empezar a registrar siembras.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {jornadas.map((j) => (
            <Card key={j.jornada_id} className="hover:border-primary/40 transition-colors">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-2">
                  <Link to={`/jornadas/${j.jornada_id}`} className="min-w-0 flex-1">
                    <div className="font-medium truncate">{j.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {j.site_name}
                      {j.municipality ? ` · ${j.municipality}` : ''} · {j.scheduled_date}
                    </div>
                    <div className="text-xs mt-1">
                      {j.plants_counted} plantas · {j.siembras_counted} registros
                    </div>
                  </Link>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={j.status === 'in_progress' ? 'default' : 'secondary'}>
                      {j.status === 'in_progress' ? 'activa' : j.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await downloadCsv(`mst-${j.scheduled_date}-${j.jornada_id.slice(0, 8)}.csv`, [
                          j.jornada_id,
                        ])
                        toast.success('CSV de jornada descargado')
                        refresh()
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
