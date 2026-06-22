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

export type RelatedResourcesResponse = PaginatedResponse<Resource>

export interface ResourceFilters {
  ids?: string[]
  type?: ResourceType
  discipline?: Discipline | string
  year?: number
  tag?: string
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
  createdAt: string
}

export interface UserUpdate {
  isActive?: boolean
  isAdmin?: boolean
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

export interface ReadingListItem {
  resource: Resource
  resourceId?: string
  addedAt?: string
}

export interface ReadingList {
  id: string
  name: string
  description?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  items: ReadingListItem[]
}

export interface ReadingListCreate {
  name: string
  description?: string
  isPublic?: boolean
}

export interface ReadingListUpdate {
  name?: string
  description?: string
  isPublic?: boolean
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface ResourceSubmission {
  id: string
  status: SubmissionStatus
  title: string
  type: ResourceType
  year: number
  authors: string[]
  tags: string[]
  venue?: string
  discipline: Discipline | string
  subdiscipline?: string
  abstract: string
  doi?: string
  downloadUrl?: string
  externalUrl?: string
  submittedBy: { id: number; username: string }
  submittedAt: string
  reviewedBy?: { id: number; username: string }
  reviewedAt?: string
  adminNote?: string
  resourceId?: string
}

export interface ResourceSubmissionCreate {
  title: string
  type: ResourceType
  year: number
  authors: string[]
  tags: string[]
  venue?: string
  discipline: Discipline | string
  subdiscipline?: string
  abstract: string
  doi?: string
  downloadUrl?: string
  externalUrl?: string
}

export interface ResourceSubmissionReview {
  status: 'approved' | 'rejected'
  adminNote?: string
}

export interface ResourceSubmissionListResponse {
  data: ResourceSubmission[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface UserListResponse {
  data: User[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface ReadingListListResponse {
  data: ReadingList[]
}
