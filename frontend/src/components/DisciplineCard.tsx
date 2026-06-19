import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { Discipline, DisciplineInfo, Resource } from '@/types'
import { disciplines } from '@/data/disciplines'
import { useT } from '@/i18n/useLang'
import { ResourceCard } from '@/components/ResourceCard'
import { useResources } from '@/hooks/useResources'

interface DisciplineCardProps {
  discipline: DisciplineInfo
  previewResources: Resource[]
  total: number
}

const disciplineColors: Record<Discipline, string> = {
  'computer-science': '#4a5d45',
  physics: '#1b4d89',
  'life-sciences': '#6b4c6e',
  mathematics: '#a86b3c',
  'social-sciences': '#7a5c3c',
  humanities: '#5c5348',
}

export function DisciplineCard({ discipline, previewResources, total }: DisciplineCardProps) {
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)

  const name = lang === 'en' ? discipline.nameEn : discipline.name
  const blurb = lang === 'en' ? discipline.blurbEn : discipline.blurb
  const list = previewResources.slice(0, 6)
  const accent = disciplineColors[discipline.slug]
  const panelId = `discipline-panel-${discipline.slug}`

  return (
    <section
      className="border-b border-rule border-l-[3px]"
      style={{ borderLeftColor: accent }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-baseline justify-between gap-6 pt-8 text-left group transition-colors ${open ? 'pb-8' : 'pb-5'}`}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <div className="flex items-baseline gap-5 min-w-0">
          <span className="text-mono text-[12px] uppercase tracking-wider2 text-ink-mute w-7 shrink-0">
            {String(discipline.order).padStart(2, '0')}
          </span>
          <h3 className="font-display text-2xl sm:text-3xl text-ink group-hover:text-moss transition-colors">
            {name}
          </h3>
          <span className="hidden sm:inline text-mono text-[11px] uppercase tracking-wider2 text-ink-mute">
            / {discipline.nameEn}
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-mono text-[11px] uppercase tracking-wider2 text-ink-mute px-3 py-1 bg-rule/15 rounded-full">
            {t('disciplineCard.count', { n: total })}
          </span>
          <ChevronDown
            size={18}
            className={`text-ink-mute group-hover:text-moss transition-[color,transform] duration-200 ease-out ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <p className="text-[15px] leading-7 text-ink-soft pb-3">{blurb}</p>

      <div
        id={panelId}
        className={`collapse-panel ${open ? 'is-open' : ''}`}
      >
        <div className="bg-rule/[0.05] rounded-[2px]">
          <div className="pt-8 pb-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {list.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
          {total > list.length && (
            <Link
              to={`/discipline/${discipline.slug}`}
              className="inline-flex items-center gap-1.5 text-mono text-[11px] uppercase tracking-wider2 text-moss hover:text-ink border-b border-moss hover:border-ink pb-0.5 mb-8 transition-colors group/link"
            >
              {t('disciplineCard.viewAll', { name })}
              <ArrowRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

export function DisciplineList() {
  const { t } = useT()
  const { resources, loading } = useResources({ filters: { limit: 1000 } })

  const byDiscipline = useMemo(() => {
    const map = new Map<string, Resource[]>()
    resources.forEach((r) => {
      const list = map.get(r.discipline) || []
      list.push(r)
      map.set(r.discipline, list)
    })
    return map
  }, [resources])

  return (
    <div>
      {disciplines.map((d) => (
        <DisciplineCard
          key={d.slug}
          discipline={d}
          previewResources={byDiscipline.get(d.slug) || []}
          total={byDiscipline.get(d.slug)?.length || 0}
        />
      ))}
      {loading && (
        <div className="py-8 text-center text-ink-mute">
          {t('admin.loading')}
        </div>
      )}
    </div>
  )
}
