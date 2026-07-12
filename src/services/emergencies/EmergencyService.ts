/**
 * Servicio para manejar emergencias
 * Envía emergencias a blockchain usando system.remarkWithEvent
 * (emite evento System.Remarked para facilitar la escucha)
 */

import type { PublicClient } from 'viem'
import type { LocalAccount } from 'viem'
import type { 
  Emergency, 
  CreateEmergencyData, 
  EmergencySubmissionResult,
  EmergencyRemarkData
} from '@/types/emergencies'
import { serializeEmergencyToRemark } from '@/types/emergencies'
import { v4 as uuidv4 } from 'uuid'
import { saveTransaction, type StoredTransaction } from '@/utils/transactionStorage'
import { saveEmergency } from '@/utils/emergencyStorage'

/**
 * Crea una emergencia localmente
 */
export function createEmergencyLocal(
  data: CreateEmergencyData,
  reporterAccount: string
): Emergency {
  const now = Date.now()
  
  const emergency: Emergency = {
    emergencyId: uuidv4(),
    type: data.type,
    description: data.description,
    severity: data.severity,
    location: data.location,
    relatedLogId: data.relatedLogId,
    relatedMilestoneId: data.relatedMilestoneId,
    reporterAccount,
    emergencyContacts: data.emergencyContacts,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    notes: data.notes,
    metadata: data.metadata,
    synced: false,
  }
  
  return emergency
}

/**
 * Prepara los datos para el remark
 * Incluye datos de posición, bitácora, trail y aviso de salida (lo que quepa en 32KB)
 */
export function prepareEmergencyRemarkData(
  emergency: Emergency,
  logData?: {
    title?: string
    mountainName?: string
    location?: string
    startDate?: number
    avisoSalida?: {
      guia?: {
        nombres?: string
        apellidos?: string
      }
      actividad?: {
        lugarDestino?: string
        numeroParticipantes?: number
        fechaSalida?: number
        tipoActividad?: string
      }
    }
    routes?: Array<{
      name?: string
      distance?: number
    }>
    milestones?: Array<{
      id: string
      title?: string
      type?: string
      metadata?: {
        elevation?: number
      }
    }>
  }
): EmergencyRemarkData {
  // Construir metadata con datos de la bitácora
  const metadata: EmergencyRemarkData['metadata'] = {
    ...emergency.metadata,
  }

  // Agregar datos de la bitácora
  if (logData) {
    if (logData.title) metadata.logTitle = logData.title
    if (logData.mountainName) metadata.mountainName = logData.mountainName
    if (logData.location) metadata.logLocation = logData.location
    if (logData.startDate) metadata.logStartDate = logData.startDate

    // Agregar datos del aviso de salida (resumidos)
    if (logData.avisoSalida) {
      metadata.avisoSalida = {}
      if (logData.avisoSalida.guia?.nombres) {
        metadata.avisoSalida.guiaNombre = logData.avisoSalida.guia.nombres
        if (logData.avisoSalida.guia.apellidos) {
          metadata.avisoSalida.guiaNombre += ` ${logData.avisoSalida.guia.apellidos}`
        }
      }
      if (logData.avisoSalida.actividad?.lugarDestino) {
        metadata.avisoSalida.lugarDestino = logData.avisoSalida.actividad.lugarDestino
      }
      if (logData.avisoSalida.actividad?.numeroParticipantes) {
        metadata.avisoSalida.numeroParticipantes = logData.avisoSalida.actividad.numeroParticipantes
      }
      if (logData.avisoSalida.actividad?.fechaSalida) {
        metadata.avisoSalida.fechaSalida = logData.avisoSalida.actividad.fechaSalida
      }
      if (logData.avisoSalida.actividad?.tipoActividad) {
        metadata.avisoSalida.tipoActividad = logData.avisoSalida.actividad.tipoActividad
      }
    }

    // Agregar datos del trail/ruta (primera ruta si existe)
    if (logData.routes && logData.routes.length > 0) {
      const firstRoute = logData.routes[0]
      metadata.trail = {}
      if (firstRoute.name) metadata.trail.name = firstRoute.name
      if (firstRoute.distance) metadata.trail.distance = firstRoute.distance
    }

    // Agregar datos del milestone actual si existe
    if (emergency.relatedMilestoneId && logData.milestones) {
      const milestone = logData.milestones.find(m => m.id === emergency.relatedMilestoneId)
      if (milestone) {
        metadata.milestone = {}
        if (milestone.title) metadata.milestone.title = milestone.title
        if (milestone.type) metadata.milestone.type = milestone.type
        if (milestone.metadata?.elevation) metadata.milestone.elevation = milestone.metadata.elevation
      }
    }
  }

  const remarkData: EmergencyRemarkData = {
    emergencyId: emergency.emergencyId,
    version: '1.0',
    type: emergency.type,
    severity: emergency.severity,
    description: emergency.description,
    location: {
      latitude: emergency.location.latitude,
      longitude: emergency.location.longitude,
      altitude: emergency.location.altitude,
      accuracy: emergency.location.accuracy,
      timestamp: emergency.location.timestamp,
    },
    relatedLogId: emergency.relatedLogId,
    relatedMilestoneId: emergency.relatedMilestoneId,
    reporterAccount: emergency.reporterAccount,
    createdAt: emergency.createdAt,
    reportedAt: Date.now(),
    metadata,
  }
  
  return remarkData
}

/**
 * Envío on-chain de emergencias.
 * Pendiente de cliente EVM (viem); hoy solo deja la emergencia en local.
 */
export async function submitEmergencyToBlockchain(
  _client: PublicClient | null,
  _account: LocalAccount,
  emergency: Emergency,
  _logData?: Parameters<typeof prepareEmergencyRemarkData>[1]
): Promise<EmergencySubmissionResult> {
  console.warn('[EmergencyService] Envío on-chain diferido (migración Ethereum/viem)', {
    emergencyId: emergency.emergencyId,
  })
  return {
    success: false,
    error:
      'Envío on-chain de emergencias pendiente: wallet Ethereum (viem). La emergencia quedó guardada en local.',
  }
}

/**
 * Actualiza una emergencia con los resultados de la blockchain
 */
export function updateEmergencyWithBlockchainResult(
  emergency: Emergency,
  result: EmergencySubmissionResult
): Emergency {
  return {
    ...emergency,
    status: result.success ? 'submitted' : 'pending',
    blockchainTxHash: result.txHash,
    blockchainBlockNumber: result.blockNumber,
    blockchainExtrinsicIndex: result.extrinsicIndex,
    submittedAt: result.success ? Date.now() : emergency.submittedAt,
    updatedAt: Date.now(),
    syncError: result.error,
  }
}
