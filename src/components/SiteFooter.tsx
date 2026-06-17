import { Link } from 'react-router-dom'
import { useT } from '@/i18n/LangProvider'
import { ArrowUpRight } from 'lucide-react'

function GithubMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export function SiteFooter() {
  const { t } = useT()
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-rule mt-32 bg-ink-soft/5">
      <div className="mx-auto max-w-column px-6 sm:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
          <div>
            <p className="text-2xl font-bold text-ink mb-3 tracking-tight">ScholarHUB</p>
            <p className="text-xs font-medium text-ink-mute bg-ink-soft/10 px-2 py-1 rounded-md inline-block mb-4">
              {t('brand.volume')}
            </p>
            <p className="text-sm text-ink-soft leading-relaxed">
              {t('brand.tagline')}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink mb-4">
              {t('footer.section.navigation')}
            </p>
            <ul className="space-y-3 text-sm text-ink-soft">
              <li>
                <Link to="/resources" className="hover:text-moss transition-colors">
                  {t('footer.link.resources')}
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-moss transition-colors">
                  {t('footer.link.favorites')}
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-moss transition-colors">
                  {t('nav.history')}
                </Link>
              </li>
              <li>
                <Link to="/lists" className="hover:text-moss transition-colors">
                  {t('nav.lists')}
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-moss transition-colors">
                  {t('footer.link.settings')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-moss transition-colors">
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink mb-4">
              {t('footer.section.contribute')}
            </p>
            <ul className="space-y-3 text-sm text-ink-soft">
              <li>
                <a
                  className="inline-flex items-center gap-1.5 hover:text-moss transition-colors group"
                  href="https://github.com/badhope/scholarHUB/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('footer.link.contributing')}
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-1.5 hover:text-moss transition-colors group"
                  href="https://github.com/badhope/scholarHUB/issues"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('footer.link.submit')}
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-1.5 hover:text-moss transition-colors group"
                  href="https://github.com/badhope/scholarHUB"
                  target="_blank"
                  rel="noreferrer"
                >
                  <GithubMark size={16} />
                  {t('footer.link.github')}
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-rule flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-ink-mute">
            {t('footer.copyright', { year })}
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-sm font-medium text-ink-mute hover:text-moss transition-colors"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  )
}
