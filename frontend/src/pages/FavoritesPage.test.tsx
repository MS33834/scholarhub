import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FavoritesPage } from './FavoritesPage'
import { PageTestWrapper } from '@/test/test-utils'
import { useFavorites } from '@/store/favorites'

describe('FavoritesPage', () => {
  it('renders empty state when no favorites', () => {
    render(
      <PageTestWrapper>
        <FavoritesPage />
      </PageTestWrapper>,
    )

    expect(screen.getByRole('heading', { name: /Favorites/i })).toBeInTheDocument()
    expect(screen.getByText(/No favorites yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View all/i })).toHaveAttribute('href', '/resources')
  })

  it('lists saved resources after favorites are added', async () => {
    useFavorites.setState({ ids: ['attention-is-all-you-need'] })

    render(
      <PageTestWrapper>
        <FavoritesPage />
      </PageTestWrapper>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Attention Is All You Need/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getAllByRole('button', { name: /Remove from favorites/i }).length).toBeGreaterThan(0)
  })

  it('removes a favorite when clicking the trash button', async () => {
    const user = userEvent.setup()
    useFavorites.setState({ ids: ['attention-is-all-you-need'] })

    render(
      <PageTestWrapper>
        <FavoritesPage />
      </PageTestWrapper>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Attention Is All You Need/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    const removeButtons = screen.getAllByRole('button', { name: /Remove from favorites/i })
    await user.click(removeButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/No favorites yet/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
