import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '@/i18n/LangProvider'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  const { t } = useT()

  if (totalPages <= 1) return null

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first, last, and pages around current
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav className={`flex items-center justify-center gap-2 ${className}`} aria-label={t('pagination.label')}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 text-sm text-ink-soft hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label={t('pagination.previous')}
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">{t('pagination.previous')}</span>
      </button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-ink-mute">
                ...
              </span>
            )
          }

          const pageNum = page as number
          const isActive = currentPage === pageNum

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[36px] h-9 px-2 text-sm rounded transition-colors ${
                isActive
                  ? 'bg-moss text-paper font-medium'
                  : 'text-ink-soft hover:bg-ink-soft/10'
              }`}
              aria-label={t('pagination.page', { page: pageNum })}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 text-sm text-ink-soft hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label={t('pagination.next')}
      >
        <span className="hidden sm:inline">{t('pagination.next')}</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
