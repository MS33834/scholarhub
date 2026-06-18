import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { ResourceCard } from '@/components/ResourceCard'
import { FilterChips } from '@/components/FilterChips'
import { Skeleton } from '@/components/Skeleton'
import { useResources, useDisciplines } from '@/hooks/useResources'
import { useT } from '@/i18n/useLang'
import type { ResourceType } from '@/types'

type TypeFilter = ResourceType | 'all'
type DisciplineFilter = string // 'all' or Discipline

const typeOrder: ResourceType[] = ['paper', 'dataset', 'book', 'tutorial']

export function ResourcesPage() {
  const { t, lang } = useT()
  const [type, setType] = useState<TypeFilter>('all')
  const [discipline, setDiscipline] = useState<DisciplineFilter>('all')
  const disciplines = useDisciplines()

  const filters = useMemo(
    () => ({
      type: type === 'all' ? undefined : type,
      discipline: discipline === 'all' ? undefined : discipline,
    }),
    [type, discipline]
  )

  const { resources: filtered, loading, error, meta } = useResources({ filters })

  const typeOptions = typeOrder.map((tp) => ({ value: tp, label: t(`type.${tp}` as const) }))
  const disciplineOptions = disciplines.map((d) => ({
    value: d.slug,
    label: lang === 'en' ? d.nameEn : d.name,
  }))

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
      <header className="border-b border-rule pb-8">
        <p className="text-mono text-[12px] uppercase tracking-wider2 text-moss mb-3">
          {t('home.hero.eyebrow')}
        </p>
        <h1 className="font-display text-5xl sm:text-6xl text-ink">{t('resources.title')}</h1>
        <p className="mt-4 text-lg text-ink-soft">{t('resources.subtitle')}</p>
        <p className="mt-4 text-mono text-[12px] uppercase tracking-wider2 text-ink-mute">
          {t('resources.summary', { n: meta?.total ?? filtered.length })}
        </p>
      </header>

      <div className="mt-10 space-y-6">
        <FilterChips
          label={t('resources.filter.type')}
          options={typeOptions}
          value={type}
          onChange={(v) => setType(v as TypeFilter)}
        />
        <FilterChips
          label={t('resources.filter.discipline')}
          options={disciplineOptions}
          value={discipline}
          onChange={(v) => setDiscipline(v)}
        />
      </div>

      <section className="mt-10">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="py-20 text-center text-ink-soft">
            <p>{t('common.errorTitle')}: {error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display text-3xl text-ink">{t('resources.empty')}</p>
            <button
              onClick={() => { setType('all'); setDiscipline('all') }}
              className="mt-8 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-moss transition-colors group"
            >
              {t('type.all')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((r) => <ResourceCard key={r.id} resource={r} />)}
          </div>
        )}
      </section>
    </div>
  )
}
