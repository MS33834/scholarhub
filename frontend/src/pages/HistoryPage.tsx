import { useMemo } from 'react'
import { useReadingHistory } from '@/hooks/useReadingHistory'
import { useT } from '@/i18n/useLang'
import { Link } from 'react-router-dom'
import { Trash2, Clock, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'
import { useResources } from '@/hooks/useResources'
import type { ResourceType } from '@/types'

const typeLabelKeys: Record<ResourceType, 'type.paper' | 'type.dataset' | 'type.book' | 'type.tutorial'> = {
  paper: 'type.paper',
  dataset: 'type.dataset',
  book: 'type.book',
  tutorial: 'type.tutorial',
}

export function HistoryPage() {
  const { t } = useT()
  const { history, removeItem, clearHistory } = useReadingHistory()

  const ids = useMemo(() => history.map((item) => item.resourceId), [history])
  const { resources, loading } = useResources({
    filters: { ids, limit: 500 },
    enabled: ids.length > 0,
  })

  const resourceMap = useMemo(() => new Map(resources.map((r) => [r.id, r])), [resources])

  const historyWithResources = useMemo(
    () =>
      history
        .map((item) => ({ ...item, resource: resourceMap.get(item.resourceId) }))
        .filter((item) => item.resource),
    [history, resourceMap]
  )

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t('history.justNow')
    if (diffMins < 60) return t('history.minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('history.hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('history.daysAgo', { count: diffDays })
    return date.toLocaleDateString()
  }

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
      <header className="border-b border-rule pb-8 flex items-baseline justify-between gap-6 flex-wrap">
        <div>
          <p className="text-mono text-[12px] uppercase tracking-wider2 text-moss mb-3">
            {t('home.hero.eyebrow')}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-ink tracking-tight">{t('history.title')}</h1>
          <p className="mt-3 text-lg text-ink-soft">{t('history.subtitle')}</p>
        </div>
        {historyWithResources.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm(t('history.confirm.clear'))) {
                clearHistory()
              }
            }}
            className="text-sm font-medium px-4 py-2 border border-rule rounded-[2px] text-ink-soft hover:text-ochre hover:border-ochre transition-colors"
          >
            {t('history.clearAll')}
          </button>
        )}
      </header>

      {history.length === 0 ? (
        <div className="mt-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-rule rounded-[2px] text-ink-mute mb-8">
            <Clock size={28} />
          </div>
          <p className="font-display text-3xl text-ink">{t('history.empty.title')}</p>
          <p className="mt-3 text-lg text-ink-soft max-w-md mx-auto">{t('history.empty.body')}</p>
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 mt-8 text-base font-medium text-moss hover:text-ink transition-colors group"
          >
            {t('home.featured.viewAll')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      ) : loading ? (
        <section className="mt-10 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </section>
      ) : historyWithResources.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="font-display text-2xl text-ink">{t('history.empty.title')}</p>
        </div>
      ) : (
        <section className="mt-10 space-y-3">
          {historyWithResources.map((item) => (
            <div
              key={item.resourceId}
              className="group relative border border-rule rounded-[2px] p-5 hover:border-ink transition-colors"
            >
              <Link
                to={`/resource/${item.resourceId}`}
                className="block"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl text-ink leading-snug line-clamp-1 group-hover:text-moss transition-colors">
                      {item.resource!.title}
                    </h3>
                    <p className="mt-2 text-sm text-ink-soft line-clamp-1">
                      {item.resource!.authors.join(', ')}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-sm text-ink-mute">
                      <span className="px-2.5 py-1 border border-rule rounded-[2px]">
                        {t(typeLabelKeys[item.resource!.type])}
                      </span>
                      <span>·</span>
                      <span>{item.resource!.year}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatTime(item.timestamp)}
                      </span>
                      {item.visitCount > 1 && (
                        <>
                          <span>·</span>
                          <span className="text-moss font-medium">{t('history.visitedCount', { count: item.visitCount })}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      removeItem(item.resourceId)
                    }}
                    className="shrink-0 p-2 text-ink-mute hover:text-ochre transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={t('history.remove')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </Link>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
