import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Bookmark, BookmarkCheck } from 'lucide-react'
import type { Resource, Discipline } from '@/types'
import { useFavorites } from '@/hooks/useFavorites'
import { useT } from '@/i18n/useLang'
import { formatAuthors } from '@/utils/format'

interface ResourceCardProps {
  resource: Resource
  showSummary?: boolean
}

const disciplineBandClass: Record<Discipline, string> = {
  'computer-science': 'border-l-[#4a5d45]',
  physics: 'border-l-[#1b4d89]',
  'life-sciences': 'border-l-[#6b4c6e]',
  mathematics: 'border-l-[#a86b3c]',
  'social-sciences': 'border-l-[#7a5c3c]',
  humanities: 'border-l-[#5c5348]',
}

export function ResourceCard({ resource, showSummary = false }: ResourceCardProps) {
  const { ids, toggle: toggleFav } = useFavorites()
  const isFav = ids.includes(resource.id)
  const { t } = useT()
  const [ping, setPing] = useState(false)

  useEffect(() => {
    if (!ping) return
    const timeoutId = setTimeout(() => setPing(false), 350)
    return () => clearTimeout(timeoutId)
  }, [ping])

  const summary = t('card.summary', {
    type: t(`type.${resource.type}` as const),
    year: resource.year,
    tags: resource.tags.length,
  })

  const actionUrl = resource.downloadUrl || resource.externalUrl || resource.doi
    ? resource.downloadUrl || resource.externalUrl || `https://doi.org/${resource.doi}`
    : undefined

  const bandClass = disciplineBandClass[resource.discipline] ?? 'border-l-ochre'

  return (
    <article
      className={`group overflow-hidden rounded-sm border border-rule bg-white p-6 shadow-[0_1px_2px_rgba(31,26,20,0.04),0_2px_8px_rgba(31,26,20,0.06)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:border-ink-mute hover:shadow-[0_4px_12px_rgba(31,26,20,0.08),0_8px_24px_rgba(31,26,20,0.10)] border-l-[3px] ${bandClass}`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-2xl leading-snug text-ink">
            <Link
              to={`/resource/${resource.id}`}
              className="transition-colors hover:text-moss focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-moss focus-visible:outline-offset-[3px]"
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
            setPing(true)
            try {
              await toggleFav(resource.id)
            } catch {
              // Error state is already set inside the hook.
            }
          }}
          className="relative shrink-0 p-2 text-ink-mute transition-colors hover:text-moss focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-moss focus-visible:outline-offset-[3px]"
          aria-label={isFav ? t('card.fav.remove') : t('card.fav.add')}
          title={isFav ? t('card.fav.remove.title') : t('card.fav.add.title')}
          aria-pressed={isFav}
          type="button"
        >
          {ping && (
            <span
              className="pointer-events-none absolute -inset-1 rounded-full border border-[#d4af37] animate-ping"
              aria-hidden="true"
            />
          )}
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
              className="inline-flex items-center rounded-full border border-ochre px-2.5 py-0.5 text-[13px] text-ochre transition-colors hover:bg-ochre-soft/20 hover:text-ink"
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
            aria-label={resource.downloadUrl ? t('detail.actions.download') : t('detail.actions.source')}
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-moss focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-moss focus-visible:outline-offset-[3px]"
          >
            {resource.downloadUrl ? t('detail.actions.download') : t('detail.actions.source')}
            <ArrowUpRight size={14} />
          </a>
        ) : (
          <Link
            to={`/resource/${resource.id}`}
            aria-label={t('card.details')}
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-moss focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-moss focus-visible:outline-offset-[3px]"
          >
            {t('card.details')}
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
    </article>
  )
}
