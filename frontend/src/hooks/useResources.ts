import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { disciplines as localDisciplines, disciplineMap as localDisciplineMap } from '@/data/disciplines'
import type { Discipline, DisciplineInfo, Resource, ResourceType } from '@/types'
import type { ResourceFilters } from '@/lib/api/types'

interface UseResourcesOptions {
  filters?: ResourceFilters
  enabled?: boolean
}

interface UseResourcesReturn {
  resources: Resource[]
  loading: boolean
  error: string | null
  meta?: { total: number; page: number; pageSize: number; totalPages: number }
}

/**
 * Stable filter key for effect dependencies.
 *
 * We intentionally serialize only the primitive fields we care about so
 * that a new object reference with identical values does not re-trigger
 * a network request.
 */
function filterKey(filters: ResourceFilters): string {
  return JSON.stringify({
    type: filters.type,
    discipline: filters.discipline,
    year: filters.year,
    tag: filters.tag,
    q: filters.q,
    page: filters.page,
    pageSize: filters.pageSize,
    limit: filters.limit,
    sort: filters.sort,
    order: filters.order,
  })
}

/**
 * Universal hook for fetching resources.
 *
 * In local/demo mode this reads from the bundled dataset with in-memory
 * filtering/sorting. In remote mode it talks to the FastAPI backend.
 */
export function useResources(options: UseResourcesOptions = {}): UseResourcesReturn {
  const { filters = {}, enabled = true } = options
  const [data, setData] = useState<Resource[]>([])
  const [meta, setMeta] = useState<UseResourcesReturn['meta']>()
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const key = useMemo(
    () =>
      filterKey({
        type: filters.type,
        discipline: filters.discipline,
        year: filters.year,
        tag: filters.tag,
        q: filters.q,
        page: filters.page,
        pageSize: filters.pageSize,
        limit: filters.limit,
        sort: filters.sort,
        order: filters.order,
      }),
    [
      filters.type,
      filters.discipline,
      filters.year,
      filters.tag,
      filters.q,
      filters.page,
      filters.pageSize,
      filters.limit,
      filters.sort,
      filters.order,
    ],
  )

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    async function fetchResources() {
      setLoading(true)
      setError(null)
      try {
        // `filters` is stable via `key`; we read the latest object inside the
        // async function to avoid adding the unstable object reference to the
        // effect dependency array.
        const result = await api.listResources(filters)
        if (!cancelled) {
          setData(result.data)
          setMeta(result.meta)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load resources')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchResources()
    return () => {
      cancelled = true
    }
    // `key` captures the stable identity of the current filter set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key])

  return { resources: data, loading, error, meta }
}

/**
 * Fetch a single resource by id.
 */
export function useResource(id: string | undefined) {
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchResource() {
      if (!id) {
        setResource(null)
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const result = await api.getResource(id)
        if (!cancelled) {
          setResource(result)
          // Add to history if authenticated
          if (api.isAuthenticated()) {
            await api.addToHistory(id).catch(() => {})
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load resource')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchResource()
    return () => {
      cancelled = true
    }
  }, [id])

  return { resource, loading, error }
}

/**
 * Static discipline metadata (localised, UI-only).
 *
 * Disciplines are part of the app's domain taxonomy and currently do not
 * change at runtime, so they remain a static import. If the backend ever
 * exposes discipline configuration, this hook can be swapped to a remote
 * fetch without touching consumers.
 */
export function useDisciplines(): DisciplineInfo[] {
  return useMemo(() => localDisciplines, [])
}

export function useDisciplineMap(): Record<Discipline, DisciplineInfo> {
  return useMemo(() => localDisciplineMap, [])
}

/**
 * Compute statistics. In local mode this is derived from the bundled data;
 * in remote mode it is fetched from the backend.
 */
export function useResourceStats() {
  const [stats, setStats] = useState<{ total: number; byType: Record<ResourceType, number>; byDiscipline: Record<string, number> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      try {
        const result = await api.getStats()
        if (!cancelled) {
          setStats(result as { total: number; byType: Record<ResourceType, number>; byDiscipline: Record<string, number> })
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStats()
    return () => {
      cancelled = true
    }
  }, [])

  return { stats, loading, error }
}
