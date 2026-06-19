import { useMemo, useState } from 'react'
import { ArrowRight, SearchX } from 'lucide-react'
import { ResourceCard } from '@/components/ResourceCard'
import { Skeleton } from '@/components/Skeleton'
import { useResources, useDisciplines } from '@/hooks/useResources'
import { useT } from '@/i18n/useLang'
import type { ResourceType } from '@/types'

type TypeFilter = ResourceType | 'all'
type DisciplineFilter = string // 'all' or Discipline

const typeOrder: ResourceType[] = ['paper', 'dataset', 'book', 'tutorial']

interface ChipOption {
  value: string
  label: string
}

function FilterChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: ChipOption[]
  value: string
  onChange: (v: string) => void
}) {
  const { t } = useT()
  const all: ChipOption[] = [{ value: 'all', label: t('type.all') }, ...options]

  return (
    <div className="flex flex-wrap items-start gap-3">
      <span className="mt-1.5 w-14 shrink-0 text-mono text-[10px] uppercase tracking-wider2 text-ink-mute/80 font-normal">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {all.map((o) => {
          const active = value === o.value
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`shrink-0 rounded-full px-3 py-1 text-[13px] transition-colors ${
                active
                  ? 'bg-rule/50 text-ink border border-transparent'
                  : 'border border-rule text-ink-soft hover:border-moss/60 hover:text-moss'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

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

      <div className="mt-10 space-y-5">
        <FilterChipGroup
          label={t('resources.filter.type')}
          options={typeOptions}
          value={type}
          onChange={(v) => setType(v as TypeFilter)}
        />
        <FilterChipGroup
          label={t('resources.filter.discipline')}
          options={disciplineOptions}
          value={discipline}
          onChange={(v) => setDiscipline(v)}
        />
      </div>

      <section className="mt-12">
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
          <div className="py-16 text-center">
            <div className="inline-flex flex-col items-center rounded-[2px] border border-rule bg-paper px-10 py-12">
              <SearchX className="text-ink-mute mb-5" size={40} strokeWidth={1} />
              <p className="font-display text-3xl text-ink">{t('resources.empty')}</p>
              <button
                onClick={() => { setType('all'); setDiscipline('all') }}
                className="mt-8 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-moss transition-colors group"
              >
                {t('type.all')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
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
