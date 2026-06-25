'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { CorpusIssue } from '@/types/corpus'

interface CoverPageProps {
  issue: CorpusIssue
  issueId: string
  C: Record<string, string>
  twoPage?: boolean
}

export default function CoverPage({ issue, issueId, C, twoPage = true }: CoverPageProps) {
  const [hasCover2, setHasCover2] = useState(true)
  const [isWideScreen, setIsWideScreen] = useState(true)

  const cover1Src = `/data/issues/${issueId}/cover.jpg`
  const cover2Src = `/data/issues/${issueId}/cover_2.jpg`

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
      padding: '24px',
      boxSizing: 'border-box',
    }}>
      {showTwoPages ? (
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          maxWidth: '1200px',
          maxHeight: '100%',
          gap: '4px', // minimal gap to simulate a book spine
          boxSizing: 'border-box',
        }}>
          {/* Left Page: Cover 2 */}
          <div style={{
            position: 'relative',
            flex: 1,
            height: '100%',
            aspectRatio: '1 / 1.414',
            maxHeight: '100%',
            borderRadius: '8px 0 0 8px',
            overflow: 'hidden',
            boxShadow: '-10px 10px 25px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRight: 'none',
          }}>
            <Image
              src={cover2Src}
              alt="Bìa 2"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              priority
              onError={() => setHasCover2(false)}
            />
          </div>

          {/* Spine shadow in the middle */}
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '32px',
            background: 'linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.15))',
            pointerEvents: 'none',
            zIndex: 10,
          }} />

          {/* Right Page: Cover 1 */}
          <div style={{
            position: 'relative',
            flex: 1,
            height: '100%',
            aspectRatio: '1 / 1.414',
            maxHeight: '100%',
            borderRadius: '0 8px 8px 0',
            overflow: 'hidden',
            boxShadow: '10px 10px 25px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderLeft: 'none',
          }}>
            <Image
              src={cover1Src}
              alt="Bìa 1"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      ) : (
        /* Single Page: Cover 1 only (centered) */
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
          height: '100%',
          aspectRatio: '1 / 1.414',
          maxHeight: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}>
          <Image
            src={cover1Src}
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
