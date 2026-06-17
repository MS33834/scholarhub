import { useSettings } from '@/store'
import { useT } from '@/i18n/useLang'
import type { Lang } from '@/i18n/dict'

interface SectionProps<T extends string> {
  title: string
  options: { value: T; label: string; desc: string }[]
  value: T
  onChange: (v: T) => void
  selectedLabel: string
}

function Section<T extends string>({ title, options, value, onChange, selectedLabel }: SectionProps<T>) {
  return (
    <section className="mt-12 border-b border-rule pb-8">
      <h2 className="text-2xl font-bold text-ink mb-6">{title}</h2>
      <ul className="divide-y divide-rule">
        {options.map((o) => {
          const active = o.value === value
          return (
            <li key={o.value}>
              <button
                onClick={() => onChange(o.value)}
                className="w-full flex items-center gap-4 py-5 text-left group transition-all duration-200 hover:bg-ink-soft/5 px-3 -mx-3 rounded-lg"
                aria-pressed={active}
              >
                <span
                  className={`shrink-0 h-px transition-all duration-300 ease-in-out ${
                    active
                      ? 'w-8 bg-moss'
                      : 'w-0 bg-transparent group-hover:w-6 group-hover:bg-ink-mute'
                  }`}
                  style={active ? { height: '2px' } : undefined}
                  aria-hidden
                />
                <span className="flex-1 transition-colors duration-200">
                  <span className={`block text-base font-medium transition-colors duration-200 ${active ? 'text-ink' : 'text-ink-soft'}`}>
                    {o.label}
                  </span>
                  <span className="block text-sm text-ink-mute mt-1">{o.desc}</span>
                </span>
                <span className={`text-xs font-semibold uppercase tracking-wide transition-all duration-200 px-3 py-1 rounded-md ${
                  active ? 'text-moss bg-moss/10 opacity-100' : 'text-ink-mute opacity-0'
                }`}>
                  {selectedLabel}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function SettingsPage() {
  const { theme, fontSize, motion, lang, setTheme, setFontSize, setMotion, setLang, reset } = useSettings()
  const { t, opt } = useT()

  const themeOptions = [
    { value: 'light' as const, ...opt('settings.theme.light') },
    { value: 'dark' as const, ...opt('settings.theme.dark') },
    { value: 'auto' as const, ...opt('settings.theme.auto') },
  ]
  const fontOptions = [
    { value: 'standard' as const, ...opt('settings.font.standard') },
    { value: 'large' as const, ...opt('settings.font.large') },
  ]
  const motionOptions = [
    { value: 'full' as const, ...opt('settings.motion.full') },
    { value: 'reduced' as const, ...opt('settings.motion.reduced') },
    { value: 'off' as const, ...opt('settings.motion.off') },
  ]
  const langOptions = [
    { value: 'en' as const, ...opt('settings.lang.en') },
    { value: 'zh' as const, ...opt('settings.lang.zh') },
  ]

  const onReset = () => {
    if (!window.confirm(t('settings.confirm.reset'))) return
    reset()
  }

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
      <header className="border-b border-rule pb-10">
        <p className="text-sm font-medium text-moss mb-4">
          {t('home.hero.eyebrow')}
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink tracking-tight">{t('settings.title')}</h1>
        <p className="mt-4 text-xl leading-relaxed text-ink-soft max-w-2xl">{t('settings.subtitle')}</p>
      </header>

      <Section
        title={t('settings.lang.title')}
        options={langOptions}
        value={lang}
        onChange={(v) => setLang(v as Lang)}
        selectedLabel={t('settings.selected')}
      />
      <Section
        title={t('settings.theme.title')}
        options={themeOptions}
        value={theme}
        onChange={setTheme}
        selectedLabel={t('settings.selected')}
      />
      <Section
        title={t('settings.font.title')}
        options={fontOptions}
        value={fontSize}
        onChange={setFontSize}
        selectedLabel={t('settings.selected')}
      />
      <Section
        title={t('settings.motion.title')}
        options={motionOptions}
        value={motion}
        onChange={setMotion}
        selectedLabel={t('settings.selected')}
      />

      <section className="mt-12 border-b border-rule pb-6">
        <button
          onClick={onReset}
          className="text-sm font-medium text-ink-soft hover:text-ochre transition-colors flex items-center gap-2 group"
        >
          <span className="border-b border-ink-soft/50 group-hover:border-ochre pb-0.5 transition-colors">
            {t('settings.reset')}
          </span>
        </button>
      </section>
    </div>
  )
}
