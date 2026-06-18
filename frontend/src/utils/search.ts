import FlexSearch from 'flexsearch'
import type { Resource } from '@/types'

// Search index configuration
interface SearchConfig {
  tokenize: 'forward' | 'reverse' | 'full' | 'strict'
  resolution: number
  context: boolean
  suggest: boolean
}

// Field weights for scoring
const FIELD_WEIGHTS = {
  title: 10,
  authors: 8,
  tags: 6,
  abstract: 4,
  venue: 3,
  discipline: 2,
}

// Boolean operators
type BooleanOp = 'AND' | 'OR' | 'NOT'

// Search result with score
export interface SearchResult {
  resource: Resource
  score: number
  highlights: {
    field: string
    snippet: string
  }[]
}

// Advanced search engine class
export class SearchEngine {
  private indexes: Map<string, InstanceType<typeof FlexSearch.Index>> = new Map()
  private resources: Resource[] = []
  private config: SearchConfig

  constructor(config: Partial<SearchConfig> = {}) {
    this.config = {
      tokenize: config.tokenize || 'forward',
      resolution: config.resolution || 9,
      context: config.context ?? true,
      suggest: config.suggest ?? true,
    }
  }

  // Initialize indexes for all searchable fields
  initialize(resources: Resource[]): void {
    this.resources = resources

    // Create index for each field
    const fields = ['title', 'authors', 'tags', 'abstract', 'venue', 'discipline']
    
    fields.forEach(field => {
      const index = new FlexSearch.Index({
        tokenize: this.config.tokenize,
        resolution: this.config.resolution,
        context: this.config.context ? {
          depth: 2,
          resolution: 3,
          bidirectional: true,
        } : false,
        cache: true,
      })

      // Add documents to index
      resources.forEach((resource, idx) => {
        const value = this.getFieldValue(resource, field)
        if (value) {
          index.add(idx, value)
        }
      })

      this.indexes.set(field, index)
    })
  }

  // Get field value from resource
  private getFieldValue(resource: Resource, field: string): string {
    const value = resource[field as keyof Resource]
    if (Array.isArray(value)) {
      return value.join(' ')
    }
    return String(value || '')
  }

