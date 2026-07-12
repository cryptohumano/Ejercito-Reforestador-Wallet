import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Download, Loader2, Leaf, Lock } from 'lucide-react'
import type { Jornada, Siembra } from '@/types/forestation'
import { getJornada, getSiembrasByJornada } from '@/utils/forestationStorage'
import { closeJornada, downloadCsv } from '@/services/forestation/forestationService'
import { useKeyringContext } from '@/contexts/KeyringContext'
import { useActiveAccount } from '@/contexts/ActiveAccountContext'
import { toast } from 'sonner'
import { shortenAddress } from '@/utils/address'

export default function JornadaDetail() {
  const { jornadaId } = useParams<{ jornadaId: string }>()
  const navigate = useNavigate()
  const { getAccount, isUnlocked } = useKeyringContext()
  const { activeAccount } = useActiveAccount()
  const [jornada, setJornada] = useState<Jornada | null>(null)
  const [siembras, setSiembras] = useState<Siembra[]>([])
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)

  const refresh = useCallback(async () => {
    if (!jornadaId) return
    setLoading(true)
    try {
      const j = await getJornada(jornadaId)
      setJornada(j)
      setSiembras(j ? await getSiembrasByJornada(j.jornada_id) : [])
    } finally {
      setLoading(false)
    }
  }, [jornadaId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleClose = async () => {
    if (!jornada || !activeAccount) return
    const account = getAccount(activeAccount)
    if (!account?.account) {
      toast.error('Desbloquea la wallet para firmar el cierre')
      return
    }
    setClosing(true)
    try {
      const closed = await closeJornada(jornada.jornada_id, account.account)
      setJornada(closed)
      toast.success('Jornada cerrada y firmada')
      await downloadCsv(
        `mst-${closed.scheduled_date}-${closed.jornada_id.slice(0, 8)}.csv`,
        [closed.jornada_id]
      )
      toast.success('CSV descargado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cerrar')
    } finally {
      setClosing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!jornada) {
    return (
      <Alert>
        <AlertDescription>Jornada no encontrada</AlertDescription>
      </Alert>
    )
  }

  const active = jornada.status === 'in_progress'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/jornadas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold truncate">{jornada.title}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {jornada.site_name} · {jornada.scheduled_date}
          </p>
        </div>
        <Badge variant={active ? 'default' : 'secondary'}>
          {active ? 'activa' : jornada.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="py-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold">{jornada.plants_counted}</div>
            <div className="text-xs text-muted-foreground">Plantas</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{jornada.siembras_counted}</div>
            <div className="text-xs text-muted-foreground">Registros</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{jornada.target_plants ?? '—'}</div>
            <div className="text-xs text-muted-foreground">Meta</div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {active && (
          <Button className="flex-1" onClick={() => navigate(`/jornadas/${jornada.jornada_id}/siembra`)}>
            <Leaf className="h-4 w-4 mr-2" />
            Registrar siembra
          </Button>
        )}
        <Button
          variant="outline"
          onClick={async () => {
            await downloadCsv(`mst-${jornada.scheduled_date}-${jornada.jornada_id.slice(0, 8)}.csv`, [
              jornada.jornada_id,
            ])
            toast.success('CSV descargado')
            refresh()
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          CSV
        </Button>
        {active && (
          <Button variant="secondary" onClick={handleClose} disabled={closing || !isUnlocked}>
            {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
            Cerrar y firmar
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Siembras</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {siembras.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sin registros aún. Toca “Registrar siembra”.
            </p>
          ) : (
            siembras.map((s) => (
              <div
                key={s.siembra_id}
                className="flex items-start justify-between gap-2 border-b last:border-0 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    #{s.sequence_in_jornada} · {s.species_common_name} ×{s.quantity}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {s.lat.toFixed(5)}, {s.lon.toFixed(5)}
                    {s.accuracy_m != null ? ` · ±${Math.round(s.accuracy_m)}m` : ''}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.local_date} {s.local_time} · {shortenAddress(s.signer, 4)}
                  </div>
                </div>
                {s.photos?.[0]?.dataUrl && (
                  <img
                    src={s.photos[0].dataUrl}
                    alt=""
                    className="h-12 w-12 rounded object-cover shrink-0"
                  />
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
