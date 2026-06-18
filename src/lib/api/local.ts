import { resources as localResources } from '@/data/resources'
import type { Resource } from '@/types'
import {
  type ResourceFilters,
  type PaginatedResponse,
  type ResourceStats,
} from './types'

/**
 * Demo data provider. Implements the same resource API surface as the remote
 * backend but reads from the bundled static dataset. Used for GitHub Pages
 * showcase builds and local development without a running backend.
 */

function filterResources(resources: Resource[], filters: ResourceFilters): Resource[] {
  let filtered = [...resources]

  if (filters.ids && filters.ids.length > 0) {
    const idSet = new Set(filters.ids)
    filtered = filtered.filter((r) => idSet.has(r.id))
  }

  if (filters.type) {
    filtered = filtered.filter((r) => r.type === filters.type)
  }

  if (filters.discipline && filters.discipline !== 'all') {
    filtered = filtered.filter((r) => r.discipline === filters.discipline)
  }

  if (filters.year) {
    filtered = filtered.filter((r) => r.year === filters.year)
  }

  if (filters.q) {
    const query = filters.q.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.authors.some((a) => a.toLowerCase().includes(query)) ||
        r.tags.some((t) => t.toLowerCase().includes(query)) ||
        r.abstract.toLowerCase().includes(query),
    )
  }

  if (filters.sort) {
    filtered.sort((a, b) => {
      const field = filters.sort!
      // Map API sort keys to Resource object keys (camelCase).
      const key = field === 'added_at' ? 'addedAt' : (field as keyof Resource)
      let aVal: string | number = (a[key] ?? '') as string | number
      let bVal: string | number = (b[key] ?? '') as string | number

      if (field === 'year' || field === 'citations') {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
      } else {
        aVal = String(aVal).toLowerCase()
        bVal = String(bVal).toLowerCase()
      }

      if (filters.order === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    })
  }

  return filtered
}

function paginate<T>(items: T[], page = 1, pageSize = 20): PaginatedResponse<T> {
  const safePage = Math.max(1, page)
  const safePageSize = Math.min(Math.max(1, pageSize), 200)
  const start = (safePage - 1) * safePageSize
  const totalPages = Math.ceil(items.length / safePageSize)
  return {
    data: items.slice(start, start + safePageSize),
    meta: {
      total: items.length,
      page: safePage,
      pageSize: safePageSize,
      totalPages,
    },
  }
}

export async function listResources(
  filters: ResourceFilters = {},
): Promise<PaginatedResponse<Resource>> {
  let filtered = filterResources(localResources, filters)

  // If an explicit top-N limit is requested without pagination, honor it.
  if (filters.limit && !filters.page && !filters.pageSize) {
    filtered = filtered.slice(0, filters.limit)
  }

  return paginate(filtered, filters.page, filters.pageSize)
}

export async function getResourceById(id: string): Promise<Resource | null> {
  return localResources.find((r) => r.id === id) ?? null
}

export async function getStats(): Promise<ResourceStats> {
  const byType: Record<string, number> = {}
  const byDiscipline: Record<string, number> = {}

  localResources.forEach((r) => {
    byType[r.type] = (byType[r.type] || 0) + 1
    byDiscipline[r.discipline] = (byDiscipline[r.discipline] || 0) + 1
  })

  return {
    total: localResources.length,
    byType,
    byDiscipline,
  }
}
