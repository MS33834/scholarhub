import { env, appConfig } from '@/lib/env'
import type { Resource } from '@/types'
import {
  type ResourceFilters,
  type PaginatedResponse,
  type ResourceStats,
  type AuthResponse,
  type LoginCredentials,
  type RefreshTokenRequest,
  type RegisterCredentials,
  type User,
  type FavoriteCreateResponse,
  type HistoryCreateResponse,
  type HistoryEntry,
  type ResourceSubmission,
  type ResourceSubmissionCreate,
  type ResourceSubmissionListResponse,
  type ResourceSubmissionReview,
  type UserUpdate,
} from './types'

/**
 * Remote backend API client.
 *
 * Talks to the FastAPI backend. Authentication state is persisted to
 * localStorage so the user stays logged in across reloads. Access tokens are
 * short-lived; refresh tokens are used to obtain new access tokens silently.
 */

const API_BASE = env.apiUrl ?? 'http://localhost:8000/api'

type RequestOptions = RequestInit & { skipAuth?: boolean; skipRefresh?: boolean }

class RemoteApiClient {
  private token: string | null = null
  private refreshToken: string | null = null

  constructor() {
    this.token = localStorage.getItem(appConfig.tokenKey)
    this.refreshToken = localStorage.getItem(appConfig.refreshTokenKey)
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem(appConfig.tokenKey, token)
    } else {
      localStorage.removeItem(appConfig.tokenKey)
    }
  }

  getToken(): string | null {
    return this.token
  }

  setRefreshToken(token: string | null) {
    this.refreshToken = token
    if (token) {
      localStorage.setItem(appConfig.refreshTokenKey, token)
    } else {
      localStorage.removeItem(appConfig.refreshTokenKey)
    }
  }

  getRefreshToken(): string | null {
    return this.refreshToken
  }

  isAuthenticated(): boolean {
    return this.token !== null
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...Object.fromEntries(new Headers(options.headers).entries()),
      },
    })

    if (response.status === 401 && !options.skipAuth && !options.skipRefresh && this.refreshToken) {
      const refreshed = await this.refresh()
      if (refreshed) {
        return this.request(endpoint, { ...options, skipRefresh: true })
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json() as Promise<T>
  }

  private setAuth(result: AuthResponse) {
    this.setToken(result.accessToken)
    this.setRefreshToken(result.refreshToken)
  }

  // Auth
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    })
    this.setAuth(result)
    return result
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    })
    this.setAuth(result)
    return result
  }

  async refresh(): Promise<AuthResponse | null> {
    const token = this.refreshToken
    if (!token) return null
    try {
      const result = await this.request<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: token } satisfies RefreshTokenRequest),
        skipAuth: true,
        skipRefresh: true,
      })
      this.setAuth(result)
      return result
    } catch {
      this.logout()
      return null
    }
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me')
  }

  logout() {
    this.setToken(null)
    this.setRefreshToken(null)
  }

  // Resources
  async listResources(filters: ResourceFilters = {}): Promise<PaginatedResponse<Resource>> {
    const params = new URLSearchParams()

    if (filters.ids && filters.ids.length > 0) {
      filters.ids.forEach((id) => params.append('ids', id))
    }
    if (filters.type) params.append('type', filters.type)
    if (filters.discipline) params.append('discipline', filters.discipline)
    if (filters.year !== undefined) params.append('year', String(filters.year))
    if (filters.q) params.append('q', filters.q)
    if (filters.page !== undefined) params.append('page', String(filters.page))
    if (filters.pageSize !== undefined) params.append('page_size', String(filters.pageSize))
    if (filters.limit !== undefined) params.append('limit', String(filters.limit))
    if (filters.sort) params.append('sort', filters.sort)
    if (filters.order) params.append('order', filters.order)

    const query = params.toString()
    return this.request<PaginatedResponse<Resource>>(`/resources${query ? `/?${query}` : '/'}`)
  }

  async getResource(id: string): Promise<Resource> {
    return this.request<Resource>(`/resources/${id}`)
  }

  async createResource(resource: Partial<Resource>): Promise<Resource> {
    return this.request<Resource>('/resources/', {
      method: 'POST',
      body: JSON.stringify(resource),
    })
  }

  async updateResource(id: string, updates: Partial<Resource>): Promise<Resource> {
    return this.request<Resource>(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteResource(id: string): Promise<void> {
    return this.request<void>(`/resources/${id}`, { method: 'DELETE' })
  }

  async getStats(): Promise<ResourceStats> {
    return this.request<ResourceStats>('/resources/stats')
  }

  // Users
  async listUsers(): Promise<User[]> {
    return this.request<User[]>('/users/')
  }

  async updateUser(id: number, updates: UserUpdate): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteUser(id: number): Promise<void> {
    return this.request<void>(`/users/${id}`, { method: 'DELETE' })
  }

  // Favorites
  async getFavorites(): Promise<Resource[]> {
    const data = await this.request<{ favorites: Resource[] }>('/favorites/')
    return data.favorites ?? []
  }

  async addFavorite(resourceId: string): Promise<FavoriteCreateResponse> {
    return this.request<FavoriteCreateResponse>(`/favorites/${resourceId}`, { method: 'POST' })
  }

  async removeFavorite(resourceId: string): Promise<void> {
    return this.request<void>(`/favorites/${resourceId}`, { method: 'DELETE' })
  }

  // History
  async getHistory(): Promise<HistoryEntry[]> {
    const data = await this.request<{ history: HistoryEntry[] }>('/history/')
    return data.history ?? []
  }

  async addToHistory(resourceId: string): Promise<HistoryCreateResponse> {
    return this.request<HistoryCreateResponse>(`/history/${resourceId}`, { method: 'POST' })
  }

  async removeFromHistory(resourceId: string): Promise<void> {
    return this.request<void>(`/history/${resourceId}`, { method: 'DELETE' })
  }

  // Resource submissions
  async createSubmission(submission: ResourceSubmissionCreate): Promise<ResourceSubmission> {
    return this.request<ResourceSubmission>('/submissions/', {
      method: 'POST',
      body: JSON.stringify(submission),
    })
  }

  async listMySubmissions(): Promise<ResourceSubmissionListResponse> {
    return this.request<ResourceSubmissionListResponse>('/submissions/me')
  }

  async listPendingSubmissions(): Promise<ResourceSubmissionListResponse> {
    return this.request<ResourceSubmissionListResponse>('/submissions/pending')
  }

  async getSubmission(id: string): Promise<ResourceSubmission> {
    return this.request<ResourceSubmission>(`/submissions/${id}`)
  }

  async reviewSubmission(id: string, review: ResourceSubmissionReview): Promise<ResourceSubmission> {
    return this.request<ResourceSubmission>(`/submissions/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(review),
    })
  }
}

export const remoteApi = new RemoteApiClient()
