import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { resources } from '@/data/resources'
import { disciplineMap } from '@/data/disciplines'
import { useT } from '@/i18n/LangProvider'
import { ResourceCard } from '@/components/ResourceCard'
import { formatNumber } from '@/utils/format'
import type { Discipline } from '@/types'

export function DisciplinePage() {
  const { slug } = useParams<{ slug: string }>()
  const { t, lang } = useT()

  const discipline = disciplineMap[slug as Discipline]

  const { list, yearSpan, subdisciplines } = useMemo(() => {
    if (!discipline) return { list: [], yearSpan: '—', subdisciplines: [] }
    const filtered = resources.filter((r) => r.discipline === discipline.slug)
    const years = filtered.map((r) => r.year)
    const span = years.length ? `${Math.min(...years)} – ${Math.max(...years)}` : '—'
    const subs = Array.from(new Set(filtered.map((r) => r.subdiscipline).filter(Boolean)))
    return { list: filtered, yearSpan: span, subdisciplines: subs }
  }, [discipline])

  if (!discipline) {
    return (
      <div className="page-fade mx-auto max-w-column px-6 sm:px-8 py-32 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink">{t('discipline.notFound.title')}</h1>
        <p className="mt-3 text-lg text-ink-soft">{t('discipline.empty')}</p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-moss hover:text-ink transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t('nav.home')}
        </Link>
      </div>
    )
  }

  const name = lang === 'en' ? discipline.nameEn : discipline.name
  const blurb = lang === 'en' ? discipline.blurbEn : discipline.blurb

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-12 pb-32">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-moss transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t('nav.home')}
      </Link>

      <header className="mt-8 border-b border-rule pb-10">
        <div className="flex items-baseline gap-4">
          <span className="text-sm font-medium text-ink-mute w-7 shrink-0">
            {String(discipline.order).padStart(2, '0')}
          </span>
          <p className="text-sm font-medium text-moss">
            {t('nav.resources')}
          </p>
        </div>
        <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.1] tracking-tight">{name}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft max-w-2xl">{blurb}</p>
      </header>

      <section className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 border-b border-rule pb-8">
        <div className="px-2">
          <p className="text-sm font-medium text-ink-mute">
            {t('resources.title')}
          </p>
          <p className="mt-2 text-3xl font-bold text-ink">{formatNumber(list.length)}</p>
        </div>
        <div className="px-2 border-l border-rule">
          <p className="text-sm font-medium text-ink-mute">
            {t('discipline.subdisciplines')}
          </p>
          <p className="mt-2 text-3xl font-bold text-ink">{formatNumber(subdisciplines.length)}</p>
        </div>
        <div className="px-2 border-l border-rule">
          <p className="text-sm font-medium text-ink-mute">
            {t('discipline.yearSpan')}
          </p>
          <p className="mt-2 text-2xl font-bold text-ink">{yearSpan}</p>
        </div>
      </section>

      {list.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-2xl font-semibold text-ink">{t('discipline.empty')}</p>
        </div>
      ) : (
        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((r) => (
            <ResourceCard key={r.id} resource={r} showSummary />
          ))}
        </section>
      )}
    </div>
  )
}
