import { createContext, useContext } from 'react'
import type { Lang, Dict } from './dict'

type Vars = Record<string, string | number>
type DictValue = string | { label: string; desc: string }

export interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  toggleLang: () => void
  /** Look up a key, optionally with interpolation variables. */
  t: (key: keyof Dict, vars?: Vars) => string
  /** Look up a settings-style {label, desc} value. */
  opt: (key: keyof Dict) => { label: string; desc: string }
}

export const LangContext = createContext<LangCtx | null>(null)

export function format(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
}

export type { Lang }
export type { DictValue }

export function useT(): LangCtx {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useT must be used within <LangProvider>')
  return ctx
}
