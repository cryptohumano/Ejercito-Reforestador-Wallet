import { useCallback, useEffect, useState } from 'react'
import type { Jornada } from '@/types/forestation'
import { getActiveJornada, getAllJornadas } from '@/utils/forestationStorage'

export function useActiveJornada() {
  const [jornada, setJornada] = useState<Jornada | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const active = await getActiveJornada()
      setJornada(active)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar jornada')
      setJornada(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { jornada, isLoading, error, refresh }
}

export function useJornadasList() {
  const [jornadas, setJornadas] = useState<Jornada[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setJornadas(await getAllJornadas())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { jornadas, isLoading, refresh }
}
