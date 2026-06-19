import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { Loader2, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { useT } from '@/i18n/useLang'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface PDFViewerProps {
  url: string
  isOpen: boolean
  onClose: () => void
}

export function PDFViewer({ url, isOpen, onClose }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const { t } = useT()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPage = useCallback(async (pdf: any, pageNum: number, currentScale: number) => {
    if (!canvasRef.current) return

    try {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: currentScale })
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) return

      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise
    } catch (err) {
      console.error('Page rendering error:', err)
      setError(t('pdf.error'))
    }
  }, [t])

  useEffect(() => {
    if (!isOpen || !url) return

    const loadPDF = async () => {
      setLoading(true)
      setError(null)

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdf = await pdfjsLib.getDocument({ url } as any).promise
        pdfDocRef.current = pdf
        setTotalPages(pdf.numPages)
        setCurrentPage(1)
        await renderPage(pdf, 1, scale)
      } catch (err) {
        setError(t('pdf.error'))
        console.error('PDF loading error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPDF()

    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy()
        pdfDocRef.current = null
      }
    }
  }, [isOpen, url, renderPage, scale])

  useEffect(() => {
    if (pdfDocRef.current && currentPage > 0) {
      renderPage(pdfDocRef.current, currentPage, scale)
    }
  }, [scale, currentPage, renderPage])

  const goToPage = async (pageNum: number) => {
    if (!pdfDocRef.current || pageNum < 1 || pageNum > totalPages) return
    setCurrentPage(pageNum)
    await renderPage(pdfDocRef.current, pageNum, scale)
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-paper rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-rule">
          <h3 className="text-lg font-semibold text-ink">{t('pdf.title')}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-ink-soft/10 rounded transition-colors"
            aria-label={t('pdf.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-rule bg-ink-soft/5">
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1 || loading}
              className="p-2 hover:bg-ink-soft/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('pdf.previousPage')}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-ink-soft">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages || loading}
              className="p-2 hover:bg-ink-soft/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('pdf.nextPage')}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5 || loading}
              className="p-2 hover:bg-ink-soft/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('pdf.zoomOut')}
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-sm text-ink-soft min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={scale >= 3.0 || loading}
              className="p-2 hover:bg-ink-soft/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('pdf.zoomIn')}
            >
              <ZoomIn size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-ink-soft/10 flex items-center justify-center p-4">
          {loading && (
            <div className="flex items-center gap-3 text-ink-soft">
              <Loader2 className="animate-spin" size={24} />
              <span>{t('pdf.loading')}</span>
            </div>
          )}

          {error && (
            <div className="text-center text-red-500">
              <p>{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-ink text-paper rounded hover:bg-ink-soft transition-colors"
              >
                {t('pdf.close')}
              </button>
            </div>
          )}

          {!loading && !error && (
            <canvas
              ref={canvasRef}
              className="shadow-lg max-w-full"
              style={{ maxHeight: 'calc(90vh - 140px)' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
