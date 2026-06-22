import { useReadingLists } from '@/hooks/useReadingLists'
import { useT } from '@/i18n/useLang'
import { Trash2, X, BookMarked, Plus, ArrowRight, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ResourceCard } from '@/components/ResourceCard'
import { Skeleton } from '@/components/Skeleton'
import { useResources } from '@/hooks/useResources'
import { useUI } from '@/store'

export function ListsPage() {
  const { t } = useT()
  const showToast = useUI((s) => s.showToast)
  const { lists, createList, deleteList, removeFromList, getAllLists } = useReadingLists()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDesc, setNewListDesc] = useState('')
  const [selectedList, setSelectedList] = useState<string | null>(null)

  const allLists = getAllLists()

  const selectedListData = useMemo(
    () => (selectedList ? lists.find((l) => l.id === selectedList) : null),
    [lists, selectedList],
  )
  const selectedListIds = useMemo(
    () => selectedListData?.resourceIds || [],
    [selectedListData],
  )

  const { resources: selectedListResources, loading } = useResources({
    filters: { ids: selectedListIds, limit: 500 },
    enabled: selectedListIds.length > 0,
  })

  const selectedResourcesOrdered = useMemo(() => {
    const byId = new Map(selectedListResources.map((r) => [r.id, r]))
    return selectedListIds
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => r !== undefined)
  }, [selectedListIds, selectedListResources])

  const handleCreate = async () => {
    if (newListName.trim()) {
      try {
        await createList(newListName.trim(), newListDesc.trim())
        setNewListName('')
        setNewListDesc('')
        setShowCreateDialog(false)
      } catch {
        // Error state is handled inside the hook.
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(t('lists.confirm.delete'))) {
      try {
        await deleteList(id)
        if (selectedList === id) {
          setSelectedList(null)
        }
      } catch {
        // Error state is handled inside the hook.
      }
    }
  }

  const handleRemove = async (resourceId: string) => {
    if (!selectedList) return
    try {
      await removeFromList(selectedList, resourceId)
    } catch {
      // Error state is handled inside the hook.
    }
  }

  const handleExport = () => {
    if (!selectedListData || selectedResourcesOrdered.length === 0) {
      showToast(t('lists.exportEmpty'))
      return
    }

    const payload = {
      id: selectedListData.id,
      name: selectedListData.name,
      description: selectedListData.description,
      exportedAt: new Date().toISOString(),
      resources: selectedResourcesOrdered,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedListData.name.replace(/\s+/g, '_')}_reading_list.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(t('lists.exported'))
  }

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
      <header className="border-b border-rule pb-8 flex items-baseline justify-between gap-6 flex-wrap">
        <div>
          <p className="text-mono text-[12px] uppercase tracking-wider2 text-moss mb-3">
            {t('home.hero.eyebrow')}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-ink tracking-tight">{t('lists.title')}</h1>
          <p className="mt-3 text-lg text-ink-soft">{t('lists.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 border border-moss rounded-[2px] text-paper bg-moss hover:bg-paper hover:text-moss transition-colors"
        >
          <Plus size={16} /> {t('lists.create')}
        </button>
      </header>

      {showCreateDialog && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper border border-rule rounded-[2px] p-7 max-w-md w-full">
            <h2 className="font-display text-2xl text-ink mb-5">{t('lists.create')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">
                  {t('lists.name')}
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss transition-colors text-base"
                  placeholder={t('lists.namePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">
                  {t('lists.description')}
                </label>
                <textarea
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  className="w-full px-3 py-2.5 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss transition-colors text-base resize-none"
                  rows={3}
                  placeholder={t('lists.descriptionPlaceholder')}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-4 py-2.5 border border-rule rounded-[2px] text-sm font-medium text-ink-soft hover:text-ink hover:border-ink transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newListName.trim()}
                className="flex-1 px-4 py-2.5 border border-moss rounded-[2px] text-sm font-medium text-paper bg-moss hover:bg-paper hover:text-moss disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t('common.ok')}
              </button>
            </div>
          </div>
        </div>
      )}

      {allLists.length === 0 ? (
        <div className="mt-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-rule rounded-[2px] text-moss mb-8">
            <BookMarked size={28} />
          </div>
          <p className="font-display text-3xl text-ink">{t('lists.empty.title')}</p>
          <p className="mt-3 text-lg text-ink-soft max-w-md mx-auto">{t('lists.empty.body')}</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 mt-8 text-base font-medium text-moss hover:text-ink transition-colors group"
          >
            {t('lists.create')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      ) : (
        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allLists.map((list) => (
            <div
              key={list.id}
              className="group relative border border-rule rounded-[2px] p-5 hover:border-ink transition-colors cursor-pointer"
              onClick={() => setSelectedList(list.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-xl text-ink leading-snug group-hover:text-moss transition-colors">
                    {list.name}
                  </h3>
                  {list.description && (
                    <p className="mt-2 text-sm text-ink-soft line-clamp-2">{list.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-sm text-ink-mute">
                    <span className="px-2.5 py-1 border border-rule rounded-[2px]">
                      {t('lists.items', { count: list.resourceIds.length })}
                    </span>
                    <span>·</span>
                    <span>{new Date(list.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(list.id)
                  }}
                  className="shrink-0 p-2 text-ink-mute hover:text-ochre transition-colors opacity-0 group-hover:opacity-100"
                  aria-label={t('lists.delete')}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {selectedListData && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper border border-rule rounded-[2px] p-7 max-w-column w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b border-rule pb-4">
              <div>
                <h2 className="font-display text-2xl text-ink">{selectedListData.name}</h2>
                {selectedListData.description && (
                  <p className="mt-1 text-sm text-ink-soft">{selectedListData.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  disabled={selectedResourcesOrdered.length === 0}
                  className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 border border-rule rounded-[2px] text-ink-soft hover:text-ink hover:border-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Download size={16} /> {t('lists.exportJson')}
                </button>
                <button
                  onClick={() => setSelectedList(null)}
                  className="p-2 text-ink-mute hover:text-ink transition-colors"
                  aria-label={t('nav.close')}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            {loading ? (
              <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : selectedResourcesOrdered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-ink-soft">{t('lists.noResources')}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {selectedResourcesOrdered.map((resource) => (
                  <div key={resource.id} className="space-y-2">
                    <ResourceCard resource={resource} />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleRemove(resource.id)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-mute hover:text-ochre transition-colors"
                      >
                        <X size={14} /> {t('lists.removeFromList')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
