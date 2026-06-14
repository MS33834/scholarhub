import type { Resource } from '@/types'
import type { DataProvider, QueryParams, ApiResponse } from './types'

// Base class for external data providers
export abstract class ExternalDataProvider implements DataProvider {
  protected baseUrl: string
  protected name: string

  constructor(baseUrl: string, name: string) {
    this.baseUrl = baseUrl
    this.name = name
  }

  getName(): string {
    return this.name
  }

  // Fetch with timeout and error handling
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = 10000
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Abstract methods to be implemented by each provider
  abstract getResources(params?: QueryParams): Promise<ApiResponse<Resource[]>>
  abstract getResourceById(id: string): Promise<ApiResponse<Resource | null>>
  abstract getResourcesByDiscipline(
    discipline: string,
    params?: QueryParams
  ): Promise<ApiResponse<Resource[]>>
  abstract getResourcesByType(
    type: string,
    params?: QueryParams
  ): Promise<ApiResponse<Resource[]>>
  abstract searchResources(
    query: string,
    params?: QueryParams
  ): Promise<ApiResponse<Resource[]>>
  abstract getStats(): Promise<
    ApiResponse<{
      total: number
      byType: Record<string, number>
      byDiscipline: Record<string, number>
    }>
  >
}
