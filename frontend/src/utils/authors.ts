import type { Resource } from '@/types'

// Author profile
export interface AuthorProfile {
  name: string
  papers: Resource[]
  totalCitations: number
  hIndex: number
  disciplines: string[]
  tags: string[]
  yearRange: { min: number; max: number }
}

// Author tracker class
export class AuthorTracker {
  private resources: Resource[]

  constructor(resources: Resource[] = []) {
    this.resources = resources
  }

  // Get all unique authors
  getAllAuthors(): string[] {
    const authors = new Set<string>()
    this.resources.forEach((r) => {
      r.authors.forEach((a) => authors.add(a))
    })
    return Array.from(authors).sort()
  }

  // Get author profile by name
  getAuthorProfile(authorName: string): AuthorProfile | null {
    const papers = this.resources.filter((r) =>
      r.authors.some((a) => a.toLowerCase() === authorName.toLowerCase())
    )

    if (papers.length === 0) return null

    const totalCitations = papers.reduce(
      (sum, p) => sum + (p.citations || 0),
      0
    )

    const hIndex = this.calculateHIndex(papers)

    const disciplines = Array.from(
      new Set(papers.map((p) => p.discipline))
    )

    const tags = Array.from(new Set(papers.flatMap((p) => p.tags)))

    const years = papers.map((p) => p.year)
    const yearRange = {
      min: Math.min(...years),
      max: Math.max(...years),
    }

    return {
      name: authorName,
      papers: papers.sort((a, b) => b.year - a.year),
      totalCitations,
      hIndex,
      disciplines,
      tags,
      yearRange,
    }
  }

  // Calculate h-index for an author
  private calculateHIndex(papers: Resource[]): number {
    const citations = papers
      .map((p) => p.citations || 0)
      .sort((a, b) => b - a)

    let h = 0
    for (let i = 0; i < citations.length; i++) {
      if (citations[i] >= i + 1) {
        h = i + 1
      } else {
        break
      }
    }
    return h
  }

  // Get top authors by citation count
  getTopAuthors(limit: number = 10): { name: string; citations: number; papers: number }[] {
    const authorStats = new Map<string, { citations: number; papers: number }>()

    this.resources.forEach((r) => {
      r.authors.forEach((author) => {
        const stats = authorStats.get(author) || { citations: 0, papers: 0 }
        stats.citations += r.citations || 0
        stats.papers += 1
        authorStats.set(author, stats)
      })
    })

    return Array.from(authorStats.entries())
      .map(([name, stats]) => ({
        name,
        citations: stats.citations,
        papers: stats.papers,
      }))
      .sort((a, b) => b.citations - a.citations)
      .slice(0, limit)
  }

  // Get co-authors for a given author
  getCoAuthors(authorName: string): { name: string; count: number }[] {
    const coAuthorCount = new Map<string, number>()

    this.resources.forEach((r) => {
      const isAuthor = r.authors.some(
        (a) => a.toLowerCase() === authorName.toLowerCase()
      )
      if (isAuthor) {
        r.authors.forEach((coAuthor) => {
          if (coAuthor.toLowerCase() !== authorName.toLowerCase()) {
            coAuthorCount.set(
              coAuthor,
              (coAuthorCount.get(coAuthor) || 0) + 1
            )
          }
        })
      }
    })

    return Array.from(coAuthorCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }

  // Search authors by name
  searchAuthors(query: string): string[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllAuthors().filter((author) =>
      author.toLowerCase().includes(lowerQuery)
    )
  }

  // Get author timeline (papers by year)
  getAuthorTimeline(authorName: string): { year: number; count: number }[] {
    const profile = this.getAuthorProfile(authorName)
    if (!profile) return []

    const yearCount = new Map<number, number>()
    profile.papers.forEach((p) => {
      yearCount.set(p.year, (yearCount.get(p.year) || 0) + 1)
    })

    return Array.from(yearCount.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year)
  }
}

// Export singleton instance
export const authorTracker = new AuthorTracker()
