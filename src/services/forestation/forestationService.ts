/**
 * Lógica de negocio MST: crear jornada/siembra, agregar, firmar, CSV
 */

import { v4 as uuidv4 } from 'uuid'
import type { LocalAccount } from 'viem'
import { keccak256, stringToHex } from 'viem'
import {
  FORESTATION_SCHEMA_VERSION,
  FORESTATION_SOURCE_APP,
  FORESTATION_TIMEZONE_DEFAULT,
  type CreateJornadaInput,
  type CreateSiembraInput,
  type Jornada,
  type Siembra,
} from '@/types/forestation'
import {
  getJornada,
  getSiembrasByJornada,
  getAllJornadas,
  saveJornada,
  saveSiembra,
} from '@/utils/forestationStorage'

function todayLocalDate(timeZone = FORESTATION_TIMEZONE_DEFAULT): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function localTimeParts(ts: number, timeZone = FORESTATION_TIMEZONE_DEFAULT) {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ts)
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(ts)
  return { local_date: date, local_time: time }
}

function devicePlatform(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return 'android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  return 'web'
}

function softDeviceId(): string {
  try {
    const key = 'mst-device-id'
    let id = localStorage.getItem(key)
    if (!id) {
      id = uuidv4()
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return uuidv4()
  }
}

function appVersion(): string {
  try {
    return (import.meta as any).env?.VITE_APP_VERSION || '0.1.0'
  } catch {
    return '0.1.0'
  }
}

/** Hash canónico estable para firma de siembra */
export function buildSiembraPayloadHash(input: {
  siembra_id: string
  jornada_id: string
  recorded_at: number
  species_common_name: string
  quantity: number
  lat: number
  lon: number
  related_account: string
  client_event_id: string
}): string {
  const canonical = JSON.stringify({
    v: FORESTATION_SCHEMA_VERSION,
    ...input,
    lat: Number(input.lat.toFixed(7)),
    lon: Number(input.lon.toFixed(7)),
  })
  return keccak256(stringToHex(canonical))
}

export async function signPayload(
  account: LocalAccount,
  payloadHash: `0x${string}`
): Promise<`0x${string}`> {
  return account.signMessage({ message: { raw: payloadHash } })
}

export function createJornadaDraft(input: CreateJornadaInput): Jornada {
  const now = Date.now()
  const tz = FORESTATION_TIMEZONE_DEFAULT
  return {
    jornada_id: uuidv4(),
    schema_version: FORESTATION_SCHEMA_VERSION,
    title: input.title.trim(),
    description: input.description?.trim(),
    status: 'in_progress',
    organization: 'Ejército Reforestador',
    organization_chapter: input.organization_chapter?.trim() || 'Tlaxcala',
    event_type: 'forestation',
    scheduled_date: input.scheduled_date || todayLocalDate(tz),
    timezone: tz,
    start_at: now,
    created_at: now,
    updated_at: now,
    country_code: 'MX',
    state: 'Tlaxcala',
    municipality: input.municipality?.trim(),
    locality: input.locality?.trim(),
    site_name: input.site_name.trim(),
    target_plants: input.target_plants,
    plants_counted: 0,
    siembras_counted: 0,
    coordinator_name: input.coordinator_name?.trim(),
    created_by_account: input.created_by_account,
    created_by_display_name: input.created_by_display_name,
    notes: input.notes?.trim(),
    source_app: FORESTATION_SOURCE_APP,
    source_app_version: appVersion(),
    device_platform: devicePlatform(),
    export_count: 0,
    synced: false,
  }
}

export function recomputeJornadaAggregates(
  jornada: Jornada,
  siembras: Siembra[]
): Jornada {
  const breakdown: Record<string, number> = {}
  let plants = 0
  let latSum = 0
  let lonSum = 0
  let n = 0
  let north = -90
  let south = 90
  let east = -180
  let west = 180
  let elevMin: number | undefined
  let elevMax: number | undefined

  for (const s of siembras) {
    plants += s.quantity
    const key = s.species_common_name || 'unknown'
    breakdown[key] = (breakdown[key] || 0) + s.quantity
    latSum += s.lat
    lonSum += s.lon
    n += 1
    north = Math.max(north, s.lat)
    south = Math.min(south, s.lat)
    east = Math.max(east, s.lon)
    west = Math.min(west, s.lon)
    if (typeof s.altitude_m === 'number') {
      elevMin = elevMin === undefined ? s.altitude_m : Math.min(elevMin, s.altitude_m)
      elevMax = elevMax === undefined ? s.altitude_m : Math.max(elevMax, s.altitude_m)
    }
  }

  return {
    ...jornada,
    plants_counted: plants,
    siembras_counted: siembras.length,
    species_breakdown_json: JSON.stringify(breakdown),
    centroid_lat: n ? latSum / n : jornada.centroid_lat,
    centroid_lon: n ? lonSum / n : jornada.centroid_lon,
    bbox_north: n ? north : jornada.bbox_north,
    bbox_south: n ? south : jornada.bbox_south,
    bbox_east: n ? east : jornada.bbox_east,
    bbox_west: n ? west : jornada.bbox_west,
    elevation_m_min: elevMin,
    elevation_m_max: elevMax,
    updated_at: Date.now(),
  }
}

export async function createAndSaveJornada(input: CreateJornadaInput): Promise<Jornada> {
  // Solo una jornada activa a la vez: completar otras in_progress
  const all = await getAllJornadas()
  for (const j of all) {
    if (j.status === 'in_progress') {
      await saveJornada({
        ...j,
        status: 'completed',
        end_at: j.end_at || Date.now(),
        updated_at: Date.now(),
      })
    }
  }

  const jornada = createJornadaDraft(input)
  await saveJornada(jornada)
  return jornada
}

export async function createAndSaveSiembra(
  input: CreateSiembraInput,
  account: LocalAccount
): Promise<Siembra> {
  const jornada = await getJornada(input.jornada_id)
  if (!jornada) throw new Error('Jornada no encontrada')
  if (jornada.status === 'completed' || jornada.status === 'cancelled') {
    throw new Error('La jornada está cerrada')
  }

  const existing = await getSiembrasByJornada(input.jornada_id)
  const now = Date.now()
  const { local_date, local_time } = localTimeParts(now, jornada.timezone)
  const siembra_id = uuidv4()
  const client_event_id = uuidv4()
  const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1
  const photos = input.photos || []

  const payload_hash = buildSiembraPayloadHash({
    siembra_id,
    jornada_id: input.jornada_id,
    recorded_at: now,
    species_common_name: input.species_common_name,
    quantity,
    lat: input.lat,
    lon: input.lon,
    related_account: input.related_account,
    client_event_id,
  })

  const signature = await signPayload(account, payload_hash as `0x${string}`)

  const siembra: Siembra = {
    siembra_id,
    jornada_id: input.jornada_id,
    schema_version: FORESTATION_SCHEMA_VERSION,
    sequence_in_jornada: existing.length + 1,
    recorded_at: now,
    recorded_at_iso: new Date(now).toISOString(),
    local_date,
    local_time,
    species_id: input.species_id,
    species_common_name: input.species_common_name,
    species_scientific_name: input.species_scientific_name,
    species_other: input.species_other,
    quantity,
    lat: input.lat,
    lon: input.lon,
    accuracy_m: input.accuracy_m,
    altitude_m: input.altitude_m,
    gps_manual: false,
    photo_count: photos.length,
    photo_ids_json: JSON.stringify(photos.map((p) => p.id)),
    photos,
    notes: input.notes?.trim(),
    related_account: input.related_account,
    recorder_display_name: input.recorder_display_name,
    device_id: softDeviceId(),
    client_event_id,
    payload_hash,
    signature,
    signer: account.address,
    signed_at: now,
    signature_scheme: 'eip191',
    follow_up_status: 'none',
    created_at: now,
    updated_at: now,
    synced: false,
  }

  await saveSiembra(siembra)

  const updated = recomputeJornadaAggregates(jornada, [...existing, siembra])
  if (updated.status === 'draft') updated.status = 'in_progress'
  await saveJornada(updated)

  return siembra
}

export async function closeJornada(
  jornadaId: string,
  account: LocalAccount
): Promise<Jornada> {
  const jornada = await getJornada(jornadaId)
  if (!jornada) throw new Error('Jornada no encontrada')
  const siembras = await getSiembrasByJornada(jornadaId)
  const aggregated = recomputeJornadaAggregates(jornada, siembras)
  const now = Date.now()
  const closePayload = keccak256(
    stringToHex(
      JSON.stringify({
        v: FORESTATION_SCHEMA_VERSION,
        jornada_id: jornadaId,
        plants_counted: aggregated.plants_counted,
        siembras_counted: aggregated.siembras_counted,
        end_at: now,
      })
    )
  )
  const signature = await signPayload(account, closePayload)

  const closed: Jornada = {
    ...aggregated,
    status: 'completed',
    end_at: now,
    updated_at: now,
    jornada_hash: closePayload,
    jornada_signature: signature,
    jornada_signer: account.address,
    signed_at: now,
  }
  await saveJornada(closed)
  return closed
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** Columnas fijas CSV (siembra + jornada denormalizada) */
export const CSV_HEADERS = [
  'siembra_id',
  'jornada_id',
  'schema_version',
  'sequence_in_jornada',
  'recorded_at',
  'recorded_at_iso',
  'local_date',
  'local_time',
  'species_id',
  'species_common_name',
  'species_scientific_name',
  'species_other',
  'plant_stage',
  'quantity',
  'lat',
  'lon',
  'accuracy_m',
  'altitude_m',
  'gps_manual',
  'photo_count',
  'photo_ids_json',
  'notes',
  'related_account',
  'recorder_display_name',
  'client_event_id',
  'payload_hash',
  'signature',
  'signer',
  'signed_at',
  'signature_scheme',
  'follow_up_status',
  'jornada_title',
  'jornada_status',
  'jornada_organization',
  'jornada_organization_chapter',
  'jornada_event_type',
  'jornada_scheduled_date',
  'jornada_timezone',
  'jornada_site_name',
  'jornada_municipality',
  'jornada_locality',
  'jornada_state',
  'jornada_country_code',
  'jornada_plants_counted',
  'jornada_siembras_counted',
  'jornada_target_plants',
  'jornada_created_by_account',
  'jornada_coordinator_name',
  'jornada_hash',
  'jornada_signature',
  'jornada_signer',
] as const

export async function buildCsvForJornadas(jornadaIds?: string[]): Promise<string> {
  const jornadas = await getAllJornadas()
  const filtered = jornadaIds?.length
    ? jornadas.filter((j) => jornadaIds.includes(j.jornada_id))
    : jornadas
  const byId = new Map(filtered.map((j) => [j.jornada_id, j]))

  const rows: string[] = [CSV_HEADERS.join(',')]
  for (const j of filtered) {
    const siembras = await getSiembrasByJornada(j.jornada_id)
    for (const s of siembras) {
      const jornada = byId.get(s.jornada_id)!
      const values = [
        s.siembra_id,
        s.jornada_id,
        s.schema_version,
        s.sequence_in_jornada,
        s.recorded_at,
        s.recorded_at_iso,
        s.local_date,
        s.local_time,
        s.species_id,
        s.species_common_name,
        s.species_scientific_name,
        s.species_other,
        s.plant_stage,
        s.quantity,
        s.lat,
        s.lon,
        s.accuracy_m,
        s.altitude_m,
        s.gps_manual,
        s.photo_count,
        s.photo_ids_json,
        s.notes,
        s.related_account,
        s.recorder_display_name,
        s.client_event_id,
        s.payload_hash,
        s.signature,
        s.signer,
        s.signed_at,
        s.signature_scheme,
        s.follow_up_status,
        jornada.title,
        jornada.status,
        jornada.organization,
        jornada.organization_chapter,
        jornada.event_type,
        jornada.scheduled_date,
        jornada.timezone,
        jornada.site_name,
        jornada.municipality,
        jornada.locality,
        jornada.state,
        jornada.country_code,
        jornada.plants_counted,
        jornada.siembras_counted,
        jornada.target_plants,
        jornada.created_by_account,
        jornada.coordinator_name,
        jornada.jornada_hash,
        jornada.jornada_signature,
        jornada.jornada_signer,
      ]
      rows.push(values.map(csvEscape).join(','))
    }
  }
  return rows.join('\n')
}

export async function downloadCsv(filename: string, jornadaIds?: string[]): Promise<void> {
  const csv = await buildCsvForJornadas(jornadaIds)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)

  // Marcar export en jornadas
  const ids = jornadaIds?.length
    ? jornadaIds
    : (await getAllJornadas()).map((j) => j.jornada_id)
  const now = Date.now()
  for (const id of ids) {
    const j = await getJornada(id)
    if (!j) continue
    await saveJornada({
      ...j,
      export_count: (j.export_count || 0) + 1,
      last_exported_at: now,
      updated_at: now,
    })
  }
}

export async function downloadAllCsv(): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 10)
  await downloadCsv(`mst-siembras-${stamp}.csv`)
}
