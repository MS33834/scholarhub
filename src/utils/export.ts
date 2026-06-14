import type { Resource } from '@/types'

// Export formats
export type ExportFormat = 'bibtex' | 'ris' | 'zotero' | 'json'

// Export options
export interface ExportOptions {
  format: ExportFormat
  resources: Resource[]
  filename?: string
}

// Citation formatter class
export class CitationExporter {
  // Export resources to specified format
  export(options: ExportOptions): string {
    const { format, resources } = options

    switch (format) {
      case 'bibtex':
        return this.toBibTeX(resources)
      case 'ris':
        return this.toRIS(resources)
      case 'zotero':
        return this.toZotero(resources)
      case 'json':
        return this.toJSON(resources)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  // Download file to client
  download(options: ExportOptions): void {
    const content = this.export(options)
    const { format, filename } = options
    
    const extension = format === 'zotero' ? 'json' : format
    const defaultFilename = `scholarhub-export-${Date.now()}.${extension}`
    const finalFilename = filename || defaultFilename

    const mimeType = this.getMimeType(format)
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = finalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Get MIME type for format
  private getMimeType(format: ExportFormat): string {
    switch (format) {
      case 'bibtex':
        return 'application/x-bibtex'
      case 'ris':
        return 'application/x-research-info-systems'
      case 'zotero':
      case 'json':
        return 'application/json'
      default:
        return 'text/plain'
    }
  }

  // Convert to BibTeX format
  toBibTeX(resources: Resource[]): string {
    return resources.map((r) => this.resourceToBibTeX(r)).join('\n\n')
  }

  // Convert single resource to BibTeX
  private resourceToBibTeX(resource: Resource): string {
    const type = this.mapTypeToBibTeX(resource.type)
    const key = this.generateCitationKey(resource)

    const fields: string[] = []
    
    // Required fields
    fields.push(`  title = {${resource.title}}`)
    fields.push(`  author = {${resource.authors.join(' and ')}}`)
    fields.push(`  year = {${resource.year}}`)

    // Optional fields
    if (resource.venue) {
      const venueField = resource.type === 'paper' ? 'journal' : 'booktitle'
      fields.push(`  ${venueField} = {${resource.venue}}`)
    }

    if (resource.doi) {
      fields.push(`  doi = {${resource.doi}}`)
    }

    if (resource.downloadUrl || resource.externalUrl) {
      const url = resource.downloadUrl || resource.externalUrl
      fields.push(`  url = {${url}}`)
    }

    if (resource.tags.length > 0) {
      fields.push(`  keywords = {${resource.tags.join(', ')}}`)
    }

    if (resource.abstract) {
      fields.push(`  abstract = {${resource.abstract}}`)
    }

    return `@${type}{${key},\n${fields.join(',\n')}\n}`
  }

  // Map resource type to BibTeX type
  private mapTypeToBibTeX(type: string): string {
    const mapping: Record<string, string> = {
      paper: 'article',
      book: 'book',
      tutorial: 'misc',
      dataset: 'misc',
    }
    return mapping[type] || 'misc'
  }

  // Generate citation key (e.g., "vaswani2017attention")
  private generateCitationKey(resource: Resource): string {
    const firstAuthor = resource.authors[0]?.split(' ').pop()?.toLowerCase() || 'unknown'
    const title = resource.title.split(' ')[0].toLowerCase()
    return `${firstAuthor}${resource.year}${title}`
  }

  // Convert to RIS format
  toRIS(resources: Resource[]): string {
    return resources.map((r) => this.resourceToRIS(r)).join('\n\n')
  }

  // Convert single resource to RIS
  private resourceToRIS(resource: Resource): string {
    const lines: string[] = []

    // Resource type
    lines.push(`TY  - ${this.mapTypeToRIS(resource.type)}`)

    // Title
    lines.push(`TI  - ${resource.title}`)

    // Authors
    resource.authors.forEach((author) => {
      lines.push(`AU  - ${author}`)
    })

    // Year
    lines.push(`PY  - ${resource.year}`)

    // Venue
    if (resource.venue) {
      lines.push(`JO  - ${resource.venue}`)
    }

    // DOI
    if (resource.doi) {
      lines.push(`DO  - ${resource.doi}`)
    }

    // URL
    if (resource.downloadUrl || resource.externalUrl) {
      const url = resource.downloadUrl || resource.externalUrl
      lines.push(`UR  - ${url}`)
    }

    // Keywords
    resource.tags.forEach((tag) => {
      lines.push(`KW  - ${tag}`)
    })

    // Abstract
    if (resource.abstract) {
      lines.push(`AB  - ${resource.abstract}`)
    }

    // End of record
    lines.push('ER  -')

    return lines.join('\n')
  }

  // Map resource type to RIS type
  private mapTypeToRIS(type: string): string {
    const mapping: Record<string, string> = {
      paper: 'JOUR',
      book: 'BOOK',
      tutorial: 'GEN',
      dataset: 'DATA',
    }
    return mapping[type] || 'GEN'
  }

  // Convert to Zotero format (JSON)
  toZotero(resources: Resource[]): string {
    const items = resources.map((r) => this.resourceToZotero(r))
    return JSON.stringify(items, null, 2)
  }

  // Convert single resource to Zotero format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resourceToZotero(resource: Resource): any {
    return {
      itemType: this.mapTypeToZotero(resource.type),
      title: resource.title,
      creators: resource.authors.map((author) => ({
        creatorType: 'author',
        name: author,
      })),
      date: String(resource.year),
      publicationTitle: resource.venue,
      DOI: resource.doi,
      url: resource.downloadUrl || resource.externalUrl,
      tags: resource.tags.map((tag) => ({ tag })),
      abstractNote: resource.abstract,
      accessDate: new Date().toISOString(),
    }
  }

  // Map resource type to Zotero type
  private mapTypeToZotero(type: string): string {
    const mapping: Record<string, string> = {
      paper: 'journalArticle',
      book: 'book',
      tutorial: 'document',
      dataset: 'document',
    }
    return mapping[type] || 'document'
  }

  // Convert to JSON format
  toJSON(resources: Resource[]): string {
    return JSON.stringify(resources, null, 2)
  }
}

// Export singleton instance
export const citationExporter = new CitationExporter()
