import { useT } from '@/i18n/LangProvider'

interface FilterChipsProps {
  /** Small uppercase group label, rendered above the chips on wider screens. */
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}

/**
 * Horizontal chip group for filter rows. The first option is treated as the
 * "show all" reset and uses the translated `type.all` label.
 */
export function FilterChips({ label, options, value, onChange }: FilterChipsProps) {
  const { t } = useT()
  const allOption = { value: 'all', label: t('type.all') }
  const all = [allOption, ...options]

  return (
    <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-2">
      <span className="text-mono text-[10px] uppercase tracking-wider2 text-ink-mute w-16 shrink-0 font-medium">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2.5">
        {all.map((o) => (
          <Chip
            key={o.value}
            active={value === o.value}
            onClick={() => onChange(o.value)}
            label={o.label}
          />
        ))}
      </div>
    </div>
  )
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 ${
        active
          ? 'border border-moss bg-moss/10 text-moss shadow-sm'
          : 'border border-rule text-ink-soft hover:border-moss/50 hover:text-moss hover:bg-moss/5'
      }`}
    >
      {label}
    </button>
  )
}
