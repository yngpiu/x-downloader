import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Hook for copying a link to clipboard with temporary visual feedback.
 * Automatically cleans up timer on unmount to prevent memory leaks.
 */
export function useCopyLink() {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const copyLink = useCallback(async (url: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setIsCopied(false)
      }, 1500)
      return true
    } catch {
      return false
    }
  }, [])

  return { isCopied, copyLink }
}
