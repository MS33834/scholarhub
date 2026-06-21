import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'
import { useFavorites } from '@/store/favorites'
import { useReadingHistory } from '@/store/readingHistory'
import { useAuth } from '@/store/authStore'

// Clean up persisted stores before each test so integration tests start from a
// deterministic blank slate (no leftover favorites, history, or auth state).
beforeEach(() => {
  localStorage.clear()
  useFavorites.setState({ ids: [] })
  useReadingHistory.setState({ history: [] })
  useAuth.setState({ user: null, isAuthenticated: false, isLoading: false })
})
