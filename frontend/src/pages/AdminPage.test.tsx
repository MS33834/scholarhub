import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AdminPage } from './AdminPage'
import { PageTestWrapper, RouteLocation } from '@/test/test-utils'
import { useAuth } from '@/store/authStore'
import { api } from '@/lib/api'
import type { Resource } from '@/types'

vi.mock('@/lib/api', () => ({
  api: {
    listResources: vi.fn(),
    createResource: vi.fn(),
    updateResource: vi.fn(),
    deleteResource: vi.fn(),
    listPendingSubmissions: vi.fn(),
    reviewSubmission: vi.fn(),
  },
}))

const mockResources: Resource[] = [
  {
    id: 'test-paper-1',
    type: 'paper',
    title: 'Test Paper One',
    authors: ['Alice'],
    year: 2024,
    discipline: 'computer-science',
    subdiscipline: 'nlp',
    tags: ['test'],
    venue: 'Journal of Testing',
    abstract: 'Abstract.',
    preview: 'Preview.',
    citation: { apa: '', mla: '', gbt: '', bibtex: '' },
    citations: 0,
    addedAt: '2024-01-01',
  },
]

function setup() {
  return render(
    <PageTestWrapper>
      <AdminPage />
      <RouteLocation />
    </PageTestWrapper>,
  )
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.mocked(api.listResources).mockResolvedValue({ data: mockResources, meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 } })
    vi.mocked(api.listPendingSubmissions).mockResolvedValue({ data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } })
  })

  it('redirects non-admin users to home', async () => {
    useAuth.setState({ user: { id: 2, username: 'regular', email: 'regular@example.com', isAdmin: false }, isAuthenticated: true, isLoading: false })
    setup()

    await waitFor(() => {
      expect(screen.getByTestId('router-location')).toHaveAttribute('data-pathname', '/')
    })
  })

  it('renders resource management for admin users', async () => {
    useAuth.setState({ user: { id: 1, username: 'admin', email: 'admin@example.com', isAdmin: true }, isAuthenticated: true, isLoading: false })
    setup()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Resource Management/i })).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Add Resource/i })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: /Test Paper One/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Edit Resource/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delete resource/i })).toBeInTheDocument()
  })

  it('shows empty state when no resources exist', async () => {
    vi.mocked(api.listResources).mockResolvedValue({ data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } })
    useAuth.setState({ user: { id: 1, username: 'admin', email: 'admin@example.com', isAdmin: true }, isAuthenticated: true, isLoading: false })
    setup()

    await waitFor(() => {
      expect(screen.getByText(/No resources found/i)).toBeInTheDocument()
    })
  })
})
