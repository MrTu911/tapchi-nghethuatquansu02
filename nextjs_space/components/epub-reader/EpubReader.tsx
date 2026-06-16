'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import ePub, { type Rendition, type Book } from 'epubjs'

interface TocItem {
  label: string
  href: string
  num?: string
  title?: string
  author?: string
  isSection?: boolean
}

interface Props {
  url: string
  title?: string
}

function parseLabel(raw: string) {
  const lbl = raw.trim()
  let num = '', title = lbl, author = ''
  const m = lbl.match(/^(\d+)\.\s+(.+)$/)
  if (m) { num = m[1]; title = m[2] }
  const sep = title.indexOf(' — ')
  if (sep > 0) {
    author = title.substring(sep + 3).trim()
    title = title.substring(0, sep).trim()
  }
  return { num, title, author }
}

export default function EpubReader({ url, title = 'Tạp chí' }: Props) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<Rendition | null>(null)
  const bookRef = useRef<Book | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toc, setToc] = useState<TocItem[]>([])
  const [bookTitle, setBookTitle] = useState(title)
  const [chapterTitle, setChapterTitle] = useState('')
  const [activeHref, setActiveHref] = useState('')
  const [progress, setProgress] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const [spreadMode, setSpreadMode] = useState<'auto' | 'none'>('auto')
  const [fontScale, setFontScale] = useState(100)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  useEffect(() => {
    let mounted = true
    let cleanup: (() => void) | undefined

    const init = async () => {
      try {
        const book = ePub(url)
        bookRef.current = book

        const metadata = await book.loaded.metadata
        if (!mounted) return
        if (metadata.title) setBookTitle(metadata.title)

        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
        if (!viewerRef.current || !mounted) return

        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: spreadMode,
          gap: 56, // khoảng trống giữa 2 trang
          allowScriptedContent: true,
        } as any)
        renditionRef.current = rendition

        rendition.hooks.content.register((contents: any) => {
          const doc = contents.document
          const fontLink = doc.createElement('link')
          fontLink.rel = 'stylesheet'
          // Font self-host cho LAN air-gapped (xem public/fonts/fonts.css) — không gọi Google Fonts.
          fontLink.href = '/fonts/fonts.css'
          doc.head.appendChild(fontLink)
          const s = doc.createElement('style')
          s.textContent = `
            * { font-family: 'Noto Serif', Georgia, 'Times New Roman', serif !important; }
            body { transition: opacity 0.25s ease; }
          `
          doc.head.appendChild(s)
        })

        const fontStack = "'Noto Serif', 'Times New Roman', Georgia, serif"
        rendition.themes.register('light', {
          body: {
            background: '#FBF6E6 !important',
            color: '#2B1F14 !important',
            'font-family': fontStack + ' !important',
            'line-height': '1.65 !important',
            padding: '1.5em 0.5em !important',
          },
          '.cover-wrap': { margin: '0 !important', padding: '0 !important', 'text-align': 'center !important' },
          '.cover-wrap img': {
            'max-width': '100% !important',
            'max-height': '92vh !important',
            width: 'auto !important',
            height: 'auto !important',
            display: 'inline-block !important',
            margin: '0 auto !important',
          },
          p: { 'text-align': 'justify !important' },
        } as any)
        rendition.themes.register('dark', {
          body: {
            background: '#1a1611 !important',
            color: '#d8c9a8 !important',
            'font-family': fontStack + ' !important',
            'line-height': '1.65 !important',
            padding: '1.5em 0.5em !important',
          },
          'h1, h1.article-title': { color: '#d4937e !important' },
          p: { 'text-align': 'justify !important', color: '#d8c9a8 !important' },
        } as any)

        rendition.themes.select('light')
        await rendition.display()
        // epubjs hỗ trợ resize() không tham số (tự tính theo container); cast vì type yêu cầu 2 đối số.
        ;(rendition as any).resize()

        const nav = await book.loaded.navigation
        const flat: TocItem[] = []
        const walk = (items: any[], depth = 0) => {
          for (const it of items) {
            if (it.subitems?.length && depth === 0) {
              flat.push({ label: it.label.trim(), href: it.href, isSection: true })
              walk(it.subitems, depth + 1)
            } else {
              const p = parseLabel(it.label)
              flat.push({ label: it.label, href: it.href, ...p })
            }
          }
        }
        walk(nav.toc)
        if (mounted) setToc(flat)

        book.locations.generate(1024).then(() => {}).catch(() => {})

        rendition.on('relocated', (location: any) => {
          if (!mounted) return
          const chap = flat.find(t => t.href === location.start.href || location.start.href.startsWith(t.href))
          if (chap) {
            setActiveHref(chap.href)
            setChapterTitle(chap.title || chap.label)
          }
          if (book.locations.length()) {
            const pct = book.locations.percentageFromCfi(location.start.cfi) * 100
            setProgress(pct)
          }
          setAtStart(!!location.atStart)
          setAtEnd(!!location.atEnd)
        })

        rendition.on('relocate', () => {
          try {
            const iframes = viewerRef.current?.querySelectorAll('iframe') || []
            iframes.forEach((iframe: any) => {
              const body = iframe.contentDocument?.body
              if (body) {
                body.style.opacity = '0.3'
                setTimeout(() => { body.style.opacity = '1' }, 60)
              }
            })
          } catch {}
        })

        const onResize = () => (rendition as any).resize()
        window.addEventListener('resize', onResize)
        cleanup = () => window.removeEventListener('resize', onResize)
        if (mounted) setLoading(false)
      } catch (e: any) {
        console.error('[EpubReader] init failed', e)
        if (mounted) {
          setError(e.message || 'Không tải được EPUB')
          setLoading(false)
        }
      }
    }
    init()
    return () => {
      mounted = false
      cleanup?.()
      try { renditionRef.current?.destroy() } catch {}
      try { bookRef.current?.destroy() } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  const animatePageTurn = useCallback((dir: 'next' | 'prev') => {
    const stage = stageRef.current
    const rendition = renditionRef.current
    if (!stage || !rendition) return
    const w = stage.offsetWidth
    // Trượt gần hết width của viewer để cảm giác trang giấy lướt rõ
    const shift = dir === 'next' ? -w * 0.85 : w * 0.85
    const easing = 'cubic-bezier(0.65, 0, 0.35, 1)'

    // ─── Phase 1: trang hiện tại trượt ra HẾT cạnh viewer + shadow đậm ở mép ───
    stage.style.transition = `transform .42s ${easing}, opacity .42s ease-out, box-shadow .35s ease-out`
    stage.style.transform = `translateX(${shift}px)`
    stage.style.boxShadow = dir === 'next'
      ? '-20px 0 40px rgba(0,0,0,.25), -2px 0 8px rgba(0,0,0,.15)'
      : '20px 0 40px rgba(0,0,0,.25), 2px 0 8px rgba(0,0,0,.15)'
    // Chỉ fade nhẹ ở giai đoạn cuối để hide moment swap content
    setTimeout(() => {
      stage.style.opacity = '0'
    }, 360)

    // ─── Phase 2 (420ms): swap content — trang biến mất, swap, jump position ───
    setTimeout(() => {
      if (dir === 'next') rendition.next(); else rendition.prev()
      // Reset instant: nhảy về phía ngược lại, ẩn
      stage.style.transition = 'none'
      stage.style.transform = `translateX(${-shift}px)`
      stage.style.boxShadow = dir === 'next'
        ? '20px 0 40px rgba(0,0,0,.25), 2px 0 8px rgba(0,0,0,.15)'
        : '-20px 0 40px rgba(0,0,0,.25), -2px 0 8px rgba(0,0,0,.15)'
      stage.style.opacity = '0'

      // ─── Phase 3: trang mới trượt vào từ phía bên kia + fade in ───
      requestAnimationFrame(() => {
        stage.style.transition = `transform .42s ${easing}, opacity .25s ease-in, box-shadow .42s ease-out`
        stage.style.transform = 'translateX(0)'
        stage.style.opacity = '1'
        // Shadow fade ra khi trang về center
        setTimeout(() => { stage.style.boxShadow = '' }, 380)
      })
    }, 420)
  }, [])

  const onPrev = useCallback(() => animatePageTurn('prev'), [animatePageTurn])
  const onNext = useCallback(() => animatePageTurn('next'), [animatePageTurn])
  const goTo = (href: string) => {
    renditionRef.current?.display(href)
    setSidebarOpen(false)
  }
  const toggleSpread = () => {
    const next = spreadMode === 'auto' ? 'none' : 'auto'
    setSpreadMode(next)
    renditionRef.current?.spread(next)
  }
  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    renditionRef.current?.themes.select(next ? 'dark' : 'light')
  }
  const changeFont = (delta: number) => {
    const next = Math.max(70, Math.min(180, fontScale + delta))
    setFontScale(next)
    renditionRef.current?.themes.fontSize(next + '%')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Prevent default arrow scroll, dùng key cho navigation có flip animation
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onNext() }
      else if (e.key === ' ' && !e.shiftKey) { e.preventDefault(); onNext() } // Space = next
      else if (e.key === ' ' && e.shiftKey) { e.preventDefault(); onPrev() }  // Shift+Space = prev
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onPrev, onNext])

  const S = {
    root: {
      position: 'fixed' as const, inset: 0,
      display: 'grid',
      gridTemplateColumns: '340px 1fr',
      gridTemplateRows: '56px 1fr 4px',
      gridTemplateAreas: `"header header" "sidebar main" "progress progress"`,
      background:
        'radial-gradient(ellipse at 20% 0%, rgba(122,46,46,.06), transparent 50%),' +
        'radial-gradient(ellipse at 100% 100%, rgba(110,80,50,.08), transparent 55%),' +
        'linear-gradient(160deg, #F4ECD8 0%, #ECE0C2 50%, #E0D2AE 100%)',
      fontFamily: "'Noto Sans', -apple-system, 'Segoe UI', sans-serif",
      color: '#2B1F14',
    },
    header: {
      gridArea: 'header',
      display: 'flex', alignItems: 'center', padding: '0 18px', gap: 14,
      background: 'rgba(251,246,230,.7)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid rgba(0,0,0,.08)',
      boxShadow: '0 1px 0 rgba(255,255,255,.5) inset, 0 4px 16px rgba(0,0,0,.04)',
      zIndex: 20,
    },
    sidebar: {
      gridArea: 'sidebar',
      overflow: 'auto', padding: 14,
      background: 'rgba(251,246,230,.55)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderRight: '1px solid rgba(0,0,0,.08)',
      boxShadow: '1px 0 0 rgba(255,255,255,.5) inset, 4px 0 16px rgba(0,0,0,.03)',
    },
    main: {
      gridArea: 'main',
      position: 'relative' as const,
      background: '#FBF6E6',
      overflow: 'hidden',
    },
    viewer: {
      width: 'calc(100% - 100px)',
      height: '100%',
      margin: '0 auto',
    },
    navBtn: (side: 'left' | 'right'): React.CSSProperties => ({
      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
      [side]: 8,
      width: 48, height: 48,
      background: 'rgba(255,255,255,.6)',
      border: '1px solid rgba(255,255,255,.7)',
      color: '#7A2E2E',
      fontSize: 22, fontWeight: 700,
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10,
      borderRadius: '50%',
      boxShadow: '0 1px 0 rgba(255,255,255,.9) inset, 0 4px 12px rgba(0,0,0,.08)',
      backdropFilter: 'blur(14px) saturate(180%)',
      WebkitBackdropFilter: 'blur(14px) saturate(180%)',
      transition: 'transform .2s, background .2s, opacity .3s',
    }),
    progress: { gridArea: 'progress', background: 'rgba(122,46,46,.1)' as const },
    titleBlock: { flex: 1, minWidth: 0 },
    titleMain: {
      fontFamily: "'Noto Serif', Georgia, serif",
      fontSize: 15, color: '#7A2E2E', fontWeight: 700,
      whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
    },
    titleSub: { fontSize: 11, color: '#5C4A38' },
    btn: {
      background: 'rgba(255,255,255,.55)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,.6)',
      boxShadow: '0 1px 0 rgba(255,255,255,.8) inset, 0 1px 2px rgba(0,0,0,.05)',
      borderRadius: 10, padding: '6px 12px',
      color: '#7A2E2E', fontSize: 13, fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      transition: 'background .15s, transform .1s',
    } as React.CSSProperties,
    btnGroup: {
      display: 'inline-flex', alignItems: 'center', gap: 2,
      background: 'rgba(255,255,255,.55)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,.6)',
      borderRadius: 10,
    } as React.CSSProperties,
    btnInGroup: {
      background: 'transparent', border: 'none', boxShadow: 'none',
      padding: '6px 10px', color: '#7A2E2E', cursor: 'pointer', fontSize: 13, fontWeight: 700,
    } as React.CSSProperties,
    tocItem: (active: boolean): React.CSSProperties => ({
      display: 'block', padding: active ? '8px 7px' : '8px 10px',
      marginBottom: 4, borderRadius: 6, cursor: 'pointer',
      lineHeight: 1.4,
      borderLeft: active ? '3px solid #7A2E2E' : '3px solid transparent',
      background: active ? 'rgba(122,46,46,.12)' : 'transparent',
    }),
  }

  return (
    <div style={S.root}>
      <header style={S.header}>
        <button style={{ ...S.btn, display: 'none' }} className="btn-menu-mobile" onClick={() => setSidebarOpen(o => !o)}>☰</button>
        <div style={S.titleBlock}>
          <div style={S.titleMain}>{bookTitle}</div>
          <div style={S.titleSub}>{chapterTitle}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div className="font-group">
            <button className="font-btn" onClick={() => changeFont(-10)} title="Thu nhỏ">A−</button>
            <span className="font-pct">{fontScale}%</span>
            <button className="font-btn" onClick={() => changeFont(10)} title="Phóng to">A+</button>
          </div>
          <button className="glass-btn" onClick={toggleSpread} title={spreadMode === 'auto' ? '2 trang' : '1 trang'}>
            {spreadMode === 'auto' ? '📖' : '📄'}
          </button>
          <button className="glass-btn" onClick={toggleTheme} title="Chế độ tối">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <aside style={S.sidebar} className={sidebarOpen ? 'sidebar-open' : ''}>
        <h3 className="toc-heading">Mục lục</h3>
        <ul className="toc-list">
          {toc.map((item, i) =>
            item.isSection ? (
              <li key={`s-${i}`} className="toc-section">{item.label}</li>
            ) : (
              <li
                key={item.href}
                onClick={() => goTo(item.href)}
                className={`toc-item ${activeHref === item.href ? 'toc-active' : ''}`}
              >
                {item.num && <span className="toc-num">{item.num}</span>}
                <span className="toc-title">{item.title || item.label}</span>
                {item.author && <span className="toc-author">{item.author}</span>}
              </li>
            )
          )}
        </ul>
      </aside>

      <main style={S.main}>
        {loading && (
          <div className="glass-overlay">
            <div className="glass-card">
              <div className="ep-spin glass-spinner" />
              <div className="glass-card-text">Đang tải tạp chí...</div>
            </div>
          </div>
        )}
        {error && (
          <div className="glass-overlay">
            <div className="glass-card error">
              <p className="glass-card-title">Lỗi tải EPUB</p>
              <p className="glass-card-text">{error}</p>
            </div>
          </div>
        )}
        <div ref={stageRef} className="viewer-stage" style={S.viewer}>
          <div ref={viewerRef} style={{ width: '100%', height: '100%' }} />
        </div>
        <button
          className="nav-btn nav-prev"
          style={{ opacity: atStart ? 0 : 1, pointerEvents: atStart ? 'none' : 'auto' }}
          onClick={onPrev}
          aria-label="Trang trước"
        >◂</button>
        <button
          className="nav-btn nav-next"
          style={{ opacity: atEnd ? 0 : 1, pointerEvents: atEnd ? 'none' : 'auto' }}
          onClick={onNext}
          aria-label="Trang sau"
        >▸</button>
      </main>

      <div className="glass-progress">
        <div className="glass-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <style jsx global>{`
        @keyframes ep-spin { to { transform: rotate(360deg); } }
        .ep-spin { animation: ep-spin 1s linear infinite; }

        /* ─── TOC Heading (Mục lục) — glass plate ─── */
        .toc-heading {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #7A2E2E;
          font-weight: 700;
          padding: 10px 12px;
          margin: 0 0 12px;
          background: rgba(255, 255, 255, .35);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, .5);
          border-radius: 10px;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, .8) inset,
            0 1px 2px rgba(0, 0, 0, .04);
          text-align: center;
        }
        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        /* ─── TOC Section divider — glass ridge ─── */
        .toc-section {
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: #7A2E2E;
          margin: 22px 0 10px;
          padding: 10px 12px;
          line-height: 1.45;
          text-align: justify;
          text-align-last: left;
          background: linear-gradient(135deg,
            rgba(122, 46, 46, .08) 0%,
            rgba(217, 164, 65, .06) 100%);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(122, 46, 46, .15);
          border-radius: 10px;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, .6) inset,
            0 1px 2px rgba(0, 0, 0, .03);
        }

        /* ─── TOC item — glass pill ─── */
        .toc-item {
          display: block;
          padding: 10px 12px;
          margin-bottom: 6px;
          border-radius: 10px;
          cursor: pointer;
          line-height: 1.4;
          background: rgba(255, 255, 255, .25);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, .35);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, .6) inset,
            0 1px 2px rgba(0, 0, 0, .02);
          transition: all .15s;
        }
        .toc-item:hover {
          background: rgba(255, 255, 255, .5);
          border-color: rgba(122, 46, 46, .25);
          transform: translateY(-1px);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, .85) inset,
            0 3px 10px rgba(122, 46, 46, .08),
            0 1px 3px rgba(0, 0, 0, .04);
        }
        .toc-item:active {
          transform: translateY(0) scale(0.98);
        }
        .toc-item.toc-active {
          background: linear-gradient(135deg,
            rgba(122, 46, 46, .18) 0%,
            rgba(122, 46, 46, .08) 100%);
          border-color: rgba(122, 46, 46, .4);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, .7) inset,
            0 4px 14px rgba(122, 46, 46, .15),
            0 1px 3px rgba(0, 0, 0, .05),
            inset 3px 0 0 #7A2E2E;
          padding-left: 15px;
        }
        .toc-item.toc-active .toc-title {
          color: #7A2E2E;
          font-weight: 600;
        }
        .toc-num {
          display: inline-block;
          font-size: 13px;
          color: #7A2E2E;
          font-weight: 700;
          margin-bottom: 4px;
          font-variant-numeric: tabular-nums;
        }
        .toc-title {
          display: block;
          font-size: 14px;
          color: #2B1F14;
          line-height: 1.4;
          text-align: justify;
          text-align-last: left;
          word-spacing: -0.5px;
          transition: color .15s;
        }
        .toc-author {
          display: block;
          font-size: 12px;
          color: #5C4A38;
          font-style: italic;
          line-height: 1.3;
          margin-top: 4px;
        }

        /* ─── Loading / Error glass card ─── */
        .glass-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 30;
          background: rgba(251, 246, 230, .4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .glass-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 36px 48px;
          background: rgba(255, 255, 255, .5);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, .65);
          border-radius: 20px;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, .9) inset,
            0 12px 32px rgba(0, 0, 0, .1),
            0 4px 12px rgba(0, 0, 0, .06);
          max-width: 400px;
        }
        .glass-card.error {
          background: rgba(255, 240, 240, .55);
          border-color: rgba(122, 46, 46, .25);
        }
        .glass-spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(122, 46, 46, .18);
          border-top-color: #7A2E2E;
        }
        .glass-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #7A2E2E;
          margin: 0 0 4px;
          font-family: 'Noto Serif', Georgia, serif;
        }
        .glass-card-text {
          font-size: 13px;
          color: #5C4A38;
          text-align: center;
          margin: 0;
        }

        /* ─── Nav buttons ◂ ▸ ─── */
        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, .6);
          border: 1px solid rgba(255, 255, 255, .7);
          color: #7A2E2E;
          font-size: 22px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          border-radius: 50%;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, .9) inset,
            0 4px 12px rgba(0, 0, 0, .08),
            0 1px 3px rgba(0, 0, 0, .05);
          backdrop-filter: blur(14px) saturate(180%);
          -webkit-backdrop-filter: blur(14px) saturate(180%);
          transition: background .2s, color .2s, transform .15s, box-shadow .2s;
        }
        .nav-btn.nav-prev { left: 8px; }
        .nav-btn.nav-next { right: 8px; }
        .nav-btn:hover {
          background: rgba(255, 255, 255, .85);
          color: #7A2E2E;
          transform: translateY(-50%) scale(1.06);
          border-color: rgba(122, 46, 46, .25);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, .95) inset,
            0 6px 18px rgba(122, 46, 46, .12),
            0 2px 4px rgba(0, 0, 0, .06);
        }
        .nav-btn:active {
          transform: translateY(-50%) scale(0.96);
        }

        /* ─── Header buttons feedback ─── */

        /* Liquid glass pill: container chứa A−/A+ + % */
        .font-group {
          display: inline-flex;
          align-items: center;
          gap: 0;
          background: rgba(255, 255, 255, .5);
          backdrop-filter: blur(14px) saturate(180%);
          -webkit-backdrop-filter: blur(14px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, .65);
          border-radius: 12px;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, .85) inset,
            0 1px 3px rgba(0, 0, 0, .05),
            0 4px 12px rgba(0, 0, 0, .03);
          padding: 2px;
          overflow: hidden;
        }
        .font-btn {
          background: transparent;
          border: none;
          color: #7A2E2E;
          font-size: 13px;
          font-weight: 700;
          font-family: inherit;
          padding: 5px 12px;
          cursor: pointer;
          border-radius: 8px;
          transition: background .15s, transform .1s, color .15s;
        }
        .font-btn:hover {
          background: rgba(122, 46, 46, .12);
          transform: translateY(-1px);
        }
        .font-btn:active {
          transform: translateY(0) scale(0.95);
          background: rgba(122, 46, 46, .2);
        }
        .font-pct {
          font-size: 11px;
          color: #5C4A38;
          min-width: 40px;
          text-align: center;
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }

        /* Glass button — view mode + theme toggle */
        .glass-btn {
          background: rgba(255, 255, 255, .5);
          backdrop-filter: blur(14px) saturate(180%);
          -webkit-backdrop-filter: blur(14px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, .65);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, .85) inset,
            0 1px 3px rgba(0, 0, 0, .05),
            0 4px 12px rgba(0, 0, 0, .03);
          border-radius: 12px;
          padding: 6px 12px;
          color: #7A2E2E;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 38px;
          height: 34px;
          transition: background .15s, transform .12s, box-shadow .2s, border-color .15s;
        }
        .glass-btn:hover {
          background: rgba(255, 255, 255, .8);
          border-color: rgba(122, 46, 46, .25);
          transform: translateY(-1px);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, .95) inset,
            0 4px 14px rgba(122, 46, 46, .12),
            0 1px 3px rgba(0, 0, 0, .08);
        }
        .glass-btn:active {
          transform: translateY(0) scale(0.96);
          background: rgba(255, 255, 255, .65);
        }

        /* Page transition — via stageRef inline style trong animatePageTurn() */
        .viewer-stage {
          position: relative;
          will-change: opacity, transform;
        }

        /* ─── Progress bar — glass with gradient ─── */
        .glass-progress {
          grid-area: progress;
          background: rgba(255, 255, 255, .4);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, .5);
          box-shadow: 0 -1px 2px rgba(0, 0, 0, .03);
          overflow: hidden;
        }
        .glass-progress-fill {
          height: 100%;
          background: linear-gradient(90deg,
            #7A2E2E 0%,
            #A14A4A 50%,
            #C26060 100%);
          box-shadow:
            0 0 8px rgba(122, 46, 46, .4),
            0 1px 0 rgba(255, 255, 255, .3) inset;
          transition: width .4s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 0 4px 4px 0;
        }

        @media (max-width: 768px) {
          .btn-menu-mobile { display: inline-flex !important; }
        }
      `}</style>
    </div>
  )
}
