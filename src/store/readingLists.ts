import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ReadingList {
  id: string
  name: string
  description: string
  resourceIds: string[]
  createdAt: number
  updatedAt: number
  isPublic: boolean
}

interface ReadingListsState {
  lists: ReadingList[]
  createList: (name: string, description?: string) => string
  updateList: (id: string, updates: Partial<Omit<ReadingList, 'id' | 'createdAt'>>) => void
  deleteList: (id: string) => void
  addToList: (listId: string, resourceId: string) => void
  removeFromList: (listId: string, resourceId: string) => void
  getList: (id: string) => ReadingList | undefined
  getAllLists: () => ReadingList[]
  getPublicLists: () => ReadingList[]
}

export const useReadingLists = create<ReadingListsState>()(
  persist(
    (set, get) => ({
      lists: [],
      
      createList: (name: string, description = '') => {
        const id = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newList: ReadingList = {
          id,
          name,
          description,
          resourceIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isPublic: false
        }
        set({ lists: [...get().lists, newList] })
        return id
      },
      
      updateList: (id: string, updates: Partial<Omit<ReadingList, 'id' | 'createdAt'>>) => {
        set({
          lists: get().lists.map(list =>
            list.id === id
              ? { ...list, ...updates, updatedAt: Date.now() }
              : list
          )
        })
      },
      
      deleteList: (id: string) => {
        set({ lists: get().lists.filter(list => list.id !== id) })
      },
      
      addToList: (listId: string, resourceId: string) => {
        set({
          lists: get().lists.map(list => {
            if (list.id === listId && !list.resourceIds.includes(resourceId)) {
              return {
                ...list,
                resourceIds: [...list.resourceIds, resourceId],
                updatedAt: Date.now()
              }
            }
            return list
          })
        })
      },
      
      removeFromList: (listId: string, resourceId: string) => {
        set({
          lists: get().lists.map(list => {
            if (list.id === listId) {
              return {
                ...list,
                resourceIds: list.resourceIds.filter(id => id !== resourceId),
                updatedAt: Date.now()
              }
            }
            return list
          })
        })
      },
      
      getList: (id: string) => {
        return get().lists.find(list => list.id === id)
      },
      
      getAllLists: () => {
        return get().lists.sort((a, b) => b.updatedAt - a.updatedAt)
      },
      
      getPublicLists: () => {
        return get().lists
          .filter(list => list.isPublic)
          .sort((a, b) => b.updatedAt - a.updatedAt)
      }
    }),
    {
      name: 'reading-lists-storage'
    }
  )
)