  // Parse search query with boolean operators and field specifiers
  parseQuery(query: string): {
    terms: { value: string; field?: string; operator: BooleanOp }[]
  } {
    const terms: { value: string; field?: string; operator: BooleanOp }[] = []
    
    // Split by spaces, but keep quoted strings together
    const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || []
    
    let currentOp: BooleanOp = 'AND'
    
    tokens.forEach(token => {
      // Check for boolean operators
      if (token.toUpperCase() === 'AND') {
        currentOp = 'AND'
        return
      }
      if (token.toUpperCase() === 'OR') {
        currentOp = 'OR'
        return
      }
      if (token.toUpperCase() === 'NOT') {
        currentOp = 'NOT'
        return
      }

      // Check for field specifier (e.g., "title:attention")
      const fieldMatch = token.match(/^(\w+):(.+)$/)
      if (fieldMatch) {
        const [, field, value] = fieldMatch
        terms.push({
          value: value.replace(/"/g, ''),
          field,
          operator: currentOp,
        })
      } else {
        // Regular term
        terms.push({
          value: token.replace(/"/g, ''),
          operator: currentOp,
        })
      }

      // Reset operator for next term
      currentOp = 'AND'
    })

    return { terms }
  }

  // Execute search with advanced features
  search(query: string, limit = 50): SearchResult[] {
    if (!query.trim()) return []

    const { terms } = this.parseQuery(query)
    
    if (terms.length === 0) return []

    // Collect results from all terms
    const resultSets = terms.map(term => {
      const results = this.searchTerm(term.value, term.field)
      return {
        results,
        operator: term.operator,
      }
    })

    // Combine results based on boolean operators
    const finalResults = this.combineResults(resultSets)

    // Sort by score and limit
    finalResults.sort((a, b) => b.score - a.score)
    
    return finalResults.slice(0, limit)
  }

  // Search for a single term
  private searchTerm(term: string, field?: string): Map<number, { score: number; highlights: { field: string; snippet: string }[] }> {
    const results = new Map<number, { score: number; highlights: { field: string; snippet: string }[] }>()

    const fieldsToSearch = field ? [field] : Array.from(this.indexes.keys())

    fieldsToSearch.forEach(searchField => {
      const index = this.indexes.get(searchField)
      if (!index) return

      // Search in index
      const matches = index.search(term) as number[]
      
      const weight = FIELD_WEIGHTS[searchField as keyof typeof FIELD_WEIGHTS] || 1

      matches.forEach(idx => {
        const existing = results.get(idx) || { score: 0, highlights: [] }
        existing.score += weight
        
        // Generate highlight snippet
        const resource = this.resources[idx]
        const value = this.getFieldValue(resource, searchField)
        const snippet = this.generateSnippet(value, term)
        
        existing.highlights.push({
          field: searchField,
          snippet,
        })

        results.set(idx, existing)
      })
    })

    return results
  }

  // Generate highlight snippet
  private generateSnippet(text: string, term: string, contextLength = 50): string {
    const lowerText = text.toLowerCase()
    const lowerTerm = term.toLowerCase()
    const index = lowerText.indexOf(lowerTerm)

    if (index === -1) {
      return text.slice(0, 100) + '...'
    }

    const start = Math.max(0, index - contextLength)
    const end = Math.min(text.length, index + term.length + contextLength)
    
    let snippet = text.slice(start, end)
    if (start > 0) snippet = '...' + snippet
    if (end < text.length) snippet = snippet + '...'

    return snippet
  }

  // Combine results based on boolean operators
  private combineResults(
    resultSets: { results: Map<number, { score: number; highlights: { field: string; snippet: string }[] }>; operator: BooleanOp }[]
  ): SearchResult[] {
    if (resultSets.length === 0) return []

    // Start with first set
    let combined = new Map(resultSets[0].results)

    // Apply subsequent sets with operators
    for (let i = 1; i < resultSets.length; i++) {
      const { results, operator } = resultSets[i]

      if (operator === 'AND') {
        // Intersection
        const newCombined = new Map()
        combined.forEach((value, key) => {
          if (results.has(key)) {
            const other = results.get(key)!
            newCombined.set(key, {
              score: value.score + other.score,
              highlights: [...value.highlights, ...other.highlights],
            })
          }
        })
        combined = newCombined
      } else if (operator === 'OR') {
        // Union
        results.forEach((value, key) => {
          const existing = combined.get(key)
          if (existing) {
            existing.score += value.score
            existing.highlights.push(...value.highlights)
          } else {
            combined.set(key, value)
          }
        })
      } else if (operator === 'NOT') {
        // Subtraction
        results.forEach((_, key) => {
          combined.delete(key)
        })
      }
    }

    // Convert to SearchResult array
    return Array.from(combined.entries()).map(([idx, data]) => ({
      resource: this.resources[idx],
      score: data.score,
      highlights: data.highlights,
    }))
  }

  // Get search suggestions
  suggest(query: string, limit = 5): string[] {
    if (!query.trim()) return []

    const suggestions = new Set<string>()
    const lowerQuery = query.toLowerCase()

    // Suggest from titles
    this.resources.forEach(resource => {
      const title = resource.title.toLowerCase()
      if (title.includes(lowerQuery) && suggestions.size < limit) {
        suggestions.add(resource.title)
      }
    })

    // Suggest from tags
    this.resources.forEach(resource => {
      resource.tags.forEach(tag => {
        if (tag.toLowerCase().includes(lowerQuery) && suggestions.size < limit) {
          suggestions.add(tag)
        }
      })
    })

    return Array.from(suggestions).slice(0, limit)
  }

  // Get statistics
  getStats(): {
    totalResources: number
    totalFields: number
    indexSize: number
  } {
    return {
      totalResources: this.resources.length,
      totalFields: this.indexes.size,
      indexSize: this.resources.length * this.indexes.size,
    }
  }
}

// Create singleton instance
export const searchEngine = new SearchEngine()
