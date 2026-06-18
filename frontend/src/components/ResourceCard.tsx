import { Link } from 'react-router-dom'
import { ArrowUpRight, Bookmark, BookmarkCheck } from 'lucide-react'
import type { Resource } from '@/types'
import { useFavorites } from '@/hooks/useFavorites'
import { useT } from '@/i18n/useLang'
import { formatAuthors } from '@/utils/format'

interface ResourceCardProps {
  resource: Resource
  showSummary?: boolean
}

export function ResourceCard({ resource, showSummary = false }: ResourceCardProps) {
  const { ids, toggle: toggleFav } = useFavorites()
  const isFav = ids.includes(resource.id)
  const { t } = useT()

  const summary = t('card.summary', {
    type: t(`type.${resource.type}` as const),
    year: resource.year,
    tags: resource.tags.length,
  })

  const actionUrl = resource.downloadUrl || resource.externalUrl || resource.doi
    ? resource.downloadUrl || resource.externalUrl || `https://doi.org/${resource.doi}`
    : undefined

  return (
    <article className="group border border-rule bg-paper p-6 transition-colors duration-200 hover:border-ink">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-2xl leading-snug text-ink">
            <Link
              to={`/resource/${resource.id}`}
              className="transition-colors hover:text-moss"
            >
              {resource.title}
            </Link>
          </h3>
          <p className="text-mono mt-3 text-[13px] text-ink-soft">
            {formatAuthors(resource.authors)}
            <span className="mx-2 text-ink-mute">·</span>
            {resource.year}
            <span className="mx-2 text-ink-mute">·</span>
            <em className="not-italic text-ink-mute">{resource.venue}</em>
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              await toggleFav(resource.id)
            } catch {
              // Error state is already set inside the hook.
            }
          }}
          className="shrink-0 p-2 text-ink-mute transition-colors hover:text-moss"
          aria-label={isFav ? t('card.fav.remove') : t('card.fav.add')}
          title={isFav ? t('card.fav.remove.title') : t('card.fav.add.title')}
        >
          {isFav ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>

      {showSummary && (
        <p className="font-serif mb-4 line-clamp-2 text-[17px] leading-[1.6] text-ink-soft">
          {summary}
        </p>
      )}

      {resource.tags.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {resource.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="border border-ochre/40 px-2 py-0.5 text-[13px] text-ochre transition-colors hover:border-ochre"
            >
              #{tag}
            </span>
          ))}
          {resource.tags.length > 5 && (
            <span className="text-[13px] text-ink-mute">
              +{resource.tags.length - 5}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-rule pt-4">
        <span className="text-mono text-[12px] uppercase tracking-wider2 text-ink-mute">
          {t(`type.${resource.type}` as const)}
        </span>
        {actionUrl ? (
          <a
            href={actionUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-moss"
          >
            {resource.downloadUrl ? t('detail.actions.download') : t('detail.actions.source')}
            <ArrowUpRight size={14} />
          </a>
        ) : (
          <Link
            to={`/resource/${resource.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-moss"
          >
            {t('card.details')}
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
    </article>
  )
}
