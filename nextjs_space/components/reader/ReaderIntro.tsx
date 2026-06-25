'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, useAnimation } from 'framer-motion'
import { ReaderSettings } from './types'
import CoverPage from './CoverPage'
import EditorialPage from './EditorialPage'
import type { Corpus } from '@/types/corpus'

interface ReaderIntroProps {
  corpus: Corpus
  issueId: string
  settings: ReaderSettings
  C: any
  readerControls: any
}

export default function ReaderIntro({ corpus, issueId, settings, C, readerControls }: ReaderIntroProps) {
  const [introState, setIntroState] = useState<{ rect: any, ready: boolean }>({ rect: null, ready: false })
  const [introDone, setIntroDone] = useState(false)
  const [hasCover2, setHasCover2] = useState(true)
  const coverControls = useAnimation()
  const flipControls = useAnimation()

  useEffect(() => {
    const str = sessionStorage.getItem('book_origin_rect')
    if (str) {
      setIntroState({ rect: JSON.parse(str), ready: true })
      sessionStorage.removeItem('book_origin_rect')
    } else {
      setIntroState({ rect: null, ready: true })
    }
  }, [])

  useEffect(() => {
    if (!introState.ready) return
    async function runAnim() {
      await new Promise(r => requestAnimationFrame(r))
      await new Promise(r => setTimeout(r, 50))

      try {
        const targetH = window.innerHeight * 0.75
        
        let startWidth = targetH * 0.7
        let startHeight = targetH
        let startX = window.innerWidth / 2 - startWidth / 2
        let startY = window.innerHeight / 2 - startHeight / 2
        let hasRect = false

        if (introState.rect && introState.rect.width > 0 && introState.rect.height > 0) {
          startWidth = introState.rect.width
          startHeight = introState.rect.height
          startX = introState.rect.x
          startY = introState.rect.y
          hasRect = true
        }

        const targetW = targetH * (startWidth / startHeight)
        const targetTop = (window.innerHeight - targetH) / 2
        const targetLeft = window.innerWidth / 2 // Spine at center

        // Phase 1: Fly to center-right as a 3D book
        coverControls.set({
          top: startY, left: startX, width: startWidth, height: startHeight,
          borderRadius: 6, opacity: 1
        })

        await coverControls.start({
          top: targetTop,
          left: targetLeft,
          width: targetW,
          height: targetH,
          borderRadius: 4,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          transition: { duration: hasRect ? 1.0 : 0.4, ease: [0.32, 0.72, 0, 1] }
        })

        // Phase 2: Flip open the cover
        await flipControls.start({
          rotateY: -160,
          transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
        })

        // Phase 3: Zoom into the pages & fade in reader UI
        readerControls.start({ opacity: 1, transition: { duration: 0.6 } })
        await coverControls.start({
          top: 0, left: 0, width: window.innerWidth, height: window.innerHeight,
          opacity: 0,
          borderRadius: 0,
          boxShadow: '0 0px 0px rgba(0,0,0,0)',
          transition: { duration: 0.8, ease: [0.32, 0.72, 0, 1] }
        })
      } catch (e) {
        console.error('Intro animation error:', e)
        readerControls.set({ opacity: 1 })
      } finally {
        setIntroDone(true)
      }
    }
    runAnim()
  }, [introState, coverControls, flipControls, readerControls])

  if (introDone || !introState.ready) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, perspective: '3000px', pointerEvents: 'none' }}>
      {/* Main Book Container */}
      <motion.div
        animate={coverControls}
        style={{ position: 'absolute', transformStyle: 'preserve-3d' }}
      >
        {/* The First Page (Revealed under the cover - Right side) */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'transparent', // Remove sepia background under cover
          borderRadius: 'inherit',
          borderRight: 'none', // Remove page border under cover
          overflow: 'hidden', 
          transform: 'translateZ(-1px)', // Fix Z-fighting with the cover
        }}>
          {/* Render the actual title page here so it looks like a real book opening */}
          <CoverPage issue={corpus.issue} issueId={issueId} C={C} twoPage={false} />
        </div>

        {/* The Flappable Cover */}
        <motion.div
          initial={{ rotateY: 0 }}
          animate={flipControls}
          style={{
            position: 'absolute', inset: 0,
            transformOrigin: 'left center',
            transformStyle: 'preserve-3d',
            boxShadow: settings.dark ? '10px 0 30px rgba(0,0,0,0.8)' : '10px 0 30px rgba(58,42,38,0.4)',
          }}
        >
          {/* Front Cover Image */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            backfaceVisibility: 'hidden', 
            backgroundImage: `url(/data/issues/${issueId}/cover.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 'inherit',
            borderRight: `2px solid ${settings.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }} />

          {/* Back Cover (Inside of the cover - Left side) */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: hasCover2 ? 'transparent' : (settings.dark ? '#1A1614' : '#E8DFCC'), // Transparent when Cover 2 is present
            borderLeft: hasCover2 ? 'none' : `2px solid ${settings.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            borderRadius: 'inherit',
            overflow: 'hidden' 
          }}>
            {hasCover2 ? (
              <Image
                src={`/data/issues/${issueId}/cover_2.jpg`}
                alt="Bìa 2"
                fill
                sizes="50vw"
                className="object-contain"
                priority
                onError={() => setHasCover2(false)}
              />
            ) : (
              <EditorialPage C={C} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
