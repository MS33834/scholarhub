import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { resources } from '@/data/resources'
import { ResourceCard } from '@/components/ResourceCard'
import { useT } from '@/i18n/LangProvider'

const FIELDS_WEIGHT: Array<{ key: keyof (typeof resources)[number]; weight: number }> = [
  { key: 'title', weight: 8 },
  { key: 'venue', weight: 3 },
  { key: 'authors', weight: 2 },
  { key: 'tags', weight: 2 },
  { key: 'subdiscipline', weight: 2 },
  { key: 'abstract', weight: 1 },
  { key: 'preview', weight: 1 },
]

function scoreResource(r: ReturnType<typeof resources.find>, q: string): number {
  if (!r) return 0
  const lower = q.toLowerCase()
  let score = 0
  for (const f of FIELDS_WEIGHT) {
    const value = r[f.key]
    if (!value) continue
    const str = Array.isArray(value) ? value.join(' ') : String(value)
    if (str.toLowerCase().includes(lower)) score += f.weight
  }
  return score
}

export function SearchPage() {
  const { t } = useT()
  const [params] = useSearchParams()
  const q = params.get('q')?.trim() ?? ''

  const results = useMemo(() => {
    if (!q) return []
    return resources
      .map((r) => ({ r, s: scoreResource(r, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.r)
  }, [q])

  if (!q) {
    return (
      <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-moss/10 mb-8">
            <Search className="text-moss" size={40} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink">{t('search.empty.title')}</h1>
          <p className="mt-4 text-lg text-ink-soft max-w-md mx-auto">{t('search.empty.body')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
      <header className="border-b border-rule pb-8">
        <p className="text-sm font-medium text-moss mb-3">
          {t('home.hero.eyebrow')}
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight">
          {t('search.results.title', { q })}
        </h1>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-moss/10 text-moss rounded-md">
          <span className="text-sm font-medium">
            {t('search.results.count', { n: results.length })}
          </span>
        </div>
      </header>

      {results.length === 0 ? (
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-ink-soft/10 mb-8">
            <Search className="text-ink-mute" size={40} />
          </div>
          <p className="text-3xl font-bold text-ink">{t('search.noResults', { q })}</p>
          <Link
            to="/resources"
            className="mt-8 inline-flex items-center gap-2 text-base font-semibold text-moss hover:text-ink transition-colors group"
          >
            {t('home.featured.viewAll')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      ) : (
        <section className="mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
