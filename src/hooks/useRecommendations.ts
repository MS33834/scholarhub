import { useMemo } from 'react'
import { resources } from '@/data/resources'
import type { Resource } from '@/types'

interface RecommendationScore {
  resource: Resource
  score: number
  reasons: string[]
}

interface UseRecommendationsOptions {
  resourceId?: string
  limit?: number
  weights?: {
    sameDiscipline?: number
    sameSubdiscipline?: number
    sharedTags?: number
    sharedAuthors?: number
    citationRelation?: number
    yearProximity?: number
  }
}

export function useRecommendations(options: UseRecommendationsOptions = {}) {
  const {
    resourceId,
    limit = 10,
    weights = {
      sameDiscipline: 30,
      sameSubdiscipline: 20,
      sharedTags: 15,
      sharedAuthors: 25,
      citationRelation: 35,
      yearProximity: 10,
    }
  } = options

  const recommendations = useMemo(() => {
    if (!resourceId) return []

    const targetResource = resources.find(r => r.id === resourceId)
    if (!targetResource) return []

    const scored: RecommendationScore[] = resources
      .filter(r => r.id !== resourceId)
      .map(resource => {
        let score = 0
        const reasons: string[] = []

        // Same discipline
        if (resource.discipline === targetResource.discipline) {
          score += weights.sameDiscipline!
          reasons.push('Same discipline')
        }

        // Same subdiscipline
        if (resource.subdiscipline === targetResource.subdiscipline) {
          score += weights.sameSubdiscipline!
          reasons.push('Same subdiscipline')
        }

        // Shared tags
        const sharedTags = resource.tags.filter(tag => 
          targetResource.tags.includes(tag)
        )
        if (sharedTags.length > 0) {
          const tagScore = Math.min(sharedTags.length * weights.sharedTags!, 45)
          score += tagScore
          reasons.push(`${sharedTags.length} shared tag${sharedTags.length > 1 ? 's' : ''}`)
        }

        // Shared authors
        const sharedAuthors = resource.authors.filter(author =>
          targetResource.authors.includes(author)
        )
        if (sharedAuthors.length > 0) {
          score += weights.sharedAuthors!
          reasons.push(`Same author${sharedAuthors.length > 1 ? 's' : ''}`)
        }

        // Year proximity (closer years get higher score)
        const yearDiff = Math.abs(resource.year - targetResource.year)
        if (yearDiff <= 5) {
          const yearScore = weights.yearProximity! * (1 - yearDiff / 5)
          score += yearScore
          if (yearDiff === 0) {
            reasons.push('Same year')
          } else if (yearDiff <= 2) {
            reasons.push('Similar time period')
          }
        }

        return { resource, score, reasons }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return scored
  }, [resourceId, limit, weights])

  return recommendations
}

// Hook for getting recommendations based on user history
export function useHistoryBasedRecommendations(
  historyResourceIds: string[],
  limit = 10
) {
  const recommendations = useMemo(() => {
    if (historyResourceIds.length === 0) return []

    // Get all tags and disciplines from history
    const historyResources = resources.filter(r => 
      historyResourceIds.includes(r.id)
    )
    
    const tagCounts = new Map<string, number>()
    const disciplineCounts = new Map<string, number>()

    historyResources.forEach(resource => {
      resource.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
      disciplineCounts.set(
        resource.discipline,
        (disciplineCounts.get(resource.discipline) || 0) + 1
      )
    })

    // Score all resources based on history
    const scored: RecommendationScore[] = resources
      .filter(r => !historyResourceIds.includes(r.id))
      .map(resource => {
        let score = 0
        const reasons: string[] = []

        // Match with frequent tags
        resource.tags.forEach(tag => {
          const count = tagCounts.get(tag) || 0
          if (count > 0) {
            score += count * 10
            reasons.push(`Matches your interest in ${tag}`)
          }
        })

        // Match with frequent disciplines
        const disciplineCount = disciplineCounts.get(resource.discipline) || 0
        if (disciplineCount > 0) {
          score += disciplineCount * 15
          reasons.push('Matches your reading history')
        }

        return { resource, score, reasons }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return scored
  }, [historyResourceIds, limit])

  return recommendations
}
