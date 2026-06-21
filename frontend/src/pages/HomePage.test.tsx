import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomePage } from './HomePage'
import { PageTestWrapper, RouteLocation } from '@/test/test-utils'
import { Toast } from '@/components/Toast'

function setup() {
  return render(
    <PageTestWrapper>
      <HomePage />
      <Toast />
      <RouteLocation />
    </PageTestWrapper>,
  )
}

async function waitForPageReady() {
  await waitFor(() => {
    expect(screen.getByText(/8 resources/i)).toBeInTheDocument()
  }, { timeout: 3000 })
}

describe('HomePage', () => {
  it('renders the hero and disciplines section', async () => {
    setup()
    await waitForPageReady()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Papers, books, and datasets/i)
    expect(screen.getByRole('textbox', { name: /Search/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Disciplines/i })).toBeInTheDocument()
  })

  it('displays featured resources after loading', async () => {
    setup()
    await waitForPageReady()

    const links = screen.getAllByRole('link')
    const featuredLink = links.find((l) => l.getAttribute('href')?.startsWith('/resource/'))
    expect(featuredLink).toBeDefined()
  })

  it('navigates to search when submitting a keyword', async () => {
    const user = userEvent.setup()
    setup()
    await waitForPageReady()

    const searchInput = screen.getByRole('textbox', { name: /Search/i })
    await user.type(searchInput, 'transformer')
    await user.click(screen.getByRole('button', { name: /Search/i }))

    await waitFor(() => {
      const location = screen.getByTestId('router-location')
      expect(location).toHaveAttribute('data-pathname', '/search')
      expect(location).toHaveAttribute('data-search', '?q=transformer')
    })
  })

  it('shows a toast when searching with empty input', async () => {
    const user = userEvent.setup()
    setup()
    await waitForPageReady()

    const searchButton = screen.getByRole('button', { name: /Search/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Please enter a keyword/i)
    })
  })

  it('renders the about/intro section', async () => {
    setup()
    await waitForPageReady()

    expect(screen.getByRole('heading', { name: /About This Project/i })).toBeInTheDocument()
    expect(screen.getByText(/Cite resources/i)).toBeInTheDocument()
    expect(screen.getByText(/Contribute/i)).toBeInTheDocument()
  })
})
