/**
 * Schema analítico MST — Jornada + Siembra (opción A)
 * @see plan flujo_mst_forestación
 */

export const FORESTATION_SCHEMA_VERSION = '1.0.0'
export const FORESTATION_SOURCE_APP = 'mst-wallet'
export const FORESTATION_TIMEZONE_DEFAULT = 'America/Mexico_City'

export type JornadaStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled'
export type EventType = 'forestation' | 'reforestation' | 'maintenance' | 'other'
export type PropertyType = 'public' | 'ejido' | 'private' | 'school' | 'other'
export type PlantStage = 'seedling' | 'sapling' | 'seed' | 'other'
export type PlantMethod = 'pit' | 'direct_seed' | 'transplant' | 'other'
export type PlantHealth = 'good' | 'fair' | 'poor'
export type FollowUpStatus = 'none' | 'scheduled' | 'visited' | 'dead' | 'alive'

export interface SiembraPhoto {
  id: string
  dataUrl: string
  mimeType: string
  capturedAt: number
  lat?: number
  lon?: number
}

export interface Jornada {
  jornada_id: string
  schema_version: string
  title: string
  slug?: string
  description?: string
  status: JornadaStatus
  organization: string
  organization_chapter?: string
  campaign_id?: string
  campaign_name?: string
  event_type: EventType
  scheduled_date: string // YYYY-MM-DD
  timezone: string
  start_at: number
  end_at?: number
  created_at: number
  updated_at: number
  country_code: string
  state: string
  municipality?: string
  locality?: string
  site_name: string
  site_code?: string
  property_type?: PropertyType
  landowner_or_steward?: string
  centroid_lat?: number
  centroid_lon?: number
  bbox_north?: number
  bbox_south?: number
  bbox_east?: number
  bbox_west?: number
  elevation_m_min?: number
  elevation_m_max?: number
  weather_summary?: string
  temp_c_min?: number
  temp_c_max?: number
  precipitation_mm?: number
  soil_type?: string
  habitat_type?: string
  target_plants?: number
  target_species?: string[]
  plants_counted: number
  siembras_counted: number
  species_breakdown_json?: string
  volunteers_count?: number
  coordinator_name?: string
  coordinator_account?: string
  created_by_account: string
  created_by_display_name?: string
  notes?: string
  tags?: string[]
  source_app: string
  source_app_version: string
  device_platform?: string
  export_count: number
  last_exported_at?: number
  synced: boolean
  server_id?: string
  jornada_hash?: string
  jornada_signature?: string
  jornada_signer?: string
  signed_at?: number
}

export interface Siembra {
  siembra_id: string
  jornada_id: string
  schema_version: string
  sequence_in_jornada: number
  recorded_at: number
  recorded_at_iso: string
  local_date: string
  local_time: string
  species_id?: string
  species_common_name: string
  species_scientific_name?: string
  species_other?: string
  plant_stage?: PlantStage
  quantity: number
  container_type?: string
  spacing_m?: number
  method?: PlantMethod
  lat: number
  lon: number
  accuracy_m?: number
  altitude_m?: number
  heading_deg?: number
  gps_manual: boolean
  photo_count: number
  photo_ids_json?: string
  photos?: SiembraPhoto[] // local only; not in CSV body
  notes?: string
  health_at_plant?: PlantHealth
  related_account: string
  recorder_display_name?: string
  device_id?: string
  client_event_id: string
  payload_hash: string
  signature: string
  signer: string
  signed_at: number
  signature_scheme: string
  follow_up_status?: FollowUpStatus
  follow_up_at?: number
  follow_up_notes?: string
  created_at: number
  updated_at: number
  synced: boolean
  server_id?: string
}

export interface CreateJornadaInput {
  title: string
  site_name: string
  scheduled_date?: string
  description?: string
  municipality?: string
  locality?: string
  organization_chapter?: string
  target_plants?: number
  coordinator_name?: string
  notes?: string
  created_by_account: string
  created_by_display_name?: string
}

export interface CreateSiembraInput {
  jornada_id: string
  species_id?: string
  species_common_name: string
  species_scientific_name?: string
  species_other?: string
  quantity?: number
  notes?: string
  photos?: SiembraPhoto[]
  lat: number
  lon: number
  accuracy_m?: number
  altitude_m?: number
  related_account: string
  recorder_display_name?: string
}

/** Catálogo inicial de especies (Tlaxcala / centro de MX) */
export const MST_SPECIES_CATALOG: Array<{
  id: string
  common: string
  scientific?: string
}> = [
  { id: 'oyamel', common: 'Oyamel', scientific: 'Abies religiosa' },
  { id: 'pino-montezumae', common: 'Pino Montezuma', scientific: 'Pinus montezumae' },
  { id: 'pino-ayacahuite', common: 'Pino ayacahuite', scientific: 'Pinus ayacahuite' },
  { id: 'encino', common: 'Encino', scientific: 'Quercus sp.' },
  { id: 'ocote', common: 'Ocote', scientific: 'Pinus teocote' },
  { id: 'cedro', common: 'Cedro', scientific: 'Cedrela odorata' },
  { id: 'ahuehuete', common: 'Ahuehuete', scientific: 'Taxodium mucronatum' },
  { id: 'capulin', common: 'Capulín', scientific: 'Prunus serotina' },
  { id: 'tejocote', common: 'Tejocote', scientific: 'Crataegus mexicana' },
  { id: 'other', common: 'Otro' },
]
