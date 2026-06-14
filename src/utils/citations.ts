import type { Resource } from '@/types'

// Citation graph node
export interface CitationNode {
  id: string
  title: string
  authors: string[]
  year: number
  citations?: number
}

// Citation relationship
export interface CitationEdge {
  from: string
  to: string
}

// Citation graph
export interface CitationGraph {
  nodes: CitationNode[]
  edges: CitationEdge[]
}

// Citation tracker class
export class CitationTracker {
  private resources: Resource[]

  constructor(resources: Resource[] = []) {
    this.resources = resources
  }

  // Get papers that cite a given paper (papers that reference it)
  getCitations(paperId: string): CitationNode[] {
    const paper = this.resources.find((r) => r.id === paperId)
    if (!paper) return []

    // Find papers that have similar tags or are in the same field
    // In a real implementation, this would use actual citation data
    return this.resources
      .filter((r) => {
        if (r.id === paperId) return false
        // Check if papers share tags or are in the same discipline
        const sharedTags = r.tags.filter((tag) => paper.tags.includes(tag))
        return sharedTags.length > 0 && r.year >= paper.year
      })
      .map((r) => ({
        id: r.id,
        title: r.title,
        authors: r.authors,
        year: r.year,
        citations: r.citations,
      }))
      .sort((a, b) => (b.citations || 0) - (a.citations || 0))
  }

  // Get papers that a given paper references (papers it cites)
  getReferences(paperId: string): CitationNode[] {
    const paper = this.resources.find((r) => r.id === paperId)
    if (!paper) return []

    // Find older papers in the same field
    return this.resources
      .filter((r) => {
        if (r.id === paperId) return false
        const sharedTags = r.tags.filter((tag) => paper.tags.includes(tag))
        return sharedTags.length > 0 && r.year < paper.year
      })
      .map((r) => ({
        id: r.id,
        title: r.title,
        authors: r.authors,
        year: r.year,
        citations: r.citations,
      }))
      .sort((a, b) => b.year - a.year)
  }

  // Build citation graph for a paper
  buildCitationGraph(
    paperId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _depth: number = 1
  ): CitationGraph {
    const nodes: Map<string, CitationNode> = new Map()
    const edges: CitationEdge[] = []

    const paper = this.resources.find((r) => r.id === paperId)
    if (!paper) return { nodes: [], edges: [] }

    // Add the paper itself
    nodes.set(paperId, {
      id: paper.id,
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      citations: paper.citations,
    })

    // Add citations and references
    const citations = this.getCitations(paperId)
    const references = this.getReferences(paperId)

    citations.forEach((c) => {
      nodes.set(c.id, c)
      edges.push({ from: c.id, to: paperId })
    })

    references.forEach((r) => {
      nodes.set(r.id, r)
      edges.push({ from: paperId, to: r.id })
    })

    return {
      nodes: Array.from(nodes.values()),
      edges,
    }
  }

  // Get citation count for a paper
  getCitationCount(paperId: string): number {
    return this.getCitations(paperId).length
  }

  // Get most cited papers
  getMostCited(limit: number = 10): CitationNode[] {
    return this.resources
      .map((r) => ({
        id: r.id,
        title: r.title,
        authors: r.authors,
        year: r.year,
        citations: r.citations,
      }))
      .sort((a, b) => (b.citations || 0) - (a.citations || 0))
      .slice(0, limit)
  }

  // Get citation timeline for a field/discipline
  getCitationTimeline(discipline: string): CitationNode[] {
    return this.resources
      .filter((r) => r.discipline === discipline)
      .map((r) => ({
        id: r.id,
        title: r.title,
        authors: r.authors,
        year: r.year,
        citations: r.citations,
      }))
      .sort((a, b) => a.year - b.year)
  }
}

// Export singleton instance
export const citationTracker = new CitationTracker()
