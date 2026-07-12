/**
 * GPS automático para registro de siembra (un punto, alta precisión)
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface AutoGPSFix {
  lat: number
  lon: number
  accuracy_m?: number
  altitude_m?: number
  heading_deg?: number
  timestamp: number
}

export function useAutoGPS(enabled = true) {
  const [fix, setFix] = useState<AutoGPSFix | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const watchId = useRef<number | null>(null)

  const clearWatch = useCallback(() => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Este dispositivo no soporta GPS')
      setHasPermission(false)
      return
    }

    setIsLocating(true)
    setError(null)
    clearWatch()

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setHasPermission(true)
        setIsLocating(false)
        setFix({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
          altitude_m: pos.coords.altitude ?? undefined,
          heading_deg: pos.coords.heading ?? undefined,
          timestamp: pos.timestamp || Date.now(),
        })
        setError(null)
      },
      (err) => {
        setIsLocating(false)
        setHasPermission(err.code !== err.PERMISSION_DENIED ? true : false)
        if (err.code === err.PERMISSION_DENIED) {
          setError('Activa el permiso de ubicación para registrar siembras')
        } else if (err.code === err.TIMEOUT) {
          setError('GPS tardó demasiado. Reintentando…')
        } else {
          setError('No se pudo obtener GPS. Sal a cielo abierto e intenta de nuevo')
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5_000,
        timeout: 20_000,
      }
    )
  }, [clearWatch])

  useEffect(() => {
    if (enabled) start()
    return () => clearWatch()
  }, [enabled, start, clearWatch])

  return {
    fix,
    error,
    hasPermission,
    isLocating,
    refresh: start,
    ready: !!fix && (fix.accuracy_m === undefined || fix.accuracy_m! < 100),
  }
}
