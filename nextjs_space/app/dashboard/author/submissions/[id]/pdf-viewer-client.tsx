
'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { PDFViewerSimple } from '@/components/pdf-viewer-simple'
import { toast } from 'sonner'

interface PDFViewerClientProps {
  fileId: string
  fileName: string
}

/**
 * PDF Viewer for Author Dashboard
 * Fetches file URL from API and displays using simple iframe-based viewer
 */
export function PDFViewerClient({ fileId, fileName }: PDFViewerClientProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFileUrl = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Use /content endpoint to get the actual file stream URL
        const contentUrl = `/api/files/${fileId}/content`

        // Verify access by doing a HEAD-like check via the metadata endpoint
        const response = await fetch(`/api/files/${fileId}`)

        if (!response.ok) {
          throw new Error('Không thể tải file')
        }

        // Use the /content route directly — it streams the file with correct auth
        setFileUrl(contentUrl)
      } catch (err) {
        console.error('Error fetching file:', err)
        setError('Không thể tải file PDF. Vui lòng thử lại sau.')
        toast.error('Không thể tải file PDF')
      } finally {
        setIsLoading(false)
      }
    }

    if (fileId) {
      fetchFileUrl()
    }
  }, [fileId])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand mb-2" />
        <p className="text-sm text-gray-600">Đang tải PDF...</p>
      </div>
    )
  }

  if (error || !fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error || 'Không thể tải file'}</p>
      </div>
    )
  }

  return (
    <PDFViewerSimple
      fileUrl={fileUrl}
      fileName={fileName}
      title="Xem bản thảo"
      height="700px"
    />
  )
}
