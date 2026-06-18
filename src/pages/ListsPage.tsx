import { useReadingLists } from '@/store/readingLists'
import { useT } from '@/i18n/useLang'
import { Trash2, X, BookMarked, Plus, ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ResourceCard } from '@/components/ResourceCard'
import { Skeleton } from '@/components/Skeleton'
import { useResources } from '@/hooks/useResources'

export function ListsPage() {
  const { t } = useT()
  const { lists, createList, deleteList, getAllLists } = useReadingLists()
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

  const handleCreate = () => {
    if (newListName.trim()) {
      createList(newListName.trim(), newListDesc.trim())
      setNewListName('')
      setNewListDesc('')
      setShowCreateDialog(false)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm(t('lists.confirm.delete'))) {
      deleteList(id)
      if (selectedList === id) {
        setSelectedList(null)
      }
    }
  }

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
      <header className="border-b border-rule pb-8 flex items-baseline justify-between gap-6 flex-wrap">
        <div>
          <p className="text-sm font-medium text-moss mb-3">
            {t('home.hero.eyebrow')}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight">{t('lists.title')}</h1>
          <p className="mt-3 text-lg text-ink-soft">{t('lists.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 border border-moss/30 rounded-lg text-moss bg-moss/5 hover:bg-moss hover:text-paper hover:border-moss transition-all"
        >
          <Plus size={16} /> {t('lists.create')}
        </button>
      </header>

      {showCreateDialog && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-paper border border-rule rounded-lg p-7 max-w-md w-full shadow-lg">
            <h2 className="text-2xl font-semibold text-ink mb-5">{t('lists.create')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">
                  {t('lists.name')}
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-rule rounded-lg bg-transparent focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all text-base"
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
                  className="w-full px-3 py-2.5 border border-rule rounded-lg bg-transparent focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all text-base resize-none"
                  rows={3}
                  placeholder={t('lists.descriptionPlaceholder')}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-4 py-2.5 border border-rule rounded-lg text-sm font-medium text-ink-soft hover:text-ink hover:border-ink transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newListName.trim()}
                className="flex-1 px-4 py-2.5 border border-moss/30 rounded-lg text-sm font-medium text-moss bg-moss/5 hover:bg-moss hover:text-paper hover:border-moss disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-moss/5 disabled:hover:text-moss disabled:hover:border-moss/30 transition-all"
              >
                {t('common.ok')}
              </button>
            </div>
          </div>
        </div>
      )}

      {allLists.length === 0 ? (
        <div className="mt-20 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-moss/10 mb-8">
            <BookMarked className="text-moss" size={40} />
          </div>
          <p className="text-3xl font-bold text-ink">{t('lists.empty.title')}</p>
          <p className="mt-3 text-lg text-ink-soft max-w-md mx-auto">{t('lists.empty.body')}</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 mt-8 text-base font-semibold text-moss hover:text-ink transition-colors group"
          >
            {t('lists.create')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      ) : (
        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allLists.map((list) => (
            <div
              key={list.id}
              className="group relative border border-rule rounded-lg p-5 hover:border-ink-soft hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedList(list.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-ink leading-snug group-hover:text-moss transition-colors">
                    {list.name}
                  </h3>
                  {list.description && (
                    <p className="mt-2 text-sm text-ink-soft line-clamp-2">{list.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-sm text-ink-mute">
                    <span className="px-2.5 py-1 border border-rule rounded-md bg-ink-soft/5">
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
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-paper border border-rule rounded-lg p-7 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between mb-6 border-b border-rule pb-4">
              <div>
                <h2 className="text-2xl font-semibold text-ink">{selectedListData.name}</h2>
                {selectedListData.description && (
                  <p className="mt-1 text-sm text-ink-soft">{selectedListData.description}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedList(null)}
                className="p-2 text-ink-mute hover:text-ink hover:bg-ink-soft/10 rounded-md transition-colors"
                aria-label={t('nav.close')}
              >
                <X size={20} />
              </button>
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
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
