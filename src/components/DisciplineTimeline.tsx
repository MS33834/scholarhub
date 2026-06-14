import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { resources } from '@/data/resources'
import { useT } from '@/i18n/LangProvider'
import type { Resource } from '@/types'

interface TimelineItem {
  year: number
  resources: Resource[]
}

interface DisciplineTimelineProps {
  discipline: string
}

export function DisciplineTimeline({ discipline }: DisciplineTimelineProps) {
  const { t } = useT()
  const timeline = useMemo(() => {
    const filtered = resources.filter(r => r.discipline === discipline)

    // Group resources by year
    const byYear = new Map<number, Resource[]>()
    filtered.forEach(resource => {
      const year = resource.year
      if (!byYear.has(year)) {
        byYear.set(year, [])
      }
      byYear.get(year)!.push(resource)
    })

    // Convert to sorted array
    const timeline: TimelineItem[] = Array.from(byYear.entries())
      .map(([year, resources]) => ({ year, resources }))
      .sort((a, b) => b.year - a.year) // Most recent first

    return timeline
  }, [discipline])

  if (timeline.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-display text-2xl text-ink">{t('discipline.empty')}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-7 sm:left-8 top-0 bottom-0 w-px bg-rule" />

      {/* Timeline items */}
      <div className="space-y-10">
        {timeline.map(({ year, resources: yearResources }) => (
          <div key={year} className="relative pl-20 sm:pl-24">
            {/* Year marker */}
            <div className="absolute left-0 top-0 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-paper border-2 border-moss text-moss font-semibold text-base sm:text-lg">
              {year}
            </div>

            {/* Resources for this year */}
            <div className="space-y-4">
              {yearResources.map(resource => (
                <Link
                  key={resource.id}
                  to={`/resource/${resource.id}`}
                  className="group block p-5 border border-rule rounded-lg hover:border-ink-soft hover:shadow-sm transition-all"
                >
                  <h3 className="text-display text-lg text-ink leading-snug line-clamp-2 group-hover:text-moss transition-colors">
                    {resource.title}
                  </h3>
                  <p className="mt-2 text-[14px] text-ink-soft line-clamp-1">
                    {resource.authors.join(', ')}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-mono text-[10px] uppercase tracking-wider2 text-ink-mute">
                    <span className="px-2 py-0.5 border border-rule rounded-[2px] bg-ink-soft/5">
                      {t(`type.${resource.type}` as const)}
                    </span>
                    {(resource.citations ?? 0) > 0 && (
                      <>
                        <span>·</span>
                        <span>{t('detail.citedBy', { count: String(resource.citations) })}</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
