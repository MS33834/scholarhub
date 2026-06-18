import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ResourceCard } from '@/components/ResourceCard'
import { Skeleton } from '@/components/Skeleton'
import { useT } from '@/i18n/useLang'
import { useResources } from '@/hooks/useResources'

export function SearchPage() {
  const { t } = useT()
  const [params] = useSearchParams()
  const q = params.get('q')?.trim() ?? ''

  const { resources: results, loading, error } = useResources({
    filters: { q, limit: 200 },
    enabled: Boolean(q),
  })

  if (!q) {
    return (
      <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
        <div className="py-20 text-center">
          <Search className="mx-auto text-ink-mute mb-6" size={40} strokeWidth={1} />
          <h1 className="font-display text-3xl sm:text-4xl text-ink">{t('search.empty.title')}</h1>
          <p className="mt-4 text-lg text-ink-soft max-w-md mx-auto">{t('search.empty.body')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
      <header className="border-b border-rule pb-8">
        <p className="text-mono text-[12px] uppercase tracking-wider2 text-moss mb-3">
          {t('home.hero.eyebrow')}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink">
          {t('search.results.title', { q })}
        </h1>
        <p className="mt-4 text-mono text-[12px] uppercase tracking-wider2 text-ink-mute">
          {loading ? '…' : t('search.results.count', { n: results.length })}
        </p>
      </header>

      {loading && (
        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </section>
      )}

      {!loading && error && (
        <div className="py-20 text-center">
          <p className="text-ink-soft">{t('common.errorTitle')}: {error}</p>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="py-20 text-center">
          <Search className="mx-auto text-ink-mute mb-6" size={40} strokeWidth={1} />
          <p className="font-display text-3xl text-ink">{t('search.noResults', { q })}</p>
          <Link
            to="/resources"
            className="mt-8 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-moss transition-colors group"
          >
            {t('home.featured.viewAll')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <section className="mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
