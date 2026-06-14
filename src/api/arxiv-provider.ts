import { ExternalDataProvider } from './external-provider'
import type { Resource } from '@/types'
import type { QueryParams, ApiResponse } from './types'

// arXiv API provider
// Documentation: https://info.arxiv.org/help/api/basics.html
export class ArxivProvider extends ExternalDataProvider {
  constructor() {
    super('http://export.arxiv.org/api/query', 'arXiv')
  }

  async searchResources(
    query: string,
    params?: QueryParams
  ): Promise<ApiResponse<Resource[]>> {
    const searchParams = new URLSearchParams({
      search_query: `all:${query}`,
      start: String(((params?.page || 1) - 1) * (params?.pageSize || 20)),
      max_results: String(params?.pageSize || 20),
      sortBy: 'relevance',
      sortOrder: 'descending',
    })

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}?${searchParams}`
      )
      const text = await response.text()
      const parser = new DOMParser()
      const xml = parser.parseFromString(text, 'text/xml')

      const entries = xml.querySelectorAll('entry')
      const resources: Resource[] = Array.from(entries).map((entry) => {
        const title = entry.querySelector('title')?.textContent || ''
        const summary = entry.querySelector('summary')?.textContent || ''
        const published = entry.querySelector('published')?.textContent || ''
        const authors = Array.from(entry.querySelectorAll('author name')).map(
          (name) => name.textContent || ''
        )
        const arxivId =
          entry.querySelector('id')?.textContent?.split('/abs/').pop() || ''
        const categories = Array.from(
          entry.querySelectorAll('category')
        ).map((cat) => cat.getAttribute('term') || '')

        return {
          id: `arxiv-${arxivId}`,
          type: 'paper' as const,
          title: title.replace(/\n/g, ' ').trim(),
          authors,
          year: new Date(published).getFullYear(),
          venue: 'arXiv',
          discipline: this.mapCategoryToDiscipline(categories[0]) as Resource['discipline'],
          subdiscipline: categories[0],
          tags: categories.slice(0, 5),
          abstract: summary.replace(/\n/g, ' ').trim(),
          preview: summary.replace(/\n/g, ' ').trim().slice(0, 200) + '...',
          externalUrl: `https://arxiv.org/abs/${arxivId}`,
          downloadUrl: `https://arxiv.org/pdf/${arxivId}`,
          citation: this.generateCitations(
            title,
            authors,
            published,
            arxivId
          ),
          addedAt: new Date().toISOString().split('T')[0],
        }
      })

      return {
        data: resources,
        meta: {
          total: resources.length, // arXiv doesn't provide total count easily
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
        },
      }
    } catch (error) {
      return {
        data: [],
        error: `Failed to fetch from arXiv: ${error}`,
      }
    }
  }

  private mapCategoryToDiscipline(category: string): string {
    const mapping: Record<string, string> = {
      'cs.AI': 'computer-science',
      'cs.LG': 'computer-science',
      'cs.CL': 'computer-science',
      'cs.CV': 'computer-science',
      'physics.comp-ph': 'physics',
      'math.NA': 'mathematics',
      'stat.ML': 'computer-science',
    }
    return mapping[category] || 'computer-science'
  }

  private generateCitations(
    title: string,
    authors: string[],
    published: string,
    arxivId: string
  ) {
    const year = new Date(published).getFullYear()
    const authorStr =
      authors.length > 3
        ? `${authors[0]} et al.`
        : authors.join(', ')

    return {
      apa: `${authorStr} (${year}). ${title}. arXiv:${arxivId}`,
      mla: `${authorStr}. "${title}." arXiv preprint arXiv:${arxivId} (${year}).`,
      gbt: `${authorStr}. ${title}[J]. arXiv:${arxivId}, ${year}.`,
      bibtex: `@article{${arxivId.replace(/[^a-zA-Z0-9]/g, '')},\n  title={${title}},\n  author={${authors.join(' and ')}},\n  year={${year}},\n  eprint={${arxivId}},\n  archivePrefix={arXiv}\n}`,
    }
  }

  // Other methods not implemented for search-only provider
  async getResources(): Promise<ApiResponse<Resource[]>> {
    return { data: [], error: 'Use searchResources for arXiv' }
  }

  async getResourceById(): Promise<ApiResponse<Resource | null>> {
    return { data: null, error: 'Not implemented' }
  }

  async getResourcesByDiscipline(): Promise<ApiResponse<Resource[]>> {
    return { data: [], error: 'Not implemented' }
  }

  async getResourcesByType(): Promise<ApiResponse<Resource[]>> {
    return { data: [], error: 'Not implemented' }
  }

  async getStats() {
    return {
      data: { total: 0, byType: {}, byDiscipline: {} },
      error: 'Not implemented',
    }
  }
}
