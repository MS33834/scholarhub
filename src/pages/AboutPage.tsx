import { useT } from '@/i18n/useLang'

const sections: { titleKey: 'about.mission.title' | 'about.scope.title' | 'about.data.title' | 'about.contribute.title' | 'about.license.title'; bodyKey: 'about.mission.body' | 'about.scope.body' | 'about.data.body' | 'about.contribute.body' | 'about.license.body' }[] = [
  { titleKey: 'about.mission.title', bodyKey: 'about.mission.body' },
  { titleKey: 'about.scope.title', bodyKey: 'about.scope.body' },
  { titleKey: 'about.data.title', bodyKey: 'about.data.body' },
  { titleKey: 'about.contribute.title', bodyKey: 'about.contribute.body' },
  { titleKey: 'about.license.title', bodyKey: 'about.license.body' },
]

export function AboutPage() {
  const { t } = useT()
  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
      <header className="border-b border-rule pb-10">
        <p className="text-sm font-medium text-moss mb-4">
          {t('home.hero.eyebrow')}
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink tracking-tight">{t('about.title')}</h1>
        <p className="mt-4 text-xl leading-relaxed text-ink-soft max-w-2xl">{t('about.subtitle')}</p>
      </header>
      <div className="mt-12 space-y-16">
        {sections.map((s, idx) => (
          <section key={s.titleKey} className="relative">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-sm font-semibold text-ink-mute shrink-0 tabular-nums">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <h2 className="text-3xl font-bold text-ink">{t(s.titleKey)}</h2>
            </div>
            <p className="text-lg leading-relaxed text-ink-soft pl-10" style={{ textAlign: 'justify' }}>
              {t(s.bodyKey)}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}
