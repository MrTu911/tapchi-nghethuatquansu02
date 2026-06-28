import { CorpusArticle } from '@/types/corpus'
import { ReaderSettings } from './types'
import { useEffect, useRef } from 'react'

interface ReaderSidebarProps {
  settings: ReaderSettings
  C: Record<string, string>
  currentIdx: number
  isCover: boolean
  articleId?: string
  sectionedArticles: any[]
  collapsedSections: Set<string>
  toggleSection: (key: string) => void
  goToArticle: (id: string) => void
  goToCover: () => void
  goToBackCover?: () => void
  corpusArticles: CorpusArticle[]
}

export default function ReaderSidebar({
  settings,
  C,
  currentIdx,
  isCover,
  articleId,
  sectionedArticles,
  collapsedSections,
  toggleSection,
  goToArticle,
  goToCover,
  goToBackCover,
  corpusArticles,
}: ReaderSidebarProps) {
  const scrollRef = useRef<HTMLElement>(null)
  const total = corpusArticles.length
  const isFrontCover = currentIdx === -1
  const isBackCover = currentIdx === total

  useEffect(() => {
    if (!scrollRef.current) return
    
    // We must wait a tiny bit for the state to render expanded sections if needed
    const timeout = setTimeout(() => {
      if (!scrollRef.current) return
      // Target the specific article element, not the section header
      const activeEl = scrollRef.current.querySelector('.ntqs-toc-art.is-active')
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 50)
    
    return () => clearTimeout(timeout)
  }, [articleId, isCover])

  return (
      <aside
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          padding: '20px 14px',
          // --- ULTRA PREMIUM VISION-OS LEVEL GLASS --- //
          background: settings.dark 
            ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)' 
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(60px) saturate(160%)',
          WebkitBackdropFilter: 'blur(60px) saturate(160%)',
          borderRight: `1px solid ${settings.dark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.05)'}`,
          boxShadow: settings.dark 
            ? 'inset 0 1px 1px rgba(255, 255, 255, 0.1), inset 0 -1px 1px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.2)'
            : 'inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 1px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(58, 42, 38, 0.04)',
        }}
      >
      <h3 className="ntqs-toc-heading">Mục lục</h3>

      <button
        className={`ntqs-toc-cover ${isFrontCover ? 'is-active' : ''}`}
        onClick={goToCover}
      >
        <span className="ntqs-toc-cover-label">Trang tiêu đề</span>
      </button>

      <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
        {sectionedArticles.map((section) => {
          const collapsed = collapsedSections.has(section.key)
          const containsActive = !isCover && section.articles.some((a: CorpusArticle) => a.id === articleId)
          const showItems = !collapsed || containsActive

          return (
            <li key={section.key} style={{ padding: 0, margin: 0 }}>
              <div
                className={`ntqs-toc-section ${containsActive ? 'is-active' : ''}`}
                onClick={() => toggleSection(section.key)}
                role="button"
                tabIndex={0}
              >
                <span className="ntqs-toc-arrow">{collapsed && !containsActive ? '▸' : '▾'}</span>
                <span className="ntqs-toc-section-label">
                  {section.articles[0]?.section_header || section.name}
                </span>
                <span className="ntqs-toc-count">{section.articles.length}</span>
              </div>
              {showItems && (
                <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 12px' }}>
                  {section.articles.map((a: CorpusArticle, ai: number) => {
                    const isActive = !isCover && a.id === articleId
                    const idx = corpusArticles.findIndex((x) => x.id === a.id)
                    return (
                      <li
                        key={a.id}
                        onClick={() => goToArticle(a.id)}
                        className={`ntqs-toc-art ${isActive ? 'is-active' : ''}`}
                      >
                        <div className="ntqs-toc-art-num">{idx + 1}</div>
                        <div className="ntqs-toc-art-title">
                          {[a.title.main, a.title.subtitle].filter(Boolean).join(' ')}
                        </div>
                        {a.authors[0]?.name && (
                          <div className="ntqs-toc-art-author">
                            {[a.authors[0].rank, a.authors[0].degree].filter(Boolean).join(', ')}{' '}
                            <span style={{ fontWeight: 600 }}>{a.authors[0].name}</span>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      {goToBackCover && (
        <button
          className={`ntqs-toc-cover ${isBackCover ? 'is-active' : ''}`}
          onClick={goToBackCover}
          style={{ marginTop: '20px', width: '100%', display: 'flex', alignItems: 'center' }}
        >
          <span className="ntqs-toc-cover-label">Trang bìa sau</span>
        </button>
      )}
    </aside>
  )
}
