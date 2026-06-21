import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResourceDetailPage } from './ResourceDetailPage'
import { RoutedPageTestWrapper } from '@/test/test-utils'
import { Toast } from '@/components/Toast'

describe('ResourceDetailPage', () => {
  it('renders resource details after loading', async () => {
    render(
      <RoutedPageTestWrapper initialEntries={['/resource/attention-is-all-you-need']} path="/resource/:id">
        <ResourceDetailPage />
        <Toast />
      </RoutedPageTestWrapper>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Attention Is All You Need/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getAllByText(/NeurIPS/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Abstract/i })).toBeInTheDocument()
  })

  it('toggles favorite state when clicking the save button', async () => {
    const user = userEvent.setup()
    render(
      <RoutedPageTestWrapper initialEntries={['/resource/attention-is-all-you-need']} path="/resource/:id">
        <ResourceDetailPage />
        <Toast />
      </RoutedPageTestWrapper>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Attention Is All You Need/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    const saveButton = screen.getByRole('button', { name: /Save/i })
    expect(saveButton).toBeInTheDocument()

    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Saved/i })).toBeInTheDocument()
    })

    const savedButton = screen.getByRole('button', { name: /Saved/i })
    await user.click(savedButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument()
    })
  })

  it('shows not-found state for an unknown resource', async () => {
    render(
      <RoutedPageTestWrapper initialEntries={['/resource/unknown-resource-999']} path="/resource/:id">
        <ResourceDetailPage />
        <Toast />
      </RoutedPageTestWrapper>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Resource not found/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByRole('link', { name: /Back to all resources/i })).toHaveAttribute('href', '/resources')
  })

  it('displays citation formats', async () => {
    render(
      <RoutedPageTestWrapper initialEntries={['/resource/attention-is-all-you-need']} path="/resource/:id">
        <ResourceDetailPage />
        <Toast />
      </RoutedPageTestWrapper>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Attention Is All You Need/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByRole('heading', { name: /Cite this resource/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /APA/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /MLA/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /GB\/T 7714/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /BibTeX/i })).toBeInTheDocument()
  })
})
