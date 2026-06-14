import type { DataProvider } from './types'
import { LocalDataProvider } from './local-provider'

// API client - singleton instance
class ApiClient {
  private provider: DataProvider

  constructor(provider?: DataProvider) {
    // Default to local provider, can be swapped for remote provider later
    this.provider = provider || new LocalDataProvider()
  }

  // Get the current data provider
  getProvider(): DataProvider {
    return this.provider
  }

  // Switch data provider (e.g., from local to remote)
  setProvider(provider: DataProvider): void {
    this.provider = provider
  }

  // Convenience methods that delegate to provider
  getResources = (params?: Parameters<DataProvider['getResources']>[0]) =>
    this.provider.getResources(params)

  getResourceById = (id: string) =>
    this.provider.getResourceById(id)

  getResourcesByDiscipline = (
    discipline: string,
    params?: Parameters<DataProvider['getResourcesByDiscipline']>[1]
  ) => this.provider.getResourcesByDiscipline(discipline, params)

  getResourcesByType = (
    type: string,
    params?: Parameters<DataProvider['getResourcesByType']>[1]
  ) => this.provider.getResourcesByType(type, params)

  searchResources = (
    query: string,
    params?: Parameters<DataProvider['searchResources']>[1]
  ) => this.provider.searchResources(query, params)

  getStats = () => this.provider.getStats()
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export for testing
export { ApiClient }
