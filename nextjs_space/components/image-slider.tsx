'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlideImage {
  id: string
  image: string
  linkUrl?: string
  altText?: string
}

interface ImageSliderProps {
  images: SlideImage[]
  autoPlayInterval?: number
  className?: string
  aspectRatio?: 'video' | 'wide' | 'banner'
}

export default function ImageSlider({
  images,
  autoPlayInterval = 5000,
  className,
  aspectRatio = 'banner'
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  // Auto-play
  useEffect(() => {
    if (images.length <= 1 || isHovered) return

    const interval = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(interval)
  }, [images.length, isHovered, autoPlayInterval, goToNext])

  if (!images || images.length === 0) {
    return (
      <div className={cn(
        'relative w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl flex items-center justify-center',
        aspectRatio === 'video' && 'aspect-video',
        aspectRatio === 'wide' && 'aspect-[21/9]',
        aspectRatio === 'banner' && 'aspect-[3/1]',
        className
      )}>
        <p className="text-gray-500">Chưa có ảnh slider</p>
      </div>
    )
  }

  const currentSlide = images[currentIndex]

  const SlideContent = (
    <div 
      className={cn(
        'relative w-full overflow-hidden rounded-xl shadow-lg',
        aspectRatio === 'video' && 'aspect-video',
        aspectRatio === 'wide' && 'aspect-[21/9]',
        aspectRatio === 'banner' && 'aspect-[3/1]',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides Container */}
      <div 
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((slide, index) => (
          <div key={slide.id} className="relative w-full h-full flex-shrink-0">
            <Image
              src={slide.image}
              alt={slide.altText || `Slide ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 900px"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Only show on hover */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); goToPrev() }}
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg',
              'flex items-center justify-center transition-all duration-300',
              'opacity-0 hover:opacity-100',
              isHovered && 'opacity-100'
            )}
            aria-label="Slide trước"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); goToNext() }}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg',
              'flex items-center justify-center transition-all duration-300',
              'opacity-0 hover:opacity-100',
              isHovered && 'opacity-100'
            )}
            aria-label="Slide tiếp theo"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.preventDefault(); goToSlide(index) }}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/80'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )

  // Wrap with Link if linkUrl exists
  if (currentSlide.linkUrl && currentSlide.linkUrl !== '#') {
    return (
      <Link href={currentSlide.linkUrl} className="block">
        {SlideContent}
      </Link>
    )
  }

  return SlideContent
}
