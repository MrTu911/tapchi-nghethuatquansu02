import { useState, useRef, useLayoutEffect, useEffect, useMemo, useCallback, RefObject } from 'react'
import { ReaderSettings } from './types'
import { CorpusArticle } from '@/types/corpus'

export function useReaderLayout({
  settings,
  currentIdx,
  measureRef,
  jumpToLastSpread,
  setCurrentSpread,
  goNextArticle,
  goPrevArticle,
  article,
}: {
  settings: ReaderSettings
  currentIdx: number
  measureRef: RefObject<HTMLDivElement>
  jumpToLastSpread: React.MutableRefObject<boolean>
  setCurrentSpread: React.Dispatch<React.SetStateAction<number>>
  goNextArticle: () => void
  goPrevArticle: () => void
  article: CorpusArticle | null
}) {
  const [viewportW, setViewportW] = useState(0)
  const [totalSpreads, setTotalSpreads] = useState(1)
  const [totalCols, setTotalCols] = useState(1)
  const viewportRef = useRef<HTMLDivElement>(null)
  const isAnimating = useRef(false)

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    if (el.clientWidth > 0) setViewportW(el.clientWidth)
    let t: ReturnType<typeof setTimeout>
    const obs = new ResizeObserver(() => {
      clearTimeout(t)
      t = setTimeout(() => { if (el.clientWidth > 0) setViewportW(el.clientWidth) }, 80)
    })
    obs.observe(el)
    return () => { obs.disconnect(); clearTimeout(t) }
  }, [])

  const pageH = typeof window !== 'undefined'
    ? Math.max(300, window.innerHeight - 64 - 36)
    : 600

  const colsPerSpread = settings.twoPage && viewportW >= 768 ? 2 : 1

  const geometry = useMemo(() => {
    const padding = colsPerSpread === 2 ? 50 : 40
    const colGap = colsPerSpread === 2 ? 60 : 0
    const innerW = Math.max(300, viewportW - padding * 2)
    // Removed Math.max(280, ...) because it causes Safari to drop columns when colWidth * 2 + colGap > innerW.
    // By using exactly (innerW - colGap) / 2, it always fits perfectly.
    const colWidth = colsPerSpread === 2 ? (innerW - colGap) / 2 : innerW
    const shiftPerSpread = colsPerSpread * (colWidth + colGap)
    return { padding, colGap, innerW, colWidth, shiftPerSpread, pageH }
  }, [viewportW, colsPerSpread, pageH])

  const resolveVT = useRef<(() => void) | null>(null)
  const isJumping = useRef(false)

  useLayoutEffect(() => {
    if (!viewportW) return
    if (currentIdx === -1 || article === null) {
      setTotalCols(1)
      setTotalSpreads(1)
      if (jumpToLastSpread.current) { setCurrentSpread(0); jumpToLastSpread.current = false }
      
      if (resolveVT.current) {
        const res = resolveVT.current
        resolveVT.current = null
        setTimeout(() => { isJumping.current = false; res() }, 10)
      }
      return
    }
    const el = measureRef.current
    if (!el) return
    
    const scrollW = el.scrollWidth
    if (scrollW <= 0) return
    
    const totalCols = Math.round((scrollW + geometry.colGap) / (geometry.colWidth + geometry.colGap))
    const spreads = Math.max(1, Math.ceil(totalCols / colsPerSpread))
    
    setTotalCols(totalCols)
    setTotalSpreads(spreads)
    if (jumpToLastSpread.current) { setCurrentSpread(spreads - 1); jumpToLastSpread.current = false }
    
    if (resolveVT.current) {
      const res = resolveVT.current
      resolveVT.current = null
      setTimeout(() => { isJumping.current = false; res() }, 10)
    }
  }, [article, settings.fontScale, colsPerSpread, currentIdx, viewportW, measureRef, jumpToLastSpread, setCurrentSpread, geometry.colGap, geometry.colWidth])

  const animatedTurn = useCallback((dir: 'next' | 'prev', currentSpread: number) => {
    if (isAnimating.current) return
    isAnimating.current = true
    if (dir === 'next') {
      if (currentSpread < totalSpreads - 1) setCurrentSpread(s => s + 1)
      else {
        if (typeof document !== 'undefined' && (document as any).startViewTransition) {
          document.documentElement.setAttribute('data-vt-dir', 'next');
          (document as any).startViewTransition(() => {
            return new Promise<void>(resolve => {
              isJumping.current = true
              resolveVT.current = resolve
              import('react-dom').then(({ flushSync }) => {
                flushSync(() => goNextArticle())
              })
            })
          });
        } else {
          isJumping.current = true
          goNextArticle()
          setTimeout(() => { isJumping.current = false }, 50)
        }
      }
    } else {
      if (currentSpread > 0) setCurrentSpread(s => s - 1)
      else {
        if (typeof document !== 'undefined' && (document as any).startViewTransition) {
          document.documentElement.setAttribute('data-vt-dir', 'prev');
          (document as any).startViewTransition(() => {
            return new Promise<void>(resolve => {
              isJumping.current = true
              resolveVT.current = resolve
              import('react-dom').then(({ flushSync }) => {
                flushSync(() => goPrevArticle())
              })
            })
          });
        } else {
          isJumping.current = true
          goPrevArticle()
          setTimeout(() => { isJumping.current = false }, 50)
        }
      }
    }
    setTimeout(() => { isAnimating.current = false }, 450)
  }, [totalSpreads, goNextArticle, goPrevArticle, setCurrentSpread])

  return { viewportRef, viewportW, geometry, colsPerSpread, totalSpreads, totalCols, isJumping, animatedTurn }
}
