import { HashRouter, Route, Routes, useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Toast } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useDocumentSettings } from '@/hooks/useDocumentSettings'
import { useAutoDarkMode } from '@/hooks/useAutoDarkMode'
import { useT } from '@/i18n/useLang'
import { HomePage } from '@/pages/HomePage'
import { ResourcesPage } from '@/pages/ResourcesPage'
import { ResourceDetailPage } from '@/pages/ResourceDetailPage'
import { DisciplinePage } from '@/pages/DisciplinePage'
import { SearchPage } from '@/pages/SearchPage'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { ListsPage } from '@/pages/ListsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AboutPage } from '@/pages/AboutPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

function NotFound() {
  const { t } = useT()
  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-32 pb-32 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-ink-soft/10 mb-6">
        <span className="text-display text-4xl text-ink-mute">404</span>
      </div>
      <h1 className="text-display text-3xl sm:text-4xl text-ink tracking-tight">{t('common.pageNotFound')}</h1>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 text-mono text-[11px] uppercase tracking-wider2 text-moss hover:text-ink transition-colors group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t('common.backHome')}
      </Link>
    </div>
  )
}

export default function App() {
  useDocumentSettings()
  useAutoDarkMode()
  return (
    <HashRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--paper)' }}>
          <SiteHeader />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/resource/:id" element={<ResourceDetailPage />} />
              <Route path="/discipline/:slug" element={<DisciplinePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <SiteFooter />
          <Toast />
        </div>
      </ErrorBoundary>
    </HashRouter>
  )
}
