'use client'

import { useEffect } from 'react'

export function LibraryClickInterceptor() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find closest link wrapping a book cover
      const target = (e.target as HTMLElement).closest('a[href^="/library/"]') as HTMLElement
      if (target) {
        // Find the actual cover image wrapper inside the link
        const coverEl = target.querySelector('.book-cover-element') || target
        const rect = coverEl.getBoundingClientRect()
        
        sessionStorage.setItem('book_origin_rect', JSON.stringify({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        }))
      }
    }
    
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  return null
}
