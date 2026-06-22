import { useState, useMemo, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Copy,
  Download,
} from 'lucide-react'
import { useUI } from '@/store'
import { useFavorites } from '@/hooks/useFavorites'
import { useReadingHistory } from '@/hooks/useReadingHistory'
import { useT } from '@/i18n/useLang'
import { ResourceCard } from '@/components/ResourceCard'
import { AddToListDropdown } from '@/components/AddToListDropdown'
import { Skeleton } from '@/components/Skeleton'
import { useResource, useResources } from '@/hooks/useResources'
import { formatAuthors, formatNumber } from '@/utils/format'
import type { ResourceType } from '@/types'

const typeLabelKeys: Record<ResourceType, 'type.paper' | 'type.dataset' | 'type.book' | 'type.tutorial'> = {
  paper: 'type.paper',
  dataset: 'type.dataset',
  book: 'type.book',
  tutorial: 'type.tutorial',
}

const citeKey: Record<'apa' | 'mla' | 'gbt' | 'bibtex', 'detail.cite.apa' | 'detail.cite.mla' | 'detail.cite.gbt' | 'detail.cite.bibtex'> = {
  apa: 'detail.cite.apa',
  mla: 'detail.cite.mla',
  gbt: 'detail.cite.gbt',
  bibtex: 'detail.cite.bibtex',
}

const citeDisplay: Record<'apa' | 'mla' | 'gbt' | 'bibtex', string> = {
  apa: 'APA',
  mla: 'MLA',
  gbt: 'GB/T 7714',
  bibtex: 'BibTeX',
}

const cardRaised =
  'bg-paper border border-rule rounded-[2px] shadow-[0_2px_8px_rgba(31,26,20,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(31,26,20,0.08)]'

