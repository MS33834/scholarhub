import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ReadingHistoryItem {
  resourceId: string
  title: string
  authors: string[]
  timestamp: number
  visitCount: number
}

interface ReadingHistoryState {
  history: ReadingHistoryItem[]
  addVisit: (resourceId: string, title: string, authors: string[]) => void
  removeItem: (resourceId: string) => void
  clearHistory: () => void
  getRecentHistory: (limit?: number) => ReadingHistoryItem[]
}

export const useReadingHistory = create<ReadingHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      
      addVisit: (resourceId: string, title: string, authors: string[]) => {
        const history = get().history
        const existingIndex = history.findIndex(item => item.resourceId === resourceId)
        
        if (existingIndex >= 0) {
          // Update existing item
          const updated = [...history]
          updated[existingIndex] = {
            ...updated[existingIndex],
            timestamp: Date.now(),
            visitCount: updated[existingIndex].visitCount + 1
          }
          set({ history: updated })
        } else {
          // Add new item
          const newItem: ReadingHistoryItem = {
            resourceId,
            title,
            authors,
            timestamp: Date.now(),
            visitCount: 1
          }
          set({ history: [newItem, ...history] })
        }
      },
      
      removeItem: (resourceId: string) => {
        set({ history: get().history.filter(item => item.resourceId !== resourceId) })
      },
      
      clearHistory: () => {
        set({ history: [] })
      },
      
      getRecentHistory: (limit = 50) => {
        return [...get().history]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit)
      }
    }),
    {
      name: 'reading-history-storage'
    }
  )
)
