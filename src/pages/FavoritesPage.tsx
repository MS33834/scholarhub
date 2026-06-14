import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, Trash2 } from 'lucide-react'
import { useFavorites } from '@/store'
import { useT } from '@/i18n/LangProvider'
import { ResourceCard } from '@/components/ResourceCard'
import { resources } from '@/data/resources'

export function FavoritesPage() {
  const { ids, remove, clear } = useFavorites()
  const { t } = useT()
  const [busy, setBusy] = useState(false)

  const list = useMemo(() => resources.filter((r) => ids.includes(r.id)), [ids])

  const onExport = () => {
    if (ids.length === 0) return
    const payload = {
      exportedAt: new Date().toISOString(),
      count: list.length,
      resources: list,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scholarhub-favorites-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const onClear = () => {
    if (!window.confirm(t('favorites.confirm.clear'))) return
    setBusy(true)
    clear()
    setBusy(false)
  }

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
      <header className="border-b border-rule pb-8 flex items-baseline justify-between gap-6 flex-wrap">
        <div>
          <p className="text-sm font-medium text-moss mb-3">
            {t('home.hero.eyebrow')}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight">{t('favorites.title')}</h1>
          <p className="mt-3 text-lg text-ink-soft">{t('favorites.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onExport}
            disabled={ids.length === 0}
            className="text-sm font-medium px-4 py-2 border border-rule rounded-lg text-ink-soft hover:text-ink hover:border-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('favorites.export')}
          </button>
          <button
            onClick={onClear}
            disabled={busy || ids.length === 0}
            className="text-sm font-medium px-4 py-2 border border-rule rounded-lg text-ink-soft hover:text-ochre hover:border-ochre disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('favorites.clearAll')}
          </button>
        </div>
      </header>

      {list.length === 0 ? (
        <div className="mt-20 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-moss/10 mb-8">
            <Bookmark className="text-moss" size={40} />
          </div>
          <p className="text-3xl font-bold text-ink">{t('favorites.empty.title')}</p>
          <p className="mt-3 text-lg text-ink-soft max-w-md mx-auto">{t('favorites.empty.body')}</p>
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 mt-8 text-base font-semibold text-moss hover:text-ink transition-colors group"
          >
            {t('home.featured.viewAll')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      ) : (
        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {list.map((r) => (
            <div key={r.id} className="relative">
              <button
                onClick={() => remove(r.id)}
                className="absolute -left-1 -top-1 sm:left-2 sm:top-2 p-2 text-ink-mute hover:text-ochre transition-colors z-10"
                aria-label={t('card.fav.remove')}
                title={t('card.fav.remove.title')}
              >
                <Trash2 size={16} />
              </button>
              <ResourceCard resource={r} />
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
