import { resources } from '@/data/resources'
import type { Resource } from '@/types'
import type { DataProvider, QueryParams, ApiResponse } from './types'

// Local data provider - uses static JSON data
export class LocalDataProvider implements DataProvider {
  private resources: Resource[] = resources

  async getResources(params?: QueryParams): Promise<ApiResponse<Resource[]>> {
    let filtered = [...this.resources]

    // Apply filters
    if (params?.type) {
      filtered = filtered.filter(r => r.type === params.type)
    }

    if (params?.discipline) {
      filtered = filtered.filter(r => r.discipline === params.discipline)
    }

    // Apply search
    if (params?.search) {
      const query = params.search.toLowerCase()
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.authors.some(a => a.toLowerCase().includes(query)) ||
        r.tags.some(t => t.toLowerCase().includes(query))
      )
    }

    // Apply sorting
    if (params?.sort) {
      filtered.sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let aVal: any = a[params.sort!]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let bVal: any = b[params.sort!]

        if (params.sort === 'year' || params.sort === 'citations') {
          aVal = Number(aVal) || 0
          bVal = Number(bVal) || 0
        } else {
          aVal = String(aVal || '').toLowerCase()
          bVal = String(bVal || '').toLowerCase()
        }

        if (params.order === 'desc') {
          return bVal > aVal ? 1 : -1
        }
        return aVal > bVal ? 1 : -1
      })
    }

    // Apply pagination
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const start = (page - 1) * pageSize
    const paginated = filtered.slice(start, start + pageSize)

    return {
      data: paginated,
      meta: {
        total: filtered.length,
        page,
        pageSize,
      },
    }
  }

  async getResourceById(id: string): Promise<ApiResponse<Resource | null>> {
    const resource = this.resources.find(r => r.id === id)
    return {
      data: resource || null,
      error: resource ? undefined : 'Resource not found',
    }
  }

  async getResourcesByDiscipline(
    discipline: string,
    params?: QueryParams
  ): Promise<ApiResponse<Resource[]>> {
    return this.getResources({ ...params, discipline })
  }

  async getResourcesByType(
    type: string,
    params?: QueryParams
  ): Promise<ApiResponse<Resource[]>> {
    return this.getResources({ ...params, type })
  }

  async searchResources(
    query: string,
    params?: QueryParams
  ): Promise<ApiResponse<Resource[]>> {
    return this.getResources({ ...params, search: query })
  }

  async getStats(): Promise<ApiResponse<{
    total: number
    byType: Record<string, number>
    byDiscipline: Record<string, number>
  }>> {
    const byType: Record<string, number> = {}
    const byDiscipline: Record<string, number> = {}

    this.resources.forEach(r => {
      byType[r.type] = (byType[r.type] || 0) + 1
      byDiscipline[r.discipline] = (byDiscipline[r.discipline] || 0) + 1
    })

    return {
      data: {
        total: this.resources.length,
        byType,
        byDiscipline,
      },
    }
  }
}
