import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavoritesState {
  ids: string[]
  toggle: (id: string) => void
  remove: (id: string) => void
  has: (id: string) => boolean
  clear: () => void
  exportJSON: () => string
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
      exportJSON: () =>
        JSON.stringify({ favorites: get().ids, exportedAt: new Date().toISOString() }, null, 2),
    }),
    {
      name: 'scholarhub:favorites',
      version: 1,
    },
  ),
)
