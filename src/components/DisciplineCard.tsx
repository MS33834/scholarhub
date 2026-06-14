import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { DisciplineInfo } from '@/types'
import { resources } from '@/data/resources'
import { disciplines } from '@/data/disciplines'
import { useT } from '@/i18n/LangProvider'
import { ResourceCard } from '@/components/ResourceCard'

interface DisciplineCardProps {
  discipline: DisciplineInfo
}

export function DisciplineCard({ discipline }: DisciplineCardProps) {
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)

  const { list, total } = useMemo(() => {
    const all = resources.filter((r) => r.discipline === discipline.slug)
    return {
      list: all.slice(0, 6),
      total: all.length,
    }
  }, [discipline.slug])

  const name = lang === 'en' ? discipline.nameEn : discipline.name
  const blurb = lang === 'en' ? discipline.blurbEn : discipline.blurb

  return (
    <section className="border-b border-rule group/section">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-baseline justify-between gap-6 py-8 text-left group transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-baseline gap-5 min-w-0">
          <span className="text-mono text-[12px] uppercase tracking-wider2 text-ink-mute w-7 shrink-0">
            {String(discipline.order).padStart(2, '0')}
          </span>
          <h3 className="text-display text-2xl sm:text-3xl text-ink group-hover:text-moss transition-colors">
            {name}
          </h3>
          <span className="hidden sm:inline text-mono text-[11px] uppercase tracking-wider2 text-ink-mute">
            / {discipline.nameEn}
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-mono text-[11px] uppercase tracking-wider2 text-ink-mute px-2.5 py-1 border border-rule rounded-[2px] bg-ink-soft/5">
            {t('disciplineCard.count', { n: total })}
          </span>
          <ChevronDown
            size={18}
            className="text-ink-mute group-hover:text-moss transition-all"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      <p className="text-[15px] leading-7 text-ink-soft pb-3">{blurb}</p>

      <div className={`collapse-panel ${open ? 'is-open' : ''}`}>
        <div>
          <div className="pt-8 pb-10 grid grid-cols-1 md:grid-cols-2 gap-5">
            {list.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
          {total > list.length && (
            <Link
              to={`/discipline/${discipline.slug}`}
              className="inline-flex items-center gap-1.5 text-mono text-[11px] uppercase tracking-wider2 text-moss hover:text-ink border-b border-moss/50 hover:border-ink pb-0.5 mb-8 transition-all group/link"
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
  return (
    <div>
      {disciplines.map((d) => (
        <DisciplineCard key={d.slug} discipline={d} />
      ))}
    </div>
  )
}
