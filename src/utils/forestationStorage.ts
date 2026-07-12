/**
 * IndexedDB dedicado al dominio MST forestación
 */

import type { Jornada, Siembra } from '@/types/forestation'

const DB_NAME = 'mst-forestation'
const DB_VERSION = 1
const JORNADAS = 'jornadas'
const SIEMBRAS = 'siembras'

let dbInstance: IDBDatabase | null = null
let openPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)
  if (openPromise) return openPromise

  openPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => {
      openPromise = null
      reject(req.error || new Error('No se pudo abrir mst-forestation'))
    }
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(JORNADAS)) {
        const js = db.createObjectStore(JORNADAS, { keyPath: 'jornada_id' })
        js.createIndex('byStatus', 'status', { unique: false })
        js.createIndex('byAccount', 'created_by_account', { unique: false })
        js.createIndex('byScheduledDate', 'scheduled_date', { unique: false })
      }
      if (!db.objectStoreNames.contains(SIEMBRAS)) {
        const ss = db.createObjectStore(SIEMBRAS, { keyPath: 'siembra_id' })
        ss.createIndex('byJornada', 'jornada_id', { unique: false })
        ss.createIndex('byAccount', 'related_account', { unique: false })
        ss.createIndex('byRecordedAt', 'recorded_at', { unique: false })
      }
    }
    req.onsuccess = () => {
      dbInstance = req.result
      openPromise = null
      dbInstance.onversionchange = () => {
        dbInstance?.close()
        dbInstance = null
      }
      resolve(dbInstance)
    }
  })

  return openPromise
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error || new Error('Transacción abortada'))
  })
}

export async function saveJornada(jornada: Jornada): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(JORNADAS, 'readwrite')
  tx.objectStore(JORNADAS).put(jornada)
  await txDone(tx)
}

export async function getJornada(id: string): Promise<Jornada | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(JORNADAS, 'readonly').objectStore(JORNADAS).get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function getAllJornadas(): Promise<Jornada[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(JORNADAS, 'readonly').objectStore(JORNADAS).getAll()
    req.onsuccess = () => {
      const list = (req.result || []) as Jornada[]
      list.sort((a, b) => b.updated_at - a.updated_at)
      resolve(list)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getActiveJornada(): Promise<Jornada | null> {
  const all = await getAllJornadas()
  return all.find((j) => j.status === 'in_progress') || null
}

export async function deleteJornada(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction([JORNADAS, SIEMBRAS], 'readwrite')
  tx.objectStore(JORNADAS).delete(id)
  const idx = tx.objectStore(SIEMBRAS).index('byJornada')
  const req = idx.getAllKeys(id)
  await new Promise<void>((resolve, reject) => {
    req.onsuccess = () => {
      for (const key of req.result || []) {
        tx.objectStore(SIEMBRAS).delete(key)
      }
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
  await txDone(tx)
}

export async function saveSiembra(siembra: Siembra): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(SIEMBRAS, 'readwrite')
  tx.objectStore(SIEMBRAS).put(siembra)
  await txDone(tx)
}

export async function getSiembra(id: string): Promise<Siembra | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(SIEMBRAS, 'readonly').objectStore(SIEMBRAS).get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function getSiembrasByJornada(jornadaId: string): Promise<Siembra[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const idx = db.transaction(SIEMBRAS, 'readonly').objectStore(SIEMBRAS).index('byJornada')
    const req = idx.getAll(jornadaId)
    req.onsuccess = () => {
      const list = (req.result || []) as Siembra[]
      list.sort((a, b) => a.sequence_in_jornada - b.sequence_in_jornada)
      resolve(list)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getAllSiembras(): Promise<Siembra[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(SIEMBRAS, 'readonly').objectStore(SIEMBRAS).getAll()
    req.onsuccess = () => {
      const list = (req.result || []) as Siembra[]
      list.sort((a, b) => b.recorded_at - a.recorded_at)
      resolve(list)
    }
    req.onerror = () => reject(req.error)
  })
}
