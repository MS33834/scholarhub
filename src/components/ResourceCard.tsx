import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react'
import type { Resource } from '@/types'
import { useFavorites } from '@/store'
import { useT } from '@/i18n/useLang'
import { formatAuthors } from '@/utils/format'

interface ResourceCardProps {
  resource: Resource
  showSummary?: boolean
}

export function ResourceCard({ resource, showSummary = false }: ResourceCardProps) {
  const isFav = useFavorites((s) => s.ids.includes(resource.id))
  const toggleFav = useFavorites((s) => s.toggle)
  const { t } = useT()

  const summary = t('card.summary', {
    type: t(`type.${resource.type}` as const),
    year: resource.year,
    tags: resource.tags.length,
  })

  return (
    <article className="group relative border border-rule rounded-xl p-6 bg-paper hover:border-moss/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-xs font-semibold px-3 py-1.5 bg-moss/10 text-moss rounded-lg">
          {t(`type.${resource.type}` as const)} · {resource.year}
        </span>
        <button
          onClick={() => toggleFav(resource.id)}
          className="shrink-0 p-2 text-ink-mute hover:text-moss transition-all rounded-lg hover:bg-moss/10 active:scale-90"
          aria-label={isFav ? t('card.fav.remove') : t('card.fav.add')}
          title={isFav ? t('card.fav.remove.title') : t('card.fav.add.title')}
        >
          {isFav ? <BookmarkCheck size={18} className="fill-moss/20" /> : <Bookmark size={18} />}
        </button>
      </div>

      <h3 className="text-xl font-bold text-ink leading-snug line-clamp-2 mb-3">
        <Link
          to={`/resource/${resource.id}`}
          className="hover:text-moss transition-colors"
        >
          {resource.title}
        </Link>
      </h3>

      <p className="text-sm text-ink-soft line-clamp-1 mb-3">
        {formatAuthors(resource.authors)} · <em className="not-italic text-ink-mute">{resource.venue}</em>
      </p>

      {showSummary && (
        <p className="text-sm leading-relaxed text-ink-mute line-clamp-2 mb-4">
          {summary}
        </p>
      )}

      {resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {resource.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs text-ink-mute px-2.5 py-1 border border-rule rounded-lg bg-ink-soft/5 hover:border-moss/40 hover:text-moss transition-colors cursor-default"
            >
              #{tag}
            </span>
          ))}
          {resource.tags.length > 4 && (
            <span className="text-xs text-ink-mute px-2.5 py-1">
              +{resource.tags.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-end pt-2 border-t border-rule/50">
        <Link
          to={`/resource/${resource.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-moss transition-colors group/link"
        >
          {t('card.details')} <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </article>
  )
}
