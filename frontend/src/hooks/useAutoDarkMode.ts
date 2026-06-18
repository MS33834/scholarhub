import { useEffect } from 'react'
import { useSettings } from '@/store'

export function useAutoDarkMode() {
  const theme = useSettings((s) => s.theme)

  useEffect(() => {
    // Only apply auto-switching if theme is set to 'auto'
    if (theme !== 'auto') return

    const checkTimeAndSetTheme = () => {
      const hour = new Date().getHours()
      
      // Dark mode from 18:00 (6 PM) to 06:00 (6 AM)
      const shouldBeDark = hour >= 18 || hour < 6
      
      if (shouldBeDark) {
        document.documentElement.setAttribute('data-theme', 'dark')
      } else {
        document.documentElement.setAttribute('data-theme', 'light')
      }
    }

    // Check immediately
    checkTimeAndSetTheme()

    // Check every minute
    const interval = setInterval(checkTimeAndSetTheme, 60000)

    return () => clearInterval(interval)
  }, [theme])
}
