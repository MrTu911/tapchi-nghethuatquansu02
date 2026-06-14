import Link from 'next/link'
import { ReaderSettings, SERIF } from './types'

interface ReaderHeaderProps {
  issueShort: string
  sectionName: string
  settings: ReaderSettings
  C: Record<string, string>
  changeFont: (delta: number) => void
  toggleTwoPage: () => void
  toggleDarkMode: () => void
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export default function ReaderHeader({
  issueShort,
  sectionName,
  settings,
  C,
  changeFont,
  toggleTwoPage,
  toggleDarkMode,
  sidebarOpen,
  toggleSidebar,
}: ReaderHeaderProps) {
  return (
    <header
      style={{
        gridArea: 'header',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 18,
        zIndex: 20,
        // --- ULTRA PREMIUM VISION-OS LEVEL GLASS --- //
        background: settings.dark ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(60px) saturate(160%)',
        WebkitBackdropFilter: 'blur(60px) saturate(160%)',
        boxShadow: settings.dark 
          ? 'inset 0 1px 1px rgba(255, 255, 255, 0.1), inset 0 -1px 1px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.2), 0 16px 48px rgba(0, 0, 0, 0.4)'
          : 'inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 1px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(58, 42, 38, 0.04), 0 16px 48px rgba(58, 42, 38, 0.08)',
        borderBottom: settings.dark ? '1px solid rgba(0, 0, 0, 0.4)' : '1px solid rgba(0, 0, 0, 0.05)',
      }}
    >
      <Link href="/library" className="ntqs-back">
        <span style={{ fontSize: 14, lineHeight: 1 }}>←</span>
        <span style={{ fontWeight: 600 }}>Thư viện</span>
      </Link>

      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="ntqs-icon-btn"
        title={sidebarOpen ? 'Ẩn mục lục' : 'Hiện mục lục'}
        aria-label="Toggle mục lục"
      >
        {sidebarOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="14" y1="9" x2="17" y2="12" />
            <line x1="14" y1="15" x2="17" y2="12" />
          </svg>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 18,
            fontWeight: 700,
            color: C.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {issueShort}
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            color: C.muted,
            fontWeight: 600,
            marginTop: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textTransform: 'uppercase',
          }}
        >
          {sectionName}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div className="ntqs-font-group">
          <button onClick={() => changeFont(-10)} className="ntqs-font-btn" style={{ borderRight: settings.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)' }}>A−</button>
          <span className="ntqs-font-pct" style={{ pointerEvents: 'none' }}>{settings.fontScale}%</span>
          <button onClick={() => changeFont(10)} className="ntqs-font-btn" style={{ borderLeft: settings.dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.4)' }}>A+</button>
        </div>
        <button
          onClick={toggleTwoPage}
          className="ntqs-icon-btn"
          title={settings.twoPage ? 'Chuyển 1 trang' : 'Chuyển 2 trang'}
        >
          {settings.twoPage ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="8" height="16" rx="1" />
              <rect x="13" y="4" width="8" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="12" height="16" rx="1" />
            </svg>
          )}
        </button>
        <button
          onClick={toggleDarkMode}
          className="ntqs-icon-btn"
          title="Chế độ sáng/tối"
        >
          {settings.dark ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
