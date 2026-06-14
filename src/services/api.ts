const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

import type { Resource } from '../types';

// API 响应类型定义
interface ApiResponse<T> {
  resources?: T[];
  favorites?: T[];
  history?: T[];
  count?: number;
  message?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    const result = await this.request<{
      access_token: string;
      user_id: number;
      username: string;
      is_admin: boolean;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(result.access_token);
    return result;
  }

  async register(email: string, username: string, password: string) {
    const result = await this.request<{
      access_token: string;
      user_id: number;
      username: string;
      is_admin: boolean;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
    this.setToken(result.access_token);
    return result;
  }

  async getMe() {
    return this.request<{
      id: number;
      email: string;
      username: string;
      is_active: boolean;
      is_admin: boolean;
    }>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Resources
  async getResources(params?: {
    type?: string;
    discipline?: string;
    year?: number;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Resource>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return this.request<ApiResponse<Resource>>(
      `/resources/${query ? `?${query}` : ''}`
    );
  }

  async getResource(id: string): Promise<Resource> {
    return this.request<Resource>(`/resources/${id}`);
  }

  async createResource(resource: Partial<Resource>): Promise<Resource> {
    return this.request<Resource>('/resources/', {
      method: 'POST',
      body: JSON.stringify(resource),
    });
  }

  async updateResource(id: string, updates: Partial<Resource>): Promise<Resource> {
    return this.request<Resource>(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteResource(id: string): Promise<void> {
    return this.request<void>(`/resources/${id}`, {
      method: 'DELETE',
    });
  }

  // Favorites
  async getFavorites(): Promise<ApiResponse<Resource>> {
    return this.request<ApiResponse<Resource>>('/favorites/');
  }

  async addFavorite(resourceId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/favorites/${resourceId}`, {
      method: 'POST',
    });
  }

  async removeFavorite(resourceId: string): Promise<void> {
    return this.request<void>(`/favorites/${resourceId}`, {
      method: 'DELETE',
    });
  }

  // History
  async getHistory(): Promise<ApiResponse<Resource>> {
    return this.request<ApiResponse<Resource>>('/history/');
  }

  async addToHistory(resourceId: string) {
    return this.request<{ message: string }>(`/history/${resourceId}`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
