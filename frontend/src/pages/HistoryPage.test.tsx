import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HistoryPage } from './HistoryPage'
import { PageTestWrapper } from '@/test/test-utils'
import { useReadingHistory } from '@/store/readingHistory'

describe('HistoryPage', () => {
  it('renders empty state when no history', () => {
    render(
      <PageTestWrapper>
        <HistoryPage />
      </PageTestWrapper>,
    )

    expect(screen.getByRole('heading', { name: /Reading History/i })).toBeInTheDocument()
    expect(screen.getByText(/No history yet/i)).toBeInTheDocument()
  })

  it('lists recently viewed resources', async () => {
    useReadingHistory.setState({
      history: [
        {
          resourceId: 'attention-is-all-you-need',
          title: 'Attention Is All You Need',
          authors: ['Ashish Vaswani'],
          timestamp: Date.now(),
          visitCount: 1,
        },
      ],
    })

    render(
      <PageTestWrapper>
        <HistoryPage />
      </PageTestWrapper>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Attention Is All You Need/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText(/Ashish Vaswani/i)).toBeInTheDocument()
  })

  it('removes a history item when clicking delete', async () => {
    const user = userEvent.setup()
    useReadingHistory.setState({
      history: [
        {
          resourceId: 'attention-is-all-you-need',
          title: 'Attention Is All You Need',
          authors: ['Ashish Vaswani'],
          timestamp: Date.now(),
          visitCount: 1,
        },
      ],
    })

    render(
      <PageTestWrapper>
        <HistoryPage />
      </PageTestWrapper>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Attention Is All You Need/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    const removeButton = screen.getByRole('button', { name: /Remove from history/i })
    await user.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByText(/Attention Is All You Need/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
