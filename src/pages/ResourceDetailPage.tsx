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
import { resources } from '@/data/resources'
import { useFavorites, useUI } from '@/store'
import { useReadingHistory } from '@/store/readingHistory'
import { useT } from '@/i18n/useLang'
import { ResourceCard } from '@/components/ResourceCard'
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

export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const showToast = useUI((s) => s.showToast)
  const isFav = useFavorites((s) => s.ids.includes(id ?? ''))
  const toggleFav = useFavorites((s) => s.toggle)
  const { t } = useT()
  const [showAbstract, setShowAbstract] = useState(true)
  const [showAllCites, setShowAllCites] = useState(false)
  const addVisit = useReadingHistory((s) => s.addVisit)

  const resource = resources.find((r) => r.id === id)

  // 记录阅读历史
  useEffect(() => {
    if (resource && id) {
      addVisit(id, resource.title, resource.authors)
    }
  }, [id, resource, addVisit])

  const { related, citeFormats } = useMemo(() => {
    if (!resource) return { related: [], citeFormats: [] }
    
    const rel = resources
      .filter((r) => r.id !== resource.id && (r.discipline === resource.discipline || r.tags.some((tag) => resource.tags.includes(tag))))
      .slice(0, 3)
    
    const formats = [
      { kind: 'apa' as const, text: resource.citation.apa },
      { kind: 'mla' as const, text: resource.citation.mla },
      { kind: 'gbt' as const, text: resource.citation.gbt },
      { kind: 'bibtex' as const, text: resource.citation.bibtex },
    ]
    
    return { related: rel, citeFormats: formats }
  }, [resource])

  if (!resource) {
    return (
      <div className="page-fade mx-auto max-w-column px-6 sm:px-8 py-32 text-center">
        <h1 className="text-3xl font-bold text-ink">{t('detail.notFound.title')}</h1>
        <p className="mt-3 text-lg text-ink-soft">{t('detail.notFound.body')}</p>
        <Link
          to="/resources"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-moss transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t('detail.back')}
        </Link>
      </div>
    )
  }

  const onFav = () => {
    if (!id) return
    const wasFav = isFav
    toggleFav(id)
    showToast(wasFav ? t('toast.fav.removed') : t('toast.fav.added'))
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
      <Link
        to="/resources"
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-moss transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t('detail.back')}
      </Link>

      <header className="mt-8 border-b border-rule pb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold px-3 py-1.5 bg-moss/10 text-moss rounded-md">
            {t(typeLabelKeys[resource.type])}
          </span>
          <span className="text-sm font-medium text-ink-mute">
            {resource.year}
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.15] tracking-tight">
          {resource.title}
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-lg">
          <p className="text-ink-soft">
            {formatAuthors(resource.authors)}
          </p>
          <span className="text-ink-mute">·</span>
          <p className="text-ink-soft italic">
            {resource.venue}
          </p>
        </div>
        {resource.citations !== undefined && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-moss/10 text-moss rounded-md">
            <span className="text-sm font-medium">
              {t('detail.citedBy', { count: formatNumber(resource.citations) ?? '0' })}
            </span>
          </div>
        )}
      </header>

      {/* 摘要折叠区 */}
      <section className="mt-12 border-y border-rule">
        <button
          onClick={() => setShowAbstract((v) => !v)}
          className="w-full flex items-center justify-between py-5 text-left group"
        >
          <span className="text-xl font-semibold text-ink">{t('detail.abstract.toggle')}</span>
          <ChevronDown
            size={20}
            className="text-ink-mute group-hover:text-moss transition-all"
            style={{ transform: showAbstract ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
        <div className={`collapse-panel ${showAbstract ? 'is-open' : ''}`}>
          <div>
            <p
              className="text-lg leading-relaxed text-ink-soft pb-8"
              style={{ textAlign: 'justify' }}
            >
              {resource.abstract}
            </p>
          </div>
        </div>
        <div className="py-5 flex flex-wrap items-center gap-2 border-t border-rule">
          <span className="text-sm font-medium text-ink-mute mr-1">
            {t('detail.tags')}
          </span>
          {resource.tags.map((tag) => (
            <span
              key={tag}
              className="text-sm px-3 py-1 border border-ochre/40 text-ochre rounded-md bg-ochre/5 hover:bg-ochre/10 transition-colors cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* 操作区 - 4 按钮 */}
      <section className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {resource.downloadUrl && (
          <a
            href={resource.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-center gap-2 py-3.5 px-4 border border-moss/30 rounded-lg text-sm font-medium text-moss bg-moss/5 hover:bg-moss hover:text-paper hover:border-moss transition-all duration-200"
          >
            <Download size={16} className="group-hover:scale-110 transition-transform" /> {t('detail.actions.download')}
          </a>
        )}
        {resource.doi ? (
          <a
            href={`https://doi.org/${resource.doi}`}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-center gap-2 py-3.5 px-4 border border-rule rounded-lg text-sm font-medium text-ink-soft hover:text-ink hover:border-ink transition-all duration-200"
          >
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> {t('detail.actions.doi')}
          </a>
        ) : resource.externalUrl ? (
          <a
            href={resource.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-center gap-2 py-3.5 px-4 border border-rule rounded-lg text-sm font-medium text-ink-soft hover:text-ink hover:border-ink transition-all duration-200"
          >
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> {t('detail.actions.source')}
          </a>
        ) : (
          <span
            className="flex items-center justify-center gap-2 py-3.5 px-4 border border-rule rounded-lg text-sm font-medium text-ink-mute opacity-50 cursor-not-allowed"
          >
            <ArrowUpRight size={16} /> {t('detail.actions.nolink')}
          </span>
        )}
        <button
          onClick={() => copy('apa', resource.citation.apa)}
          className="group flex items-center justify-center gap-2 py-3.5 px-4 border border-rule rounded-lg text-sm font-medium text-ink-soft hover:text-ink hover:border-ink transition-all duration-200"
        >
          <Copy size={16} className="group-hover:scale-110 transition-transform" /> {t('detail.actions.copy')}
        </button>
        <button
          onClick={onFav}
          className={`group flex items-center justify-center gap-2 py-3.5 px-4 border rounded-lg text-sm font-medium transition-all duration-200 ${
            isFav
              ? 'border-moss/30 text-moss bg-moss/5 hover:bg-moss hover:text-paper'
              : 'border-rule text-ink-soft hover:text-ink hover:border-ink'
          }`}
        >
          {isFav ? <BookmarkCheck size={16} className="group-hover:scale-110 transition-transform" /> : <Bookmark size={16} className="group-hover:scale-110 transition-transform" />}
          {isFav ? t('detail.actions.saved') : t('detail.actions.save')}
        </button>
      </section>

      {/* 外部链接次要入口 */}
      {resource.externalUrl && resource.doi && resource.externalUrl !== resource.downloadUrl && (
        <p className="mt-3 text-sm text-ink-mute">
          {t('detail.also')}{' '}
          <a
            href={resource.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-1 underline-offset-4 hover:text-moss transition-colors"
          >
            {(() => { try { return new URL(resource.externalUrl).hostname } catch { return resource.externalUrl } })()}
          </a>
        </p>
      )}

      {/* 引用区 */}
      <section className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-ink">{t('detail.cite.title')}</h2>
          <span className="text-sm text-ink-mute">
            {citeFormats.length} formats
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {citeFormats.map(({ kind }) => (
            <button
              key={kind}
              onClick={() => copy(kind, resource.citation[kind])}
              className="group flex items-center justify-center gap-2 py-3.5 px-4 border border-rule rounded-lg text-sm font-medium text-ink-soft hover:text-moss hover:border-moss/50 transition-all duration-200"
            >
              <Copy size={16} className="group-hover:scale-110 transition-transform" /> {t(citeKey[kind])}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAllCites((v) => !v)}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-moss border-b border-ink-soft/50 hover:border-moss pb-0.5 transition-all group"
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
            <div className="mt-5 space-y-4">
              {citeFormats.map(({ kind, text }) => (
                <div
                  key={kind}
                  className="group relative border border-rule rounded-lg p-5 hover:border-moss/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-rule">
                    <span className="text-sm font-semibold text-moss">
                      {citeDisplay[kind]}
                    </span>
                    <button
                      onClick={() => copy(kind, text)}
                      className="text-sm font-medium text-ink-mute hover:text-moss transition-colors flex items-center gap-1"
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
        <section className="mt-20">
          <div className="flex items-center justify-between mb-8 border-b border-rule pb-4">
            <h2 className="text-2xl font-bold text-ink">
              {t('detail.related.title')}
            </h2>
            <span className="text-sm text-ink-mute">
              {related.length} resources
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
