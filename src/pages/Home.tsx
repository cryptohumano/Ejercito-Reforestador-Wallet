import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Trees,
  Loader2,
  Leaf,
  Plus,
  Download,
  Sprout,
  MapPin,
  Shield,
  Target,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useActiveJornada, useJornadasList } from '@/hooks/useActiveJornada'
import { FAB } from '@/components/ui/fab'
import { useIsMobile } from '@/hooks/use-mobile'
import { downloadCsv } from '@/services/forestation/forestationService'
import { toast } from 'sonner'
import { useMemo } from 'react'

const baseUrl = import.meta.env.BASE_URL || '/'
const logoPath = `${baseUrl}logo-ui.png`

export default function Home() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { jornada, isLoading, refresh } = useActiveJornada()
  const { jornadas, isLoading: loadingList } = useJornadasList()

  const impact = useMemo(() => {
    const plants = jornadas.reduce((sum, j) => sum + (j.plants_counted || 0), 0)
    const registros = jornadas.reduce((sum, j) => sum + (j.siembras_counted || 0), 0)
    return {
      plants,
      registros,
      jornadas: jornadas.length,
    }
  }, [jornadas])

  return (
    <div className="relative space-y-5 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 pb-2 topo-bg min-h-[70vh]">
      {/* Marca / hero */}
      <section className="animate-sprout pt-1">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-full overflow-hidden mission-pulse bg-white dark:bg-[#081C15] ring-2 ring-primary/30">
            <img
              src={logoPath}
              alt="Ejército Reforestador"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-primary font-semibold">
              Misión de campo
            </p>
            <h1 className="font-brand text-2xl sm:text-3xl font-bold leading-tight brand-gradient-text uppercase">
              Ejército Reforestador
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              Cada siembra cuenta. Tu bitácora forestal, lista para el terreno.
            </p>
          </div>
        </div>
      </section>

      {/* Métricas de impacto — siempre visibles */}
      <section className="grid grid-cols-3 gap-2 animate-sprout animate-sprout-delay-1">
        <ImpactTile
          icon={Sprout}
          value={loadingList ? '—' : impact.plants}
          label="Plantas"
        />
        <ImpactTile
          icon={Trees}
          value={loadingList ? '—' : impact.jornadas}
          label="Jornadas"
        />
        <ImpactTile
          icon={Leaf}
          value={loadingList ? '—' : impact.registros}
          label="Registros"
        />
      </section>

      {isLoading ? (
        <Card>
          <CardContent className="py-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : jornada ? (
        <Card className="border-primary/30 shadow-sm animate-sprout animate-sprout-delay-2 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#52B788]" />
          <CardContent className="py-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge>activa</Badge>
                  <span className="text-xs text-muted-foreground">{jornada.scheduled_date}</span>
                </div>
                <h2 className="font-semibold truncate">{jornada.title}</h2>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {jornada.site_name}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-primary/10 py-2">
                <div className="text-xl font-bold text-primary">{jornada.plants_counted}</div>
                <div className="text-[10px] text-muted-foreground">Plantas hoy</div>
              </div>
              <div className="rounded-lg bg-primary/10 py-2">
                <div className="text-xl font-bold text-primary">{jornada.siembras_counted}</div>
                <div className="text-[10px] text-muted-foreground">Registros</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => navigate(`/jornadas/${jornada.jornada_id}/siembra`)}
              >
                <Leaf className="h-4 w-4 mr-2" />
                Registrar siembra
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  await downloadCsv(`ejercito-reforestador-${jornada.scheduled_date}.csv`, [
                    jornada.jornada_id,
                  ])
                  toast.success('CSV descargado')
                  refresh()
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="link" className="px-0 h-auto" asChild>
              <Link to={`/jornadas/${jornada.jornada_id}`}>Ver detalle de jornada</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <MissionBriefing />
      )}

      {/* Acciones de misión */}
      <section className="grid sm:grid-cols-2 gap-2 animate-sprout animate-sprout-delay-3">
        <Button
          variant="outline"
          className="justify-start h-auto py-3 px-4 gap-3"
          asChild
        >
          <Link to="/jornadas">
            <div className="h-9 w-9 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Abrir jornadas</div>
              <div className="text-xs text-muted-foreground">Planifica y cierra operaciones</div>
            </div>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="justify-start h-auto py-3 px-4 gap-3"
          asChild
        >
          <Link to="/accounts">
            <div className="h-9 w-9 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Identidad de campo</div>
              <div className="text-xs text-muted-foreground">Cuentas y firmas en tu dispositivo</div>
            </div>
          </Link>
        </Button>
      </section>

      {!isMobile && jornada && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => navigate(`/jornadas/${jornada.jornada_id}/siembra`)}
        >
          <Leaf className="mr-2 h-5 w-5" />
          Registrar siembra
        </Button>
      )}

      {isMobile && jornada && (
        <FAB
          icon={Leaf}
          label="Registrar siembra"
          onClick={() => navigate(`/jornadas/${jornada.jornada_id}/siembra`)}
          variant="default"
          position="left"
          bottomOffset={0}
          aria-label="Registrar siembra"
        />
      )}
    </div>
  )
}

function ImpactTile({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Sprout
  value: number | string
  label: string
}) {
  return (
    <div className="rounded-xl border border-primary/15 bg-card/80 backdrop-blur-sm px-2 py-3 text-center shadow-sm">
      <Icon className="h-4 w-4 mx-auto mb-1 text-primary" />
      <div className="font-brand text-2xl font-bold leading-none tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

function MissionBriefing() {
  const base = import.meta.env.BASE_URL || '/'
  return (
    <Card className="relative overflow-hidden border-primary/25 animate-sprout animate-sprout-delay-2">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 opacity-[0.12] dark:opacity-[0.18]"
        aria-hidden
      >
        <img src={`${base}logo-ui.png`} alt="" className="h-full w-full object-contain" />
      </div>
      <CardContent className="py-6 space-y-4 relative">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
            Briefing
          </Badge>
          <span className="text-xs text-muted-foreground">Unidad lista · sin jornada activa</span>
        </div>
        <div>
          <h2 className="font-brand text-xl font-bold uppercase tracking-wide">
            Tu misión empieza aquí
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-prose">
            No hay jornada en curso. Crea una operación de reforestación para registrar siembras,
            firmar en campo y construir el impacto de tu unidad.
          </p>
        </div>
        <ul className="space-y-2 text-sm">
          {[
            'Define sitio, fecha y objetivo de plantación',
            'Registra cada siembra con GPS y evidencia',
            'Exporta el CSV de campaña al cerrar',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="w-full sm:w-auto" size="lg">
          <Link to="/jornadas">
            <Plus className="h-4 w-4 mr-2" />
            Iniciar jornada
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
