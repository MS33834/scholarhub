import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResourceCard } from './ResourceCard'
import { resources } from '@/data/resources'
import { TestWrapper } from '@/test/test-utils'

describe('ResourceCard', () => {
  it('renders resource title', () => {
    const resource = resources[0]
    render(
      <TestWrapper>
        <ResourceCard resource={resource} />
      </TestWrapper>
    )
    expect(screen.getByText(resource.title)).toBeInTheDocument()
  })

  it('renders resource type (translated)', () => {
    const resource = resources[0]
    render(
      <TestWrapper>
        <ResourceCard resource={resource} />
      </TestWrapper>
    )
    // Type is translated to "Books", "Papers", etc.
    expect(screen.getByText(/Books|Papers|Datasets|Tutorials/i)).toBeInTheDocument()
  })

  it('renders authors (formatted)', () => {
    const resource = resources[0]
    render(
      <TestWrapper>
        <ResourceCard resource={resource} />
      </TestWrapper>
    )
    // Authors are formatted as "First Author · Second Author et al."
    expect(screen.getByText(resource.authors[0], { exact: false })).toBeInTheDocument()
  })

  it('renders year', () => {
    const resource = resources[0]
    render(
      <TestWrapper>
        <ResourceCard resource={resource} />
      </TestWrapper>
    )
    // Year is part of "Type · Year" text
    expect(screen.getByText(new RegExp(resource.year.toString()))).toBeInTheDocument()
  })
})
