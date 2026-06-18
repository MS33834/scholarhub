import type { ResourceType, Discipline, Resource } from '@/types'

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface ResourceFilters {
  ids?: string[]
  type?: ResourceType
  discipline?: Discipline | string
  year?: number
  q?: string
  page?: number
  pageSize?: number
  limit?: number
  sort?: 'year' | 'title' | 'citations' | 'added_at'
  order?: 'asc' | 'desc'
}

export interface ResourceStats {
  total: number
  byType: Record<string, number>
  byDiscipline: Record<string, number>
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterCredentials {
  email: string
  username: string
  password: string
}

// Backend responses use camelCase aliases (Pydantic alias_generator).
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  userId: number
  username: string
  isAdmin: boolean
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface User {
  id: number
  email: string
  username: string
  isActive: boolean
  isAdmin: boolean
}

export interface FavoriteCreateResponse {
  message: string
}

export interface HistoryEntry {
  resource: Resource
  viewedAt: string
}

export interface HistoryCreateResponse {
  message: string
}
