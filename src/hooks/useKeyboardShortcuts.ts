import { useEffect, useCallback, useState } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description: string
  action: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to blur input fields
        if (event.key === 'Escape') {
          ;(target as HTMLInputElement | HTMLTextAreaElement).blur()
        }
        return
      }

      shortcuts.forEach((shortcut) => {
        if (shortcut.enabled === false) return

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.alt ? event.altKey : !event.altKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault()
          shortcut.action()
        }
      })
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Common shortcuts hook for the app
export function useAppShortcuts(actions: {
  focusSearch: () => void
  navigateUp?: () => void
  navigateDown?: () => void
  openCurrentItem?: () => void
  goHome?: () => void
  goBack?: () => void
  toggleTheme?: () => void
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      description: 'Focus search box',
      action: actions.focusSearch,
    },
    {
      key: 'k',
      description: 'Navigate up',
      action: actions.navigateUp || (() => {}),
      enabled: !!actions.navigateUp,
    },
    {
      key: 'j',
      description: 'Navigate down',
      action: actions.navigateDown || (() => {}),
      enabled: !!actions.navigateDown,
    },
    {
      key: 'Enter',
      description: 'Open selected item',
      action: actions.openCurrentItem || (() => {}),
      enabled: !!actions.openCurrentItem,
    },
    {
      key: 'g',
      shift: true,
      description: 'Go to home page',
      action: actions.goHome || (() => {}),
      enabled: !!actions.goHome,
    },
    {
      key: 'Escape',
      description: 'Go back',
      action: actions.goBack || (() => {}),
      enabled: !!actions.goBack,
    },
    {
      key: 't',
      shift: true,
      description: 'Toggle theme',
      action: actions.toggleTheme || (() => {}),
      enabled: !!actions.toggleTheme,
    },
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      action: () => {
        // This will be handled by the component
      },
    },
  ]

  useKeyboardShortcuts(shortcuts)
}

// Hook for list navigation
export function useListNavigation(itemCount: number, onSelect?: (index: number) => void) {
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const navigateUp = useCallback(() => {
    setSelectedIndex((prev: number) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const navigateDown = useCallback(() => {
    setSelectedIndex((prev: number) => (prev < itemCount - 1 ? prev + 1 : prev))
  }, [itemCount])

  const openCurrentItem = useCallback(() => {
    if (selectedIndex >= 0 && onSelect) {
      onSelect(selectedIndex)
    }
  }, [selectedIndex, onSelect])

  useAppShortcuts({
    focusSearch: () => {
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
      searchInput?.focus()
    },
    navigateUp,
    navigateDown,
    openCurrentItem,
  })

  return { selectedIndex, setSelectedIndex }
}
