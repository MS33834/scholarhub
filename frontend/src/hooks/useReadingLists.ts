import { useCallback, useEffect, useMemo, useState } from 'react'
import { env } from '@/lib/env'
import { api } from '@/lib/api'
import {
  useReadingLists as useLocalReadingLists,
  type ReadingList as LocalReadingList,
} from '@/store/readingLists'
import { useAuth } from '@/store/authStore'
import type { ReadingList as RemoteReadingList, ReadingListUpdate } from '@/lib/api/types'

interface UseReadingListsReturn {
  lists: LocalReadingList[]
  loading: boolean
  error: string | null
  createList: (name: string, description?: string) => Promise<string>
  updateList: (id: string, updates: ReadingListUpdate) => Promise<void>
  deleteList: (id: string) => Promise<void>
  addToList: (listId: string, resourceId: string) => Promise<void>
  removeFromList: (listId: string, resourceId: string) => Promise<void>
  getList: (id: string) => LocalReadingList | undefined
  getAllLists: () => LocalReadingList[]
}

function remoteToLocalList(remote: RemoteReadingList): LocalReadingList {
  return {
    id: String(remote.id),
    name: remote.name,
    description: remote.description || '',
    isPublic: remote.isPublic,
    resourceIds: remote.items.map((item) => item.resource?.id || item.resourceId || ''),
    createdAt: new Date(remote.createdAt).getTime(),
    updatedAt: new Date(remote.updatedAt).getTime(),
  }
}

/**
 * Unified reading lists hook.
 *
 * - Local/demo mode: reads/writes localStorage via the legacy store.
 * - Remote mode: syncs with the FastAPI backend when authenticated.
 */
export function useReadingLists(): UseReadingListsReturn {
  const isRemote = env.apiMode === 'remote'
  const isAuthenticated = useAuth((s) => s.isAuthenticated)

  const local = useLocalReadingLists()
  const [remoteLists, setRemoteLists] = useState<LocalReadingList[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load remote reading lists on mount and when auth state changes.
  useEffect(() => {
    if (!isRemote || !isAuthenticated) {
      return () => {
        setRemoteLists([])
      }
    }

    let cancelled = false
    setLoading(true)
    api
      .getReadingLists()
      .then((lists) => {
        if (!cancelled) setRemoteLists(lists.map(remoteToLocalList))
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reading lists')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isRemote, isAuthenticated])

  const createList = useCallback(
    async (name: string, description = '') => {
      if (!isRemote) {
        return local.createList(name, description)
      }
      if (!isAuthenticated) return ''

      setError(null)
      try {
        const created = await api.createReadingList({ name, description })
        const localList = remoteToLocalList(created)
        setRemoteLists((prev) => [localList, ...prev])
        return created.id
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create reading list')
        throw err
      }
    },
    [isRemote, isAuthenticated, local],
  )

  const updateList = useCallback(
    async (id: string, updates: ReadingListUpdate) => {
      if (!isRemote) {
        local.updateList(id, updates)
        return
      }
      if (!isAuthenticated) return

      setError(null)
      try {
        const updated = await api.updateReadingList(id, updates)
        const localList = remoteToLocalList(updated)
        setRemoteLists((prev) => prev.map((list) => (list.id === id ? localList : list)))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update reading list')
        throw err
      }
    },
    [isRemote, isAuthenticated, local],
  )

  const deleteList = useCallback(
    async (id: string) => {
      if (!isRemote) {
        local.deleteList(id)
        return
      }
      if (!isAuthenticated) return

      setError(null)
      try {
        await api.deleteReadingList(id)
        setRemoteLists((prev) => prev.filter((list) => list.id !== id))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete reading list')
        throw err
      }
    },
    [isRemote, isAuthenticated, local],
  )

  const addToList = useCallback(
    async (listId: string, resourceId: string) => {
      if (!isRemote) {
        local.addToList(listId, resourceId)
        return
      }
      if (!isAuthenticated) return

      const list = remoteLists.find((l) => l.id === listId)
      if (list?.resourceIds.includes(resourceId)) return

      setError(null)
      try {
        const updated = await api.addReadingListItem(listId, resourceId)
        const localList = remoteToLocalList(updated)
        setRemoteLists((prev) => prev.map((l) => (l.id === listId ? localList : l)))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add to reading list')
        throw err
      }
    },
    [isRemote, isAuthenticated, local, remoteLists],
  )

  const removeFromList = useCallback(
    async (listId: string, resourceId: string) => {
      if (!isRemote) {
        local.removeFromList(listId, resourceId)
        return
      }
      if (!isAuthenticated) return

      setError(null)
      try {
        const updated = await api.removeReadingListItem(listId, resourceId)
        const localList = remoteToLocalList(updated)
        setRemoteLists((prev) => prev.map((l) => (l.id === listId ? localList : l)))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove from reading list')
        throw err
      }
    },
    [isRemote, isAuthenticated, local],
  )

  const lists = useMemo(() => (isRemote ? remoteLists : local.lists), [isRemote, remoteLists, local.lists])

  const getList = useCallback(
    (id: string) => {
      return lists.find((list) => list.id === id)
    },
    [lists],
  )

  const getAllLists = useCallback(() => {
    return [...lists].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [lists])

  return {
    lists,
    loading,
    error,
    createList,
    updateList,
    deleteList,
    addToList,
    removeFromList,
    getList,
    getAllLists,
  }
}
