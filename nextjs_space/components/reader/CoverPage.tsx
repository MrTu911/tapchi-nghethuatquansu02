'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { CorpusIssue } from '@/types/corpus'

interface CoverPageProps {
  issue: CorpusIssue
  issueId: string
  C: Record<string, string>
  twoPage?: boolean
  isBack?: boolean
}

export default function CoverPage({ issue, issueId, C, twoPage = true, isBack = false }: CoverPageProps) {
  const [hasCover2, setHasCover2] = useState(true)
  const [isWideScreen, setIsWideScreen] = useState(true)

  const cover1Src = isBack ? `/data/issues/${issueId}/cover_3.jpg` : `/data/issues/${issueId}/cover.jpg`
  const cover2Src = isBack ? `/data/issues/${issueId}/cover_4.jpg` : `/data/issues/${issueId}/cover_2.jpg`
  const singleCoverSrc = isBack ? `/data/issues/${issueId}/cover_4.jpg` : `/data/issues/${issueId}/cover.jpg`

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const showTwoPages = twoPage && isWideScreen && hasCover2

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0px',
      boxSizing: 'border-box',
    }}>
      {showTwoPages ? (
        /* Two-Page Spread: Container locked to combined aspect ratio (2 / 1.414) */
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          aspectRatio: '2 / 1.414', // Locked combined aspect ratio (approx 1.414)
          maxHeight: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Left Page: Cover 1 / 3 */}
          <div style={{
            position: 'relative',
            width: '50%',
            height: '100%',
            overflow: 'hidden',
          }}>
            <Image
              src={cover1Src}
              alt={isBack ? "Bìa 3" : "Bìa 1"}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Right Page: Cover 2 / 4 */}
          <div style={{
            position: 'relative',
            width: '50%',
            height: '100%',
            overflow: 'hidden',
          }}>
            <Image
              src={cover2Src}
              alt={isBack ? "Bìa 4" : "Bìa 2"}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              priority
              onError={() => setHasCover2(false)}
            />
          </div>
        </div>
      ) : (
        /* Single Page: Cover 1 / 4 only (centered, aspect ratio 1 / 1.414) */
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          aspectRatio: '1 / 1.414',
          maxHeight: '100%',
          overflow: 'hidden',
        }}>
          <Image
            src={singleCoverSrc}
            alt="Bìa chính"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
            priority
          />
        </div>
      )}
    </div>
  )
}
