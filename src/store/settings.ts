import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FontSize, Lang, Motion, Theme } from '@/types'

interface SettingsState {
  theme: Theme
  motion: Motion
  fontSize: FontSize
  lang: Lang
  setTheme: (t: Theme) => void
  setMotion: (m: Motion) => void
  setFontSize: (f: FontSize) => void
  setLang: (l: Lang) => void
  reset: () => void
}

const DEFAULTS = {
  theme: 'light' as Theme,
  motion: 'full' as Motion,
  fontSize: 'standard' as FontSize,
  lang: 'en' as Lang,
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setTheme: (theme) => set({ theme }),
      setMotion: (motion) => set({ motion }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLang: (lang) => set({ lang }),
      reset: () => set(DEFAULTS),
    }),
    {
      name: 'scholarhub:settings',
      version: 1,
    },
  ),
)
