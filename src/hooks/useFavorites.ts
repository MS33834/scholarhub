import { useCallback, useEffect, useMemo, useState } from 'react'
import { env } from '@/lib/env'
import { api } from '@/lib/api'
import { useFavorites as useLocalFavorites } from '@/store/favorites'
import { useAuth } from '@/store/authStore'

interface UseFavoritesReturn {
  ids: string[]
  loading: boolean
  error: string | null
  toggle: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  clear: () => Promise<void>
  has: (id: string) => boolean
}

/**
 * Unified favorites hook.
 *
 * - Local/demo mode: reads/writes localStorage via the legacy store.
 * - Remote mode: syncs with the FastAPI backend.
 */
export function useFavorites(): UseFavoritesReturn {
  const isRemote = env.apiMode === 'remote'
  const isAuthenticated = useAuth((s) => s.isAuthenticated)

  const local = useLocalFavorites()
  const [remoteIds, setRemoteIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load remote favorites on mount and when auth state changes.
  useEffect(() => {
    if (!isRemote || !isAuthenticated) {
      return () => {
        setRemoteIds([])
      }
    }

    let cancelled = false
    setLoading(true)
    api
      .getFavorites()
      .then((resources) => {
        if (!cancelled) setRemoteIds(resources.map((r) => r.id))
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load favorites')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isRemote, isAuthenticated])

  const toggle = useCallback(
    async (id: string) => {
      if (!isRemote) {
        local.toggle(id)
        return
      }
      if (!isAuthenticated) return

      const currentlyFav = remoteIds.includes(id)
      setError(null)
      try {
        if (currentlyFav) {
          await api.removeFavorite(id)
          setRemoteIds((prev) => prev.filter((x) => x !== id))
        } else {
          await api.addFavorite(id)
          setRemoteIds((prev) => [...prev, id])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update favorite')
        throw err
      }
    },
    [isRemote, isAuthenticated, local, remoteIds],
  )

  const remove = useCallback(
    async (id: string) => {
      if (!isRemote) {
        local.remove(id)
        return
      }
      if (!isAuthenticated || !remoteIds.includes(id)) return

      setError(null)
      try {
        await api.removeFavorite(id)
        setRemoteIds((prev) => prev.filter((x) => x !== id))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove favorite')
        throw err
      }
    },
    [isRemote, isAuthenticated, local, remoteIds],
  )

  const clear = useCallback(async () => {
    if (!isRemote) {
      local.clear()
      return
    }
    if (!isAuthenticated) return

    setError(null)
    try {
      await Promise.all(remoteIds.map((id) => api.removeFavorite(id)))
      setRemoteIds([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear favorites')
      throw err
    }
  }, [isRemote, isAuthenticated, local, remoteIds])

  const ids = useMemo(() => (isRemote ? remoteIds : local.ids), [isRemote, remoteIds, local.ids])

  const has = useCallback(
    (id: string) => {
      return ids.includes(id)
    },
    [ids],
  )

  return { ids, loading, error, toggle, remove, clear, has }
}
