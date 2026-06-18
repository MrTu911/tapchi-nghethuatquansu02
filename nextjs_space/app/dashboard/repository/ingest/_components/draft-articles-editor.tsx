'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, Trash2, Plus, AlertTriangle } from 'lucide-react'

export interface DraftArticleRow {
  title: string
  authorsText: string
  section: string
  pageStart: number
  confidence: 'high' | 'low'
}

interface DraftArticlesEditorProps {
  articles: DraftArticleRow[]
  onChange: (articles: DraftArticleRow[]) => void
}

/**
 * Bảng sửa danh sách bài draft trước khi số hóa.
 * Tô đỏ dòng confidence thấp (thiếu tác giả / tên ngắn) để biên tập viên kiểm tra.
 */
export function DraftArticlesEditor({ articles, onChange }: DraftArticlesEditorProps) {
  const update = (index: number, patch: Partial<DraftArticleRow>) => {
    const next = articles.map((a, i) => (i === index ? { ...a, ...patch } : a))
    onChange(next)
  }

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= articles.length) return
    const next = [...articles]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const remove = (index: number) => onChange(articles.filter((_, i) => i !== index))

  const add = () =>
    onChange([...articles, { title: '', authorsText: '', section: '', pageStart: 1, confidence: 'low' }])

  const lowCount = articles.filter((a) => a.confidence === 'low').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {articles.length} bài
          {lowCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" /> {lowCount} dòng cần kiểm tra
            </span>
          )}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Thêm bài
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="w-10 p-2">#</th>
              <th className="w-44 p-2">Chuyên mục</th>
              <th className="p-2">Tên bài</th>
              <th className="w-56 p-2">Tác giả</th>
              <th className="w-20 p-2">Trang</th>
              <th className="w-28 p-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Chưa có bài nào. Bấm “Thêm bài” để nhập thủ công.
                </td>
              </tr>
            )}
            {articles.map((article, index) => (
              <tr
                key={index}
                className={article.confidence === 'low' ? 'border-l-2 border-amber-400 bg-amber-50/50' : 'border-t'}
              >
                <td className="p-2 align-top text-muted-foreground">{index + 1}</td>
                <td className="p-2 align-top">
                  <Input
                    value={article.section}
                    placeholder="Chuyên mục"
                    onChange={(e) => update(index, { section: e.target.value })}
                  />
                </td>
                <td className="p-2 align-top">
                  <Input
                    value={article.title}
                    placeholder="Tên bài"
                    onChange={(e) =>
                      update(index, {
                        title: e.target.value,
                        confidence: e.target.value.length >= 8 && article.authorsText ? 'high' : 'low',
                      })
                    }
                  />
                </td>
                <td className="p-2 align-top">
                  <Input
                    value={article.authorsText}
                    placeholder="Tác giả"
                    onChange={(e) =>
                      update(index, {
                        authorsText: e.target.value,
                        confidence: article.title.length >= 8 && e.target.value ? 'high' : 'low',
                      })
                    }
                  />
                </td>
                <td className="p-2 align-top">
                  <Input
                    type="number"
                    min={1}
                    value={article.pageStart}
                    onChange={(e) => update(index, { pageStart: parseInt(e.target.value, 10) || 1 })}
                  />
                </td>
                <td className="p-2 align-top">
                  <div className="flex justify-end gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(index, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        <Badge variant="outline" className="mr-1">Mẹo</Badge>
        Trang bắt đầu là số trang IN trên giấy. Trang kết thúc mỗi bài tự suy từ bài kế tiếp.
      </p>
    </div>
  )
}
