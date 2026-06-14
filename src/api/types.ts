import type { Resource } from '@/types'

// API response wrapper
export interface ApiResponse<T> {
  data: T
  error?: string
  meta?: {
    total?: number
    page?: number
    pageSize?: number
  }
}

// Query parameters for filtering and pagination
export interface QueryParams {
  page?: number
  pageSize?: number
  type?: string
  discipline?: string
  search?: string
  sort?: 'year' | 'title' | 'citations' | 'addedAt'
  order?: 'asc' | 'desc'
}

// Data provider interface - can be implemented by local or remote sources
export interface DataProvider {
  // Get all resources with optional filtering
  getResources(params?: QueryParams): Promise<ApiResponse<Resource[]>>
  
  // Get single resource by ID
  getResourceById(id: string): Promise<ApiResponse<Resource | null>>
  
  // Get resources by discipline
  getResourcesByDiscipline(discipline: string, params?: QueryParams): Promise<ApiResponse<Resource[]>>
  
  // Get resources by type
  getResourcesByType(type: string, params?: QueryParams): Promise<ApiResponse<Resource[]>>
  
  // Search resources
  searchResources(query: string, params?: QueryParams): Promise<ApiResponse<Resource[]>>
  
  // Get statistics
  getStats(): Promise<ApiResponse<{
    total: number
    byType: Record<string, number>
    byDiscipline: Record<string, number>
  }>>
}
