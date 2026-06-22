import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubmitPage } from './SubmitPage'
import { PageTestWrapper } from '@/test/test-utils'
import { useAuth } from '@/store/authStore'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: {
    createSubmission: vi.fn(),
  },
}))

function setup() {
  return render(
    <PageTestWrapper>
      <SubmitPage />
    </PageTestWrapper>,
  )
}

describe('SubmitPage', () => {
  beforeEach(() => {
    vi.mocked(api.createSubmission).mockReset()
  })

  it('prompts login when the user is not authenticated', () => {
    useAuth.setState({ user: null, isAuthenticated: false, isLoading: false })
    setup()

    expect(screen.getByRole('heading', { name: /Submit a Resource/i })).toBeInTheDocument()
    expect(screen.getByText(/Please log in to submit a resource/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Login/i })).toHaveAttribute('href', '/login')
  })

  it('renders the submission form for logged-in users', () => {
    useAuth.setState({ user: { id: 1, username: 'alice', email: 'alice@example.com', isAdmin: false }, isAuthenticated: true, isLoading: false })
    setup()

    expect(screen.getByRole('heading', { name: /Submit a Resource/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Authors')).toBeInTheDocument()
    expect(screen.getByLabelText('Tags')).toBeInTheDocument()
    expect(screen.getByLabelText('Year')).toBeInTheDocument()
    expect(screen.getByLabelText('Venue / Publisher')).toBeInTheDocument()
    expect(screen.getByLabelText('Discipline')).toBeInTheDocument()
    expect(screen.getByLabelText('Subdiscipline')).toBeInTheDocument()
    expect(screen.getByLabelText('Abstract')).toBeInTheDocument()
    expect(screen.getByLabelText('DOI')).toBeInTheDocument()
    expect(screen.getByLabelText('Download URL')).toBeInTheDocument()
    expect(screen.getByLabelText('External URL')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Submit resource/i })).toBeInTheDocument()
  })

  it('submits the form and clears fields on success', async () => {
    const user = userEvent.setup()
    useAuth.setState({ user: { id: 1, username: 'alice', email: 'alice@example.com', isAdmin: false }, isAuthenticated: true, isLoading: false })
    vi.mocked(api.createSubmission).mockResolvedValue({
      id: 'sub-1',
      status: 'pending',
      title: 'A New Paper',
      type: 'paper',
      year: 2024,
      authors: ['Alice Smith'],
      tags: ['nlp'],
      venue: 'Journal of Testing',
      discipline: 'computer-science',
      subdiscipline: 'nlp',
      abstract: 'This is the abstract.',
      submittedBy: { id: 1, username: 'alice' },
      submittedAt: '2024-01-01T00:00:00Z',
    } as Awaited<ReturnType<typeof api.createSubmission>>)

    setup()

    await user.type(screen.getByLabelText('Title'), 'A New Paper')
    await user.type(screen.getByLabelText('Authors'), 'Alice Smith')
    await user.type(screen.getByLabelText('Tags'), 'nlp')
    await user.clear(screen.getByLabelText('Year'))
    await user.type(screen.getByLabelText('Year'), '2024')
    await user.type(screen.getByLabelText('Venue / Publisher'), 'Journal of Testing')
    await user.selectOptions(screen.getByLabelText('Discipline'), 'computer-science')
    await user.type(screen.getByLabelText('Subdiscipline'), 'nlp')
    await user.type(screen.getByLabelText('DOI'), '10.1234/test')
    await user.type(screen.getByLabelText('Download URL'), 'https://example.com/paper.pdf')
    await user.type(screen.getByLabelText('External URL'), 'https://example.com/paper')
    await user.type(screen.getByLabelText('Abstract'), 'This is the abstract.')

    await user.click(screen.getByRole('button', { name: /Submit resource/i }))

    await waitFor(() => {
      expect(api.createSubmission).toHaveBeenCalledWith({
        title: 'A New Paper',
        type: 'paper',
        year: 2024,
        authors: ['Alice Smith'],
        tags: ['nlp'],
        venue: 'Journal of Testing',
        discipline: 'computer-science',
        subdiscipline: 'nlp',
        abstract: 'This is the abstract.',
        doi: '10.1234/test',
        downloadUrl: 'https://example.com/paper.pdf',
        externalUrl: 'https://example.com/paper',
      })
    })

    expect(screen.getByText(/Submission received/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('')
    expect(screen.getByLabelText('Authors')).toHaveValue('')
    expect(screen.getByLabelText('Abstract')).toHaveValue('')
  })
})
