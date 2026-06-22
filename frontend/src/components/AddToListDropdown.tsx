import { useEffect, useRef, useState } from 'react'
import { ListPlus, Plus } from 'lucide-react'
import { useReadingLists } from '@/store/readingLists'
import { useUI } from '@/store'
import { useT } from '@/i18n/useLang'

interface AddToListDropdownProps {
  resourceId: string
  variant?: 'icon' | 'button'
}

export function AddToListDropdown({ resourceId, variant = 'icon' }: AddToListDropdownProps) {
  const { t } = useT()
  const showToast = useUI((s) => s.showToast)
  const { lists, addToList, getAllLists } = useReadingLists()
  const [open, setOpen] = useState(false)
  const [selectedListId, setSelectedListId] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const allLists = getAllLists()

  const handleAdd = () => {
    if (!selectedListId) return
    const list = lists.find((l) => l.id === selectedListId)
    if (!list) return
    if (list.resourceIds.includes(resourceId)) {
      showToast(t('lists.alreadyInList'))
    } else {
      addToList(selectedListId, resourceId)
      showToast(t('lists.added'))
    }
    setOpen(false)
    setSelectedListId('')
  }

  const buttonClass =
    variant === 'icon'
      ? 'shrink-0 p-2 text-ink-mute transition-colors hover:text-moss focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-moss focus-visible:outline-offset-[3px]'
      : 'group flex h-full w-full items-center justify-center gap-2 border border-rule px-4 py-3.5 text-sm text-ink-soft transition-colors duration-200 hover:border-ink hover:text-ink'

  return (
    <div ref={containerRef} className={variant === 'button' ? 'relative flex' : 'relative'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonClass}
        aria-label={t('lists.addToList')}
        aria-haspopup="true"
        aria-expanded={open}
        title={t('lists.addToList')}
      >
        {variant === 'icon' ? (
          <ListPlus size={18} />
        ) : (
          <>
            <ListPlus size={16} /> {t('lists.addToList')}
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[240px] space-y-3 rounded-[2px] border border-rule bg-paper p-4 shadow-[0_4px_12px_rgba(31,26,20,0.08),0_8px_24px_rgba(31,26,20,0.10)]">
          {allLists.length === 0 ? (
            <p className="text-sm text-ink-soft">{t('lists.emptyForAdd')}</p>
          ) : (
            <>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full rounded-[2px] border border-rule bg-transparent px-3 py-2.5 text-base text-ink transition-colors focus:border-moss focus:outline-none"
              >
                <option value="" disabled>
                  {t('lists.selectList')}
                </option>
                {allLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedListId}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[2px] border border-moss bg-moss px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-paper hover:text-moss disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} /> {t('lists.addTo')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
