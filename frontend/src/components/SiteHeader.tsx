import { NavLink, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Search, Languages, User, LogIn, LogOut, Shield } from 'lucide-react'
import { useUI } from '@/store'
import { useT } from '@/i18n/useLang'
import { useAuth } from '@/store/authStore'

export function SiteHeader() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const showToast = useUI((s) => s.showToast)
  const { t, lang, toggleLang } = useT()
  const { user, isAuthenticated, logout } = useAuth()
  const [q, setQ] = useState('')

  // Sync search box with ?q= from any page
  useEffect(() => {
    const v = searchParams.get('q') ?? ''
    // Guarded setState: only updates when the URL param differs from local input,
    // so no cascading render occurs in practice.
    setQ((prev) => (prev === v ? prev : v))
  }, [searchParams])

  const navItems: { to: string; key: 'nav.home' | 'nav.resources' | 'nav.favorites' | 'nav.history' | 'nav.lists' | 'nav.settings' | 'nav.about' }[] = [
    { to: '/', key: 'nav.home' },
    { to: '/resources', key: 'nav.resources' },
    { to: '/favorites', key: 'nav.favorites' },
    { to: '/history', key: 'nav.history' },
    { to: '/lists', key: 'nav.lists' },
    { to: '/settings', key: 'nav.settings' },
    { to: '/about', key: 'nav.about' },
  ]

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    if (!term) {
      showToast(t('search.empty'))
      return
    }
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <header className="sticky top-0 z-50 bg-paper border-b border-rule">
      <div className="mx-auto max-w-column px-6 sm:px-8">
        <div className="flex items-center justify-between gap-6 py-4">
          <Link to="/" className="flex items-baseline gap-3 group">
            <span className="font-display text-2xl text-ink">ScholarHUB</span>
            <span className="text-mono text-[11px] uppercase tracking-wider2 text-ink-mute border border-rule px-2 py-0.5 rounded-[2px]">
              {t('brand.volume')}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <form
              onSubmit={onSubmit}
              className="hidden sm:flex items-center gap-2 border border-rule rounded-[2px] px-3 py-2 bg-paper focus-within:border-moss transition-colors"
              style={{ minWidth: 280 }}
            >
              <Search size={16} className="text-ink-mute" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('search.placeholder')}
                className="bg-transparent text-sm flex-1 placeholder:text-ink-mute focus:outline-none"
                aria-label={t('search.aria')}
              />
              <kbd className="text-mono text-[11px] text-ink-mute border border-rule px-1.5 py-0.5">/</kbd>
            </form>

            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-moss border border-rule rounded-[2px] px-3 py-2 hover:border-moss/60 transition-colors"
              aria-label={lang === 'en' ? 'Switch to Chinese' : '切换到英文'}
              title={lang === 'en' ? 'Switch to 中文' : 'Switch to English'}
            >
              <Languages size={16} />
              <span>{lang === 'en' ? 'EN' : '中'}</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    className="hidden sm:flex items-center gap-1.5 text-sm text-ink-soft hover:text-moss border border-rule rounded-[2px] px-3 py-2 hover:border-moss/60 transition-colors"
                    title={t('profile.adminPanel')}
                  >
                    <Shield size={16} />
                    <span>{t('profile.adminPanel')}</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-moss border border-rule rounded-[2px] px-3 py-2 hover:border-moss/60 transition-colors"
                  title={t('profile.user')}
                >
                  <User size={16} />
                  <span className="hidden sm:inline">{user?.username}</span>
                </Link>
                <button
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                  className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ochre border border-rule rounded-[2px] px-3 py-2 hover:border-ochre/60 transition-colors"
                  title={t('profile.logout')}
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">{t('profile.logout')}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-moss border border-rule rounded-[2px] px-3 py-2 hover:border-moss/60 transition-colors"
              >
                <LogIn size={16} />
                <span>{t('auth.login.submit')}</span>
              </Link>
            )}
          </div>
        </div>

        <nav className="flex items-center gap-6 sm:gap-8 pb-3 pt-1 text-sm overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `whitespace-nowrap text-ink-soft hover:text-ink transition-colors ${isActive ? 'text-moss' : ''}`
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
