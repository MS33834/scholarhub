import { useEffect } from 'react'
import { useMobile } from '@/hooks/useMobile'

export function useTouchOptimization() {
  const isMobile = useMobile()

  useEffect(() => {
    if (!isMobile) return

    // Add touch-friendly class to body
    document.body.classList.add('touch-optimized')

    // Prevent double-tap zoom on buttons
    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        e.preventDefault()
        target.click()
      }
    }

    document.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      document.body.classList.remove('touch-optimized')
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile])
}

export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  useEffect(() => {
    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX
      handleSwipeGesture()
    }

    const handleSwipeGesture = () => {
      const swipeThreshold = 50
      const diff = touchStartX - touchEndX

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && onSwipeLeft) {
          onSwipeLeft()
        } else if (diff < 0 && onSwipeRight) {
          onSwipeRight()
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight])
}
