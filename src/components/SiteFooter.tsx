import { Link } from 'react-router-dom'
import { useT } from '@/i18n/LangProvider'
import { Github, ArrowUpRight } from 'lucide-react'

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
                  <Github size={16} />
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
