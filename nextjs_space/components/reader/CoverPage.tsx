import Image from 'next/image'
import type { CorpusIssue } from '@/types/corpus'
import { SERIF } from './types'

interface CoverPageProps {
  issue: CorpusIssue
  issueId: string
  C: Record<string, string>
}

export default function CoverPage({ issue, issueId, C }: CoverPageProps) {
  const coverSrc = `/data/issues/${issueId}/cover.jpg`

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Aspect ratio box that acts like a book cover (roughly 1:1.414) */}
      <div style={{
        containerType: 'size',
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        aspectRatio: '1 / 1.4',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6cqmin',
        textAlign: 'center',
      }}>
        {/* Elegant vintage double border */}
        <div style={{
          position: 'absolute', inset: '4cqmin',
          border: `1px solid ${C.accent}`,
          opacity: 0.6,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: '5.5cqmin',
          border: `2px solid ${C.accent}`,
          opacity: 0.8,
          pointerEvents: 'none',
        }} />

        <div style={{ 
          zIndex: 10, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '6cqmin',
        }}>
          {/* Top Text */}
          <div style={{
            fontFamily: SERIF,
            fontSize: '5cqmin',
            fontWeight: 700,
            color: C.accent,
            letterSpacing: '0.5cqmin',
            marginTop: '2cqmin',
          }}>
            Học viện Quốc phòng
          </div>

          {/* Center Text */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
              fontFamily: SERIF,
              fontSize: '11cqmin',
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.3,
              marginBottom: '6cqmin',
              letterSpacing: '0.2cqmin',
            }}>
              {issue.title}
            </div>

            <div style={{
              width: '15cqmin', height: '2px',
              background: C.accent,
              margin: '0 auto 6cqmin',
              opacity: 0.8,
            }} />

            <div style={{
              fontFamily: SERIF,
              fontSize: '8cqmin',
              fontWeight: 600,
              color: C.text,
            }}>
              {issue.name}
            </div>
          </div>

          {/* Bottom Text */}
          <div style={{
            fontFamily: SERIF,
            fontSize: '4.5cqmin',
            fontWeight: 700,
            color: C.accent,
            letterSpacing: '0.4cqmin',
            opacity: 0.9,
            marginBottom: '2cqmin',
          }}>
            Viện Khoa học Nghệ thuật Quân sự
          </div>
        </div>
      </div>
    </div>
  )
}
