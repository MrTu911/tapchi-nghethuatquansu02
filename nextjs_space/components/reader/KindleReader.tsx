'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, useAnimation } from 'framer-motion'
import type { Corpus, CorpusArticle } from '@/types/corpus'
import { ReaderSettings, DEFAULT_SETTINGS, SETTINGS_KEY, COLORS, DARK_COLORS, SANS, SERIF } from './types'
import { getStyles } from './styles'
import ReaderHeader from './ReaderHeader'
import ReaderSidebar from './ReaderSidebar'
import CoverPage from './CoverPage'
import Article from './Article'
import ReaderIntro from './ReaderIntro'
import { useReaderLayout } from './useReaderLayout'

export default function KindleReader({ corpus, issueId }: { corpus: Corpus; issueId: string }) {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentSpread, setCurrentSpread] = useState(0)
  
  const readerControls = useAnimation()

  const measureRef = useRef<HTMLDivElement>(null)
  const jumpToLastSpread = useRef(false)

  const isCover = currentIdx === -1
  const article = isCover ? null : corpus.articles[currentIdx]
  const total = corpus.articles.length
  const C = settings.dark ? DARK_COLORS : COLORS

  useEffect(() => {
    const id = 'ntqs-reader-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&subset=vietnamese&display=swap'
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    setMounted(true)
    try { const s = localStorage.getItem(SETTINGS_KEY); if (s) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) }) } catch {}
    try { const i = localStorage.getItem(`ntqs-reader-pos-${issueId}`); if (i !== null) setCurrentIdx(parseInt(i, 10) || -1) } catch {}
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [issueId])

  useEffect(() => { if (!mounted) return; try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch {} }, [settings, mounted])
  useEffect(() => { if (!mounted) return; try { localStorage.setItem(`ntqs-reader-pos-${issueId}`, String(currentIdx)) } catch {} }, [currentIdx, issueId, mounted])

  // Lock body scroll when the reader is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = originalOverflow }
  }, [])

  const goNextArticle = useCallback(() => { setCurrentSpread(0); setCurrentIdx(i => Math.min(i + 1, total - 1)) }, [total])
  const goPrevArticle = useCallback(() => { jumpToLastSpread.current = true; setCurrentIdx(i => Math.max(i - 1, -1)) }, [])

  const { viewportRef, viewportW, geometry, colsPerSpread, totalSpreads, totalCols, isJumping, animatedTurn } = useReaderLayout({
    settings, currentIdx, measureRef, jumpToLastSpread,
    setCurrentSpread, goNextArticle, goPrevArticle, article,
  })

  useEffect(() => {
    if (currentSpread >= totalSpreads) setCurrentSpread(Math.max(0, totalSpreads - 1))
  }, [currentSpread, totalSpreads])

  const goToArticle = useCallback((id: string) => {
    const idx = corpus.articles.findIndex(a => a.id === id)
    if (idx >= 0) { setCurrentSpread(0); setCurrentIdx(idx); if (viewportW < 768) setSidebarOpen(false) }
  }, [corpus.articles, viewportW])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        animatedTurn(e.key === 'ArrowLeft' || e.key === 'PageUp' ? 'prev' : 'next', currentSpread)
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [animatedTurn, currentSpread])

  const sectionedArticles = useMemo(() => corpus.sections.map((sec, i) => ({
    key: `sec-${i}`, ...sec,
    articles: sec.article_ids.map(id => corpus.articles.find(a => a.id === id)).filter((a): a is CorpusArticle => Boolean(a)),
  })), [corpus])

  const toggleSection = (key: string) => setCollapsedSections(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  const changeFont = (delta: number) => setSettings(s => ({ ...s, fontScale: Math.max(70, Math.min(180, s.fontScale + delta)) }))

  const atStart = currentIdx === -1 && currentSpread === 0
  const atEnd = currentIdx === total - 1 && currentSpread === totalSpreads - 1
  const isMobile = viewportW > 0 && viewportW < 768

  if (currentIdx !== -1 && !article) return <div className="flex items-center justify-center min-h-screen">Không tìm thấy bài.</div>

  const issueShort = `${corpus.issue.title} — ${corpus.issue.name}`
  const { padding, colGap, innerW, colWidth, shiftPerSpread, pageH } = geometry

  const spineGrad = `linear-gradient(to right, transparent 0%, rgba(0,0,0,${settings.dark ? 0.25 : 0.04}) 30%, rgba(0,0,0,${settings.dark ? 0.5 : 0.08}) 50%, rgba(0,0,0,${settings.dark ? 0.25 : 0.04}) 70%, transparent 100%)`

  return (
    <div className="ntqs-root" style={{ position: 'fixed', inset: 0, background: C.bgGradient, overflow: 'hidden' }}>
      
      <ReaderIntro corpus={corpus} issueId={issueId} settings={settings} C={C} readerControls={readerControls} />

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={readerControls} 
        style={{ width: '100%', height: '100%', display: 'grid',
          gridTemplateColumns: sidebarOpen && !isMobile ? '320px 1fr' : '1fr',
          gridTemplateRows: '64px 1fr',
          gridTemplateAreas: sidebarOpen && !isMobile ? `"header header" "sidebar main"` : `"header" "main"`,
          fontFamily: SANS, color: C.text,
        }}
      >
        <ReaderHeader
          issueShort={issueShort} sectionName={article?.section || 'TRANG BÌA'}
          settings={settings} C={C} changeFont={changeFont}
          toggleTwoPage={() => setSettings(s => ({ ...s, twoPage: !s.twoPage }))}
          toggleDarkMode={() => setSettings(s => ({ ...s, dark: !s.dark }))}
          sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(v => !v)}
        />

        {sidebarOpen && (
          <>
            {isMobile && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)' }} />}
            <div style={isMobile ? { position: 'fixed', top: 64, left: 0, bottom: 0, width: 300, zIndex: 50, overflowY: 'auto', display: 'flex', flexDirection: 'column' } : { gridArea: 'sidebar', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <ReaderSidebar settings={settings} C={C} currentIdx={currentIdx} isCover={isCover}
                articleId={article?.id} sectionedArticles={sectionedArticles} collapsedSections={collapsedSections}
                toggleSection={toggleSection} goToArticle={goToArticle}
                goToCover={() => { setCurrentIdx(-1); setCurrentSpread(0); if (isMobile) setSidebarOpen(false) }}
                corpusArticles={corpus.articles} />
            </div>
          </>
        )}

        <div style={{ gridArea: 'main', padding: '16px 20px 20px 16px', overflow: 'hidden', display: 'flex', minHeight: 0 }}>
          <main style={{
            position: 'relative', flex: 1,
            background: settings.dark ? 'rgba(26,22,17,0.95)' : 'rgba(251,246,230,0.92)',
            backdropFilter: 'blur(32px) saturate(150%)', WebkitBackdropFilter: 'blur(32px) saturate(150%)',
            borderRadius: '12px',
            boxShadow: settings.dark ? '0 12px 48px rgba(0,0,0,0.4)' : '0 12px 48px rgba(0,0,0,0.08)',
            border: `1px solid ${settings.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
            overflow: 'hidden',
          }}>
            <div ref={viewportRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>

              {isCover ? (
                <CoverPage issue={corpus.issue} issueId={issueId} C={C} />
              ) : (
                <div style={{ position: 'absolute', inset: 0 }}>

                  {/* Hidden measurement div */}
                  <div ref={measureRef} aria-hidden="true" style={{
                    position: 'absolute', top: 0, left: -9999, visibility: 'hidden', pointerEvents: 'none',
                    width: innerW, height: pageH, columnWidth: colWidth, columnCount: colsPerSpread, columnGap: colGap, columnFill: 'auto',
                    paddingTop: 24, paddingBottom: 36, boxSizing: 'border-box',
                    fontSize: `${settings.fontScale}%`, fontFamily: SERIF, lineHeight: 1.75,
                  }}>
                    {article && <Article article={article} C={C} issueId={issueId} />}
                  </div>

                  {/* Clipper: exactly innerW wide — prevents next spread bleeding into padding area */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: padding, right: padding,
                    overflow: 'hidden',
                  }}>
                    {/* Sliding multi-column container */}
                    <div key={currentIdx} style={{
                      position: 'relative', // so absolute spines inside align correctly
                      height: pageH,
                      width: innerW,
                      columnWidth: colWidth,
                      columnCount: colsPerSpread,
                      columnGap: colGap,
                      columnFill: 'auto',
                      transform: `translateX(-${currentSpread * shiftPerSpread}px)`,
                    transition: isJumping.current ? 'none' : 'transform .42s cubic-bezier(0.65, 0, 0.35, 1)',
                    willChange: 'transform',
                    fontSize: `${settings.fontScale}%`, fontFamily: SERIF, lineHeight: 1.75, color: C.text,
                    paddingTop: 24, paddingBottom: 36, boxSizing: 'border-box',
                  }}>
                    {article && <Article article={article} C={C} issueId={issueId} />}

                    {/* Spines attached to the sliding text so they move naturally */}
                    {colsPerSpread === 2 && Array.from({ length: Math.max(1, totalSpreads) }).map((_, si) => (
                      <div key={si} style={{
                        position: 'absolute', top: 0, bottom: 0,
                        left: si * shiftPerSpread + colWidth,
                        width: colGap, background: spineGrad,
                        pointerEvents: 'none', zIndex: 10,
                      }} />
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Page numbers removed as requested */}

            {/* Edge gradients */}
            <div style={{ position: 'absolute', inset: '0 auto 0 0', width: padding, background: `linear-gradient(to right, rgba(0,0,0,${settings.dark ? 0.3 : 0.05}), transparent)`, pointerEvents: 'none', zIndex: 5 }} />
            <div style={{ position: 'absolute', inset: '0 0 0 auto', width: padding, background: `linear-gradient(to left, rgba(0,0,0,${settings.dark ? 0.3 : 0.05}), transparent)`, pointerEvents: 'none', zIndex: 5 }} />
          </div>

          {/* Nav buttons — inline style, zIndex cao */}
          {(['prev', 'next'] as const).map(dir => (
            <button key={dir} onClick={() => animatedTurn(dir, currentSpread)} aria-label={dir === 'prev' ? 'Trang trước' : 'Trang sau'}
              style={{
                position: 'absolute', top: '50%', [dir === 'prev' ? 'left' : 'right']: 4,
                transform: 'translateY(-50%)', zIndex: 20,
                width: 30, height: 30, borderRadius: '50%', border: `1px solid ${C.border}`,
                background: settings.dark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.25)',
                color: C.accent, fontSize: 16, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                opacity: (dir === 'prev' ? atStart : atEnd) ? 0 : 1,
                pointerEvents: (dir === 'prev' ? atStart : atEnd) ? 'none' : 'auto',
                transition: 'opacity .3s, background .2s',
              }}
            >{dir === 'prev' ? '◂' : '▸'}</button>
          ))}

          {/* Progress bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: settings.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', zIndex: 20 }}>
            <div style={{ height: '100%', background: C.accent, opacity: settings.dark ? 0.6 : 0.25, transition: 'width .42s', width: `${isCover ? 0 : ((currentIdx + currentSpread / Math.max(1, totalSpreads)) / total) * 100}%` }} />
          </div>
        </main>
      </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: getStyles({ dark: settings.dark }, C) }} />
    </div>
  )
}
