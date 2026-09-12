'use client'

import { useState, useCallback } from 'react'

export interface UseCopyToClipboardReturn {
  isCopied: boolean
  copy: (text: string) => Promise<boolean>
}

export const useCopyToClipboard = (resetDelay = 2000): UseCopyToClipboardReturn => {
  const [isCopied, setIsCopied] = useState(false)

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        console.warn('Clipboard not supported')
        return false
      }

      try {
        await navigator.clipboard.writeText(text)
        setIsCopied(true)
        setTimeout(() => {
          setIsCopied(false)
        }, resetDelay)
        return true
      } catch (error) {
        console.warn('Copy failed', error)
        setIsCopied(false)
        return false
      }
    },
    [resetDelay]
  )

  return { isCopied, copy }
}
