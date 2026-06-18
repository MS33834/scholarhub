import { create } from 'zustand'

interface UIState {
  toast: string | null
  toastTimer: number | null
  showToast: (msg: string) => void
}

export const useUI = create<UIState>((set, get) => ({
  toast: null,
  toastTimer: null,
  showToast: (msg) => {
    if (get().toastTimer) window.clearTimeout(get().toastTimer!)
    set({ toast: msg })
    const id = window.setTimeout(() => set({ toast: null, toastTimer: null }), 1500)
    set({ toastTimer: id })
  },
}))
