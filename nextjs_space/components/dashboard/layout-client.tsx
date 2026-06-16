
'use client'

import { useState, useEffect, ReactNode } from 'react'
import DashboardHeader from '@/components/dashboard/header'
import DashboardSidebar from '@/components/dashboard/sidebar'
import { Breadcrumb } from '@/components/dashboard/breadcrumb'
import { DashboardSessionContext, type DashboardSession } from '@/components/dashboard/session-context'
import { VersionUpdateBanner } from '@/components/dashboard/version-update-banner'

interface DashboardLayoutClientProps {
  session: DashboardSession
  children: ReactNode
}

export default function DashboardLayoutClient({ session, children }: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile sidebar on Escape key — accessibility + quick dismiss
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMobileMenuOpen])

  return (
    <DashboardSessionContext.Provider value={session}>
      {/* Skip to main content — keyboard users jump past repeated nav */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-md focus:bg-amber-500 focus:text-military-900 focus:font-semibold focus:shadow-lg focus:outline-none"
      >
        Chuyển đến nội dung chính
      </a>

      <VersionUpdateBanner />
      <DashboardHeader
        session={session}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <div className="flex flex-1">
        <DashboardSidebar
          role={session.role}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 overflow-x-auto overflow-y-auto focus:outline-none"
        >
          <div className="p-4 md:p-6">
            <Breadcrumb />
            {children}
          </div>
        </main>
      </div>
    </DashboardSessionContext.Provider>
  )
}
