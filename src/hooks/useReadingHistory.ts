import { useCallback, useEffect, useMemo, useState } from 'react'
import { env } from '@/lib/env'
import { api } from '@/lib/api'
import { useReadingHistory as useLocalReadingHistory } from '@/store/readingHistory'
import { useAuth } from '@/store/authStore'

interface HistoryView {
  resourceId: string
  title: string
  authors: string[]
  timestamp: number
  visitCount: number
}

interface UseReadingHistoryReturn {
  history: HistoryView[]
  loading: boolean
  error: string | null
  addVisit: (resourceId: string, title: string, authors: string[]) => Promise<void>
  removeItem: (resourceId: string) => Promise<void>
  clearHistory: () => Promise<void>
}

function resourceToView(resource: { id: string; title: string; authors: string[] }, viewedAt: Date | string): HistoryView {
  const ts = viewedAt instanceof Date ? viewedAt.getTime() : new Date(viewedAt).getTime()
  return {
    resourceId: resource.id,
    title: resource.title,
    authors: resource.authors,
    timestamp: ts,
    visitCount: 1,
  }
}

/**
 * Unified reading history hook.
 *
 * - Local/demo mode: reads/writes localStorage via the legacy store.
 * - Remote mode: syncs with the FastAPI backend.
 */
export function useReadingHistory(): UseReadingHistoryReturn {
  const isRemote = env.apiMode === 'remote'
  const isAuthenticated = useAuth((s) => s.isAuthenticated)

  const local = useLocalReadingHistory()
  const [remoteHistory, setRemoteHistory] = useState<HistoryView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load remote history on mount and when auth state changes.
  useEffect(() => {
    if (!isRemote || !isAuthenticated) {
      return () => {
        setRemoteHistory([])
      }
    }

    let cancelled = false
    setLoading(true)
    api
      .getHistory()
      .then((resources) => {
        if (cancelled) return
        // Backend returns entries ordered by viewed_at desc.
        const entries = resources.map((entry) =>
          resourceToView(entry.resource, entry.viewedAt),
        )
        setRemoteHistory(entries)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load history')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isRemote, isAuthenticated])

  const addVisit = useCallback(
    async (resourceId: string, title: string, authors: string[]) => {
      if (!isRemote) {
        local.addVisit(resourceId, title, authors)
        return
      }
      if (!isAuthenticated) return

      setError(null)
      try {
        await api.addToHistory(resourceId)
        setRemoteHistory((prev) => {
          const filtered = prev.filter((h) => h.resourceId !== resourceId)
          return [
            resourceToView({ id: resourceId, title, authors }, new Date()),
            ...filtered,
          ].slice(0, 50)
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add to history')
      }
    },
    [isRemote, isAuthenticated, local],
  )

  const removeItem = useCallback(
    async (resourceId: string) => {
      if (!isRemote) {
        local.removeItem(resourceId)
        return
      }
      if (!isAuthenticated) return

      setError(null)
      try {
        await api.removeFromHistory(resourceId)
        setRemoteHistory((prev) => prev.filter((h) => h.resourceId !== resourceId))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove from history')
        throw err
      }
    },
    [isRemote, isAuthenticated, local],
  )

  const clearHistory = useCallback(async () => {
    if (!isRemote) {
      local.clearHistory()
      return
    }
    if (!isAuthenticated) return

    setError(null)
    try {
      await Promise.all(remoteHistory.map((h) => api.removeFromHistory(h.resourceId)))
      setRemoteHistory([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history')
      throw err
    }
  }, [isRemote, isAuthenticated, local, remoteHistory])

  const history = useMemo(
    () => (isRemote ? remoteHistory : local.history),
    [isRemote, remoteHistory, local.history],
  )

  return { history, loading, error, addVisit, removeItem, clearHistory }
}
