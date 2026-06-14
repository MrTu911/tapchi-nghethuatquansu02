'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X } from 'lucide-react'

interface ProductionFiltersProps {
  searchQuery: string
  onSearchChange: (v: string) => void
  categoryFilter: string
  onCategoryChange: (v: string) => void
  categories: string[]
}

export function ProductionFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
}: ProductionFiltersProps) {
  const hasFilter = searchQuery || (categoryFilter && categoryFilter !== 'ALL')

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Tìm theo mã, tiêu đề, tác giả..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue placeholder="Tất cả chuyên mục" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả chuyên mục</SelectItem>
          {categories.map(cat => (
            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilter && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { onSearchChange(''); onCategoryChange('ALL') }}
          title="Xóa bộ lọc"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
