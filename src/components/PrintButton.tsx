import { Printer } from 'lucide-react'
import { useT } from '@/i18n/useLang'

interface PrintButtonProps {
  className?: string
}

export function PrintButton({ className = '' }: PrintButtonProps) {
  const { t } = useT()

  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      onClick={handlePrint}
      className={`flex items-center gap-2 px-4 py-2 border border-ink-soft/20 rounded hover:bg-ink-soft/5 transition-colors ${className}`}
      title={t('print.title')}
    >
      <Printer size={18} />
      <span>{t('print.button')}</span>
    </button>
  )
}