export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const showToast = useUI((s) => s.showToast)
  const { ids, toggle: toggleFav } = useFavorites()
  const isFav = ids.includes(id ?? '')
  const { addVisit } = useReadingHistory()
  const { t } = useT()
  const [showAbstract, setShowAbstract] = useState(true)
  const [showAllCites, setShowAllCites] = useState(false)

  const { resource, loading, error } = useResource(id)
  const { resources: relatedCandidates } = useResources({
    filters: { limit: 50 },
    enabled: Boolean(resource),
  })

  // 记录阅读历史
  useEffect(() => {
    if (!resource || !id) return
    let cancelled = false
    addVisit(id, resource.title, resource.authors).catch(() => {
      if (!cancelled) {
        // History recording is best-effort; do not block the UI.
      }
    })
    return () => {
      cancelled = true
    }
  }, [id, resource, addVisit])

  const { related, citeFormats } = useMemo(() => {
    if (!resource) return { related: [], citeFormats: [] }

    const rel = relatedCandidates
      .filter((r) => r.id !== resource.id && (r.discipline === resource.discipline || r.tags.some((tag) => resource.tags.includes(tag))))
      .slice(0, 3)

    const formats = [
      { kind: 'apa' as const, text: resource.citation.apa },
      { kind: 'mla' as const, text: resource.citation.mla },
      { kind: 'gbt' as const, text: resource.citation.gbt },
      { kind: 'bibtex' as const, text: resource.citation.bibtex },
    ]

    return { related: rel, citeFormats: formats }
  }, [resource, relatedCandidates])

  if (loading) {
    return (
      <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-12 pb-32">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-8 h-16 w-full" />
        <Skeleton className="mt-4 h-6 w-2/3" />
        <Skeleton className="mt-12 h-48 w-full" />
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div className="page-fade mx-auto max-w-column px-6 sm:px-8 py-32 text-center">
        <h1 className="font-display text-3xl text-ink">{t('detail.notFound.title')}</h1>
        <p className="mt-3 text-lg text-ink-soft">{error || t('detail.notFound.body')}</p>
        <Link
          to="/resources"
          className="mt-8 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-moss transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t('detail.back')}
        </Link>
      </div>
    )
  }

  const onFav = async () => {
    if (!id) return
    const wasFav = isFav
    try {
      await toggleFav(id)
      showToast(wasFav ? t('toast.fav.removed') : t('toast.fav.added'))
    } catch {
      showToast(t('common.errorBody'))
    }
  }

  const copy = async (kind: 'apa' | 'mla' | 'gbt' | 'bibtex', text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast(t('toast.cite.copied', { format: citeDisplay[kind] }))
    } catch {
      showToast(t('toast.cite.failed'))
    }
  }

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-12 pb-32">
      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-sm text-ink-mute">
        <Link to="/" className="hover:text-moss transition-colors">
          {t('nav.home')}
        </Link>
        <span>/</span>
        <Link to="/resources" className="hover:text-moss transition-colors">
          {t('nav.resources')}
        </Link>
        <span>/</span>
        <Link
          to={`/discipline/${resource.discipline}`}
          className="hover:text-moss transition-colors"
        >
          {resource.discipline}
        </Link>
        <span>/</span>
        <span className="text-ink truncate max-w-[200px]" title={resource.title}>
          {resource.title}
        </span>
      </nav>

      <header className="mt-8 border-b border-rule pb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-mono text-[12px] uppercase tracking-wider2 text-moss border border-moss/30 px-2 py-1">
            {t(typeLabelKeys[resource.type])}
          </span>
          <span className="text-mono text-[13px] text-ink-mute">
            {resource.year}
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.15]">
          {resource.title}
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-mono text-[13px]">
          <p className="text-ink-soft">
            {formatAuthors(resource.authors)}
          </p>
          <span className="text-ink-mute">·</span>
          <p className="text-ink-soft">
            {resource.venue}
          </p>
          {resource.doi && (
            <>
              <span className="text-ink-mute">·</span>
              <a
                href={`https://doi.org/${resource.doi}`}
                target="_blank"
                rel="noreferrer"
                className="text-moss underline decoration-1 underline-offset-4 hover:text-ink transition-colors"
              >
                DOI: {resource.doi}
              </a>
            </>
          )}
        </div>
        {resource.citations !== undefined && (
          <p className="mt-4 text-mono text-[12px] uppercase tracking-wider2 text-ink-mute">
            {t('detail.citedBy', { count: formatNumber(resource.citations) ?? '0' })}
          </p>
        )}
      </header>

      {/* 摘要折叠区 */}
      <section className="mt-14 border-y border-rule">
        <button
          onClick={() => setShowAbstract((v) => !v)}
          className="w-full flex items-center justify-between py-5 text-left group"
        >
          <span className="text-mono text-[12px] uppercase tracking-wider2 text-ink">{t('detail.abstract.toggle')}</span>
          <ChevronDown
            size={18}
            className="text-ink-mute group-hover:text-moss transition-all"
            style={{ transform: showAbstract ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
        <div className={`collapse-panel ${showAbstract ? 'is-open' : ''}`}>
          <div>
            <div className="bg-rule/20 border-l-4 border-moss p-6 rounded-[2px]">
              <p
                className="font-serif text-lg leading-[1.8] text-ink-soft indent-2em"
                style={{ textAlign: 'justify' }}
              >
                {resource.abstract}
              </p>
            </div>
          </div>
        </div>
        <div className="py-5 flex flex-wrap items-center gap-2 border-t border-rule">
          <span className="text-mono text-[12px] uppercase tracking-wider2 text-ink-mute mr-1">
            {t('detail.tags')}
          </span>
          {resource.tags.map((tag) => (
            <span
              key={tag}
              className="border border-ochre/40 px-2 py-0.5 text-[13px] text-ochre transition-colors hover:border-ochre"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* 操作区 - 5 按钮 */}
      <section className="mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {resource.downloadUrl && (
          <a
            href={resource.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-center gap-2 border border-moss px-4 py-3.5 text-sm text-moss transition-colors duration-200 hover:bg-moss hover:text-paper"
          >
            <Download size={16} /> {t('detail.actions.download')}
          </a>
        )}
        {resource.doi ? (
          <a
            href={`https://doi.org/${resource.doi}`}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-center gap-2 border border-rule px-4 py-3.5 text-sm text-ink-soft transition-colors duration-200 hover:border-ink hover:text-ink"
          >
            <ArrowUpRight size={16} /> {t('detail.actions.doi')}
          </a>
        ) : resource.externalUrl ? (
          <a
            href={resource.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-center gap-2 border border-rule px-4 py-3.5 text-sm text-ink-soft transition-colors duration-200 hover:border-ink hover:text-ink"
          >
            <ArrowUpRight size={16} /> {t('detail.actions.source')}
          </a>
        ) : (
          <span
            className="flex items-center justify-center gap-2 border border-rule px-4 py-3.5 text-sm text-ink-mute opacity-50 cursor-not-allowed"
          >
            <ArrowUpRight size={16} /> {t('detail.actions.nolink')}
          </span>
        )}
        <button
          onClick={() => copy('apa', resource.citation.apa)}
          className="group flex items-center justify-center gap-2 border border-rule px-4 py-3.5 text-sm text-ink-soft transition-colors duration-200 hover:border-ink hover:text-ink"
        >
          <Copy size={16} /> {t('detail.actions.copy')}
        </button>
        <button
          onClick={onFav}
          className={`group flex items-center justify-center gap-2 border px-4 py-3.5 text-sm transition-colors duration-200 ${
            isFav
              ? 'border-moss text-moss hover:bg-moss hover:text-paper'
              : 'border-rule text-ink-soft hover:border-ink hover:text-ink'
          }`}
        >
          {isFav ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          {isFav ? t('detail.actions.saved') : t('detail.actions.save')}
        </button>
        <AddToListDropdown resourceId={resource.id} variant="button" />
      </section>

      {/* 外部链接次要入口 */}
      {resource.externalUrl && resource.doi && resource.externalUrl !== resource.downloadUrl && (
        <p className="mt-3 text-sm text-ink-mute">
          {t('detail.also')}{' '}
          <a
            href={resource.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-moss hover:text-ink transition-colors underline decoration-1 underline-offset-4"
          >
            {(() => { try { return new URL(resource.externalUrl).hostname } catch { return resource.externalUrl } })()}
          </a>
        </p>
      )}

      {/* 引用区 */}
      <section className="mt-20">
        <div className="flex items-center justify-between mb-6 border-b border-rule pb-3">
          <h2 className="font-display text-2xl text-ink">{t('detail.cite.title')}</h2>
          <span className="text-mono text-[12px] uppercase tracking-wider2 text-ink-mute">
            {citeFormats.length} formats
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {citeFormats.map(({ kind }) => (
            <button
              key={kind}
              onClick={() => copy(kind, resource.citation[kind])}
              className={`group flex items-center justify-center gap-2 px-4 py-3.5 text-sm text-ink-soft hover:text-moss ${cardRaised}`}
            >
              <Copy size={16} /> {t(citeKey[kind])}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAllCites((v) => !v)}
          className="mt-6 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-moss border-b border-ink-soft/50 hover:border-moss pb-0.5 transition-colors group"
        >
          {t('detail.cite.previewAll')}
          <ChevronDown
            size={14}
            className="transition-transform group-hover:text-moss"
            style={{ transform: showAllCites ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
        <div className={`collapse-panel ${showAllCites ? 'is-open' : ''}`}>
          <div>
            <div className="mt-6 space-y-5">
              {citeFormats.map(({ kind, text }) => (
                <div
                  key={kind}
                  className={`group p-5 ${cardRaised}`}
                >
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-rule">
                    <span className="text-mono text-[12px] uppercase tracking-wider2 text-moss">
                      {citeDisplay[kind]}
                    </span>
                    <button
                      onClick={() => copy(kind, text)}
                      className="text-sm text-ink-mute hover:text-moss transition-colors flex items-center gap-1"
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <pre className="bg-transparent text-sm leading-relaxed text-ink-soft whitespace-pre-wrap break-words font-mono">
                    {text}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 相关资源 */}
      {related.length > 0 && (
        <section className="mt-24">
          <div className="flex items-center justify-between mb-6 border-b border-rule pb-3">
            <h2 className="font-display text-2xl text-ink">
              {t('detail.related.title')}
            </h2>
            <span className="text-mono text-[12px] uppercase tracking-wider2 text-ink-mute">
              {related.length} resources
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {related.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
