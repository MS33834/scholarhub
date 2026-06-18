import { describe, it, expect, beforeEach } from 'vitest'
import { SearchEngine } from './search'
import type { Resource } from '@/types'

const mockResources: Resource[] = [
  {
    id: 'attention-is-all-you-need',
    type: 'paper',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer'],
    year: 2017,
    venue: 'NeurIPS',
    discipline: 'computer-science',
    subdiscipline: 'machine-learning',
    tags: ['transformer', 'attention', 'neural-networks'],
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.',
    preview: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.',
    downloadUrl: 'https://arxiv.org/abs/1706.03762',
    citation: {
      apa: 'Vaswani, A., et al. (2017). Attention is all you need.',
      mla: 'Vaswani, Ashish, et al. "Attention is all you need."',
      gbt: 'Vaswani A, et al. Attention is all you need[J].',
      bibtex: '@article{vaswani2017attention, title={Attention is all you need}}',
    },
    addedAt: '2024-01-01',
    citations: 92000,
  },
  {
    id: 'bert-paper',
    type: 'paper',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: ['Jacob Devlin', 'Ming-Wei Chang'],
    year: 2019,
    venue: 'NAACL',
    discipline: 'computer-science',
    subdiscipline: 'nlp',
    tags: ['bert', 'transformer', 'pre-training'],
    abstract: 'We introduce a new language representation model called BERT.',
    preview: 'BERT is designed to pre-train deep bidirectional representations.',
    downloadUrl: 'https://arxiv.org/abs/1810.04805',
    citation: {
      apa: 'Devlin, J., et al. (2019). BERT: Pre-training of deep bidirectional transformers.',
      mla: 'Devlin, Jacob, et al. "BERT: Pre-training of deep bidirectional transformers."',
      gbt: 'Devlin J, et al. BERT: Pre-training of deep bidirectional transformers[C].',
      bibtex: '@article{devlin2019bert, title={BERT: Pre-training of deep bidirectional transformers}}',
    },
    addedAt: '2024-01-02',
    citations: 65000,
  },
]

describe('SearchEngine', () => {
  let engine: SearchEngine

  beforeEach(() => {
    engine = new SearchEngine()
    engine.initialize(mockResources)
  })

  it('initializes with resources', () => {
    const stats = engine.getStats()
    expect(stats.totalResources).toBe(2)
    expect(stats.totalFields).toBeGreaterThan(0)
  })

  it('searches by title', () => {
    const results = engine.search('Attention')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].resource.id).toBe('attention-is-all-you-need')
  })

  it('searches by author', () => {
    const results = engine.search('Vaswani')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].resource.id).toBe('attention-is-all-you-need')
  })

  it('searches by tag', () => {
    const results = engine.search('transformer')
    expect(results.length).toBe(2) // Both papers have this tag
  })

  it('supports field-specific search', () => {
    const results = engine.search('title:BERT')
    expect(results.length).toBe(1)
    expect(results[0].resource.id).toBe('bert-paper')
  })

  it('supports boolean AND operator', () => {
    const results = engine.search('transformer AND attention')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].resource.id).toBe('attention-is-all-you-need')
  })

  it('supports boolean OR operator', () => {
    const results = engine.search('Vaswani OR Devlin')
    expect(results.length).toBe(2)
  })

  it('supports boolean NOT operator', () => {
    const results = engine.search('transformer NOT BERT')
    expect(results.length).toBe(1)
    expect(results[0].resource.id).toBe('attention-is-all-you-need')
  })

  it('returns highlights', () => {
    const results = engine.search('attention')
    expect(results[0].highlights.length).toBeGreaterThan(0)
    expect(results[0].highlights[0].field).toBeDefined()
    expect(results[0].highlights[0].snippet).toBeDefined()
  })

  it('ranks results by score', () => {
    const results = engine.search('transformer')
    // Title match should rank higher than tag match
    expect(results[0].score).toBeGreaterThanOrEqual(results[1]?.score || 0)
  })

  it('returns suggestions', () => {
    const suggestions = engine.suggest('trans')
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions).toContain('transformer')
  })

  it('handles empty query', () => {
    const results = engine.search('')
    expect(results.length).toBe(0)
  })

  it('handles no matches', () => {
    const results = engine.search('nonexistentterm12345')
    expect(results.length).toBe(0)
  })
})
