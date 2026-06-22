import { env } from '@/lib/env'
import type { Resource } from '@/types'
import * as local from './local'
import { remoteApi } from './remote'
import {
  type AuthResponse,
  type FavoriteCreateResponse,
  type HistoryCreateResponse,
  type HistoryEntry,
  type LoginCredentials,
  type PaginatedResponse,
  type ReadingList,
  type ReadingListCreate,
  type ReadingListUpdate,
  type RefreshTokenRequest,
  type RegisterCredentials,
  type RelatedResourcesResponse,
  type ResourceFilters,
  type ResourceStats,
  type ResourceSubmission,
  type ResourceSubmissionCreate,
  type ResourceSubmissionListResponse,
  type ResourceSubmissionReview,
  type User,
  type UserUpdate,
} from './types'

/**
 * Unified API facade.
 *
 * Code across the app imports from here. At runtime the implementation
 * switches between:
 *
 *   - `local`  : bundled static data (GitHub Pages demo / dev without backend)
 *   - `remote` : real FastAPI backend (server deployment)
 *
 * The mode is controlled at build time by `VITE_API_MODE` (or inferred from
 * `VITE_API_URL`).
 */

const isRemote = env.apiMode === 'remote'

class Api {
  // Auth (no-op in local/demo mode)
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (!isRemote) throw new Error('Authentication requires a remote backend')
    return remoteApi.login(credentials)
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    if (!isRemote) throw new Error('Authentication requires a remote backend')
    return remoteApi.register(credentials)
  }

  async getMe(): Promise<User> {
    if (!isRemote) throw new Error('Authentication requires a remote backend')
    return remoteApi.getMe()
  }

  logout(): void {
    if (isRemote) remoteApi.logout()
  }

  getToken(): string | null {
    if (!isRemote) return null
    return remoteApi.getToken()
  }

  getRefreshToken(): string | null {
    if (!isRemote) return null
    return remoteApi.getRefreshToken()
  }

  async refresh(): Promise<AuthResponse | null> {
    if (!isRemote) return null
    return remoteApi.refresh()
  }

  isAuthenticated(): boolean {
    return isRemote && remoteApi.isAuthenticated()
  }

  // Resources
  async listResources(filters?: ResourceFilters): Promise<PaginatedResponse<Resource>> {
    if (isRemote) return remoteApi.listResources(filters)
    return local.listResources(filters)
  }

  async getResource(id: string): Promise<Resource> {
    if (isRemote) return remoteApi.getResource(id)
    const resource = await local.getResourceById(id)
    if (!resource) throw new Error('Resource not found')
    return resource
  }

  async getRelatedResources(resourceId: string, limit?: number): Promise<RelatedResourcesResponse> {
    if (isRemote) return remoteApi.getRelatedResources(resourceId, limit)
    const all = await local.listResources({ limit: 50 })
    const current = await local.getResourceById(resourceId)
    if (!current) throw new Error('Resource not found')
    const data = all.data
      .filter(
        (r) =>
          r.id !== current.id &&
          (r.discipline === current.discipline || r.tags.some((tag) => current.tags.includes(tag))),
      )
      .slice(0, limit ?? 3)
    return {
      data,
      meta: { total: data.length, page: 1, pageSize: data.length, totalPages: 1 },
    }
  }

  async createResource(resource: Partial<Resource>): Promise<Resource> {
    if (!isRemote) throw new Error('Creating resources requires a remote backend')
    return remoteApi.createResource(resource)
  }

  async updateResource(id: string, updates: Partial<Resource>): Promise<Resource> {
    if (!isRemote) throw new Error('Updating resources requires a remote backend')
    return remoteApi.updateResource(id, updates)
  }

  async deleteResource(id: string): Promise<void> {
    if (!isRemote) throw new Error('Deleting resources requires a remote backend')
    return remoteApi.deleteResource(id)
  }

  async getStats(): Promise<ResourceStats> {
    if (isRemote) return remoteApi.getStats()
    return local.getStats()
  }

  // Users (remote only)
  async listUsers(): Promise<User[]> {
    if (!isRemote) throw new Error('User management requires a remote backend')
    return remoteApi.listUsers()
  }

  async updateUser(id: number, updates: UserUpdate): Promise<User> {
    if (!isRemote) throw new Error('User management requires a remote backend')
    return remoteApi.updateUser(id, updates)
  }

  async deleteUser(id: number): Promise<void> {
    if (!isRemote) throw new Error('User management requires a remote backend')
    return remoteApi.deleteUser(id)
  }

  // Favorites (local mode returns empty list; UI still allows localStorage toggle)
  async getFavorites(): Promise<Resource[]> {
    if (isRemote) return remoteApi.getFavorites()
    return []
  }

  async addFavorite(resourceId: string): Promise<FavoriteCreateResponse> {
    if (!isRemote) throw new Error('Cloud favorites require a remote backend')
    return remoteApi.addFavorite(resourceId)
  }

  async removeFavorite(resourceId: string): Promise<void> {
    if (!isRemote) throw new Error('Cloud favorites require a remote backend')
    return remoteApi.removeFavorite(resourceId)
  }

  // History
  async getHistory(): Promise<HistoryEntry[]> {
    if (isRemote) return remoteApi.getHistory()
    return []
  }

  async addToHistory(resourceId: string): Promise<HistoryCreateResponse> {
    if (!isRemote) throw new Error('Cloud history requires a remote backend')
    return remoteApi.addToHistory(resourceId)
  }

  async removeFromHistory(resourceId: string): Promise<void> {
    if (!isRemote) throw new Error('Cloud history requires a remote backend')
    return remoteApi.removeFromHistory(resourceId)
  }

  // Reading lists (remote only; local mode falls back to localStorage store)
  async getReadingLists(): Promise<ReadingList[]> {
    if (!isRemote) throw new Error('Cloud reading lists require a remote backend')
    return remoteApi.getReadingLists()
  }

  async createReadingList(data: ReadingListCreate): Promise<ReadingList> {
    if (!isRemote) throw new Error('Cloud reading lists require a remote backend')
    return remoteApi.createReadingList(data)
  }

  async getReadingList(id: string): Promise<ReadingList> {
    if (!isRemote) throw new Error('Cloud reading lists require a remote backend')
    return remoteApi.getReadingList(id)
  }

  async updateReadingList(id: string, data: ReadingListUpdate): Promise<ReadingList> {
    if (!isRemote) throw new Error('Cloud reading lists require a remote backend')
    return remoteApi.updateReadingList(id, data)
  }

  async deleteReadingList(id: string): Promise<void> {
    if (!isRemote) throw new Error('Cloud reading lists require a remote backend')
    return remoteApi.deleteReadingList(id)
  }

  async addReadingListItem(listId: string, resourceId: string): Promise<ReadingList> {
    if (!isRemote) throw new Error('Cloud reading lists require a remote backend')
    return remoteApi.addReadingListItem(listId, resourceId)
  }

  async removeReadingListItem(listId: string, resourceId: string): Promise<ReadingList> {
    if (!isRemote) throw new Error('Cloud reading lists require a remote backend')
    return remoteApi.removeReadingListItem(listId, resourceId)
  }

  // Resource submissions (remote only)
  async createSubmission(submission: ResourceSubmissionCreate): Promise<ResourceSubmission> {
    if (!isRemote) throw new Error('Resource submissions require a remote backend')
    return remoteApi.createSubmission(submission)
  }

  async listMySubmissions(): Promise<ResourceSubmissionListResponse> {
    if (!isRemote) throw new Error('Resource submissions require a remote backend')
    return remoteApi.listMySubmissions()
  }

  async listPendingSubmissions(): Promise<ResourceSubmissionListResponse> {
    if (!isRemote) throw new Error('Resource submissions require a remote backend')
    return remoteApi.listPendingSubmissions()
  }

  async getSubmission(id: string): Promise<ResourceSubmission> {
    if (!isRemote) throw new Error('Resource submissions require a remote backend')
    return remoteApi.getSubmission(id)
  }

  async reviewSubmission(id: string, review: ResourceSubmissionReview): Promise<ResourceSubmission> {
    if (!isRemote) throw new Error('Resource submissions require a remote backend')
    return remoteApi.reviewSubmission(id, review)
  }
}

export const api = new Api()

export type {
  AuthResponse,
  FavoriteCreateResponse,
  HistoryCreateResponse,
  HistoryEntry,
  LoginCredentials,
  PaginatedResponse,
  ReadingList,
  ReadingListCreate,
  ReadingListUpdate,
  RefreshTokenRequest,
  RegisterCredentials,
  RelatedResourcesResponse,
  ResourceFilters,
  ResourceStats,
  ResourceSubmission,
  ResourceSubmissionCreate,
  ResourceSubmissionListResponse,
  ResourceSubmissionReview,
  User,
  UserUpdate,
}

export { env } from '@/lib/env'
