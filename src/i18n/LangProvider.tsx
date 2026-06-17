import { useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useSettings } from '@/store'
import { dicts, type Lang, type Dict } from './dict'
import { LangContext, format, type LangCtx } from './useLang'

export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useSettings((s) => s.lang)
  const setSettingsLang = useSettings((s) => s.setLang)

  // Sync to <html lang> for accessibility
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [lang])

  const t = useCallback(
    (key: keyof Dict, vars?: Parameters<typeof format>[1]): string => {
      const value = dicts[lang][key]
      if (typeof value === 'string') return format(value, vars)
      // Fall back to English if zh dict is missing this key
      const fallback = dicts.en[key]
      if (typeof fallback === 'string') return format(fallback, vars)
      return String(key)
    },
    [lang],
  )

  const opt = useCallback(
    (key: keyof Dict): { label: string; desc: string } => {
      const value = dicts[lang][key]
      if (typeof value === 'object') return value
      const fallback = dicts.en[key]
      if (typeof fallback === 'object') return fallback
      return { label: String(key), desc: '' }
    },
    [lang],
  )

  const setLang = useCallback(
    (l: Lang) => setSettingsLang(l),
    [setSettingsLang],
  )

  const toggleLang = useCallback(
    () => setSettingsLang(lang === 'en' ? 'zh' : 'en'),
    [lang, setSettingsLang],
  )

  const value = useMemo<LangCtx>(
    () => ({ lang, setLang, toggleLang, t, opt }),
    [lang, setLang, toggleLang, t, opt],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}
