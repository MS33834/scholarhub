import { ReactNode, useState } from 'react'
import { Menu, X, Home, BookOpen, Heart, Clock, List, Settings, Info } from 'lucide-react'
import { useMobile } from '@/hooks/useMobile'
import { Link, useLocation } from 'react-router-dom'
import { useT } from '@/i18n/useLang'

interface MobileNavProps {
  children?: ReactNode
}

export function MobileNav({ children }: MobileNavProps) {
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useT()
  const location = useLocation()

  if (!isMobile) {
    return <>{children}</>
  }

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/resources', label: t('nav.resources'), icon: BookOpen },
    { to: '/favorites', label: t('nav.favorites'), icon: Heart },
    { to: '/history', label: t('nav.history'), icon: Clock },
    { to: '/lists', label: t('nav.lists'), icon: List },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
    { to: '/about', label: t('nav.about'), icon: Info },
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-3 bg-paper border border-rule rounded-lg shadow-lg hover:border-moss hover:shadow-xl transition-all active:scale-95"
        aria-label={t('nav.menu')}
      >
        <Menu size={22} className="text-ink" />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-paper border-r border-rule p-6 overflow-y-auto animate-slideInLeft shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8 pb-5 border-b border-rule">
              <div>
                <h2 className="text-2xl font-bold text-ink tracking-tight">ScholarHUB</h2>
                <p className="text-xs font-medium text-ink-mute mt-1">
                  {t('brand.volume')}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-ink-soft/10 rounded-lg hover:text-moss transition-colors active:scale-95"
                aria-label={t('nav.close')}
              >
                <X size={22} />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 py-3.5 px-4 rounded-lg transition-all active:scale-98 ${
                      isActive
                        ? 'bg-moss/10 text-moss border-l-3 border-moss pl-3'
                        : 'text-ink-soft hover:bg-ink-soft/10 hover:text-ink'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-moss' : ''} />
                    <span className="text-base font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="mt-8 pt-6 border-t border-rule">
              <p className="text-xs font-medium text-ink-mute leading-relaxed">
                {t('brand.tagline')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
