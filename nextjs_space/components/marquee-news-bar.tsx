'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface MarqueeNewsBarProps {
  newsItems?: Array<{
    id: string
    title: string
    url?: string
    isImportant?: boolean
  }>
}

export default function MarqueeNewsBar({ newsItems = [] }: MarqueeNewsBarProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Default news if none provided
  const defaultNews = [
    {
      id: '1',
      title: '🔴 Thông báo: Tạp chí mở rộng nhận bài nghiên cứu về ứng dụng AI trong nghệ thuật quân sự',
      isImportant: true
    },
    {
      id: '2',
      title: '📢 Hội thảo Khoa học Quốc phòng 2025 - Đẩy mạnh nghiên cứu công nghệ trong quân sự hiện đại',
      isImportant: false
    },
    {
      id: '3',
      title: '⭐ Số mới nhất đã phát hành: Chiến lược Quân sự trong thời đại số',
      isImportant: false
    }
  ]

  const displayNews = newsItems.length > 0 ? newsItems : defaultNews
  
  // Duplicate news text for seamless loop
  const newsText = displayNews.map(item => item.title).join('   •   ')
  const duplicatedNewsText = newsText + '   •   ' + newsText

  if (!isClient) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-[#1a3d1f] via-[#2C5530] to-[#1a3d1f] text-yellow-300 py-4 sm:py-5 overflow-hidden relative border-y-4 border-yellow-400/40 shadow-2xl">
      <div className="absolute inset-0 bg-[url('/patterns/military-pattern.svg')] opacity-5"></div>
      <div className="relative flex items-center gap-4 px-4 sm:px-6">
        <div className="flex-shrink-0 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse text-yellow-400" />
          <span className="text-sm sm:text-base font-bold uppercase tracking-wider hidden sm:inline text-yellow-200">Tin nổi bật</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap text-base sm:text-lg font-bold">
            {duplicatedNewsText}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
