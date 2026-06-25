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
      padding: '0px', // Completely remove padding around the covers
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
          boxSizing: 'border-box',
        }}>
          {/* Left Page: Cover 2 */}
          <div style={{
            position: 'relative',
            flex: 1,
            height: '100%',
            aspectRatio: '1 / 1.414',
            maxHeight: '100%',
            overflow: 'hidden',
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

          {/* Right Page: Cover 1 */}
          <div style={{
            position: 'relative',
            flex: 1,
            height: '100%',
            aspectRatio: '1 / 1.414',
            maxHeight: '100%',
            overflow: 'hidden',
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
          height: '100%',
          aspectRatio: '1 / 1.414',
          maxHeight: '100%',
          overflow: 'hidden',
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
