"use client"

import { useState, type KeyboardEvent } from 'react'
import { X, Tag as TagIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewsTagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  suggestions?: string[]
  maxTags?: number
}

/**
 * Nhập thẻ tag dạng "chip": thêm bằng Enter/dấu phẩy, xóa bằng nút X hoặc Backspace.
 * Tự loại trùng và khoảng trắng thừa. Thay cho ô input nhập chuỗi ngăn cách bằng dấu phẩy.
 */
export function NewsTagInput({
  value,
  onChange,
  placeholder = 'Nhập thẻ rồi nhấn Enter...',
  suggestions = [],
  maxTags = 20,
}: NewsTagInputProps) {
  const [draft, setDraft] = useState('')

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,+$/, '').trim()
    if (!tag) return
    if (value.length >= maxTags) return
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, tag])
    setDraft('')
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  const availableSuggestions = suggestions.filter(
    (s) => !value.some((t) => t.toLowerCase() === s.toLowerCase()),
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring">
        <TagIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-[#1E3924]/10 px-2 py-0.5 text-xs font-medium text-[#1E3924] dark:bg-emerald-900/30 dark:text-emerald-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="rounded-full p-0.5 hover:bg-[#1E3924]/20"
              aria-label={`Xóa thẻ ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] text-gray-400">Gợi ý:</span>
          {availableSuggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className={cn(
                'rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[11px] text-gray-500',
                'hover:border-[#1E3924] hover:text-[#1E3924] dark:hover:border-emerald-400 dark:hover:text-emerald-400',
              )}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
