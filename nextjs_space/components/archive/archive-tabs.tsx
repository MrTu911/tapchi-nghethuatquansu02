'use client'

import Link from 'next/link'
import { BookMarked, FileSearch, Clock, FolderTree } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IssueBookshelf, type MergedArchiveIssue } from './issue-bookshelf'
import ArticlesTableSection, { type ArticleData } from '@/components/articles-table-section'

export interface RecentArticleItem {
  id: string
  title: string
  authorName: string
  dateLabel: string
}

export interface TopCategoryItem {
  id: string
  name: string
  slug: string
  count: number
}

interface ArchiveTabsProps {
  issuesByYear: Record<string, MergedArchiveIssue[]>
  years: string[]
  articles: ArticleData[]
  categories: { id: string; name: string }[]
  recentArticles: RecentArticleItem[]
  topCategories: TopCategoryItem[]
}

function SectionHeader({ icon: Icon, title }: { icon: typeof Clock; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-5 w-1 rounded bg-[#8B1A1A]" aria-hidden="true" />
      <Icon className="h-4 w-4 text-[#8B1A1A] dark:text-[#C8960C]" />
      <h3 className="text-base font-bold uppercase tracking-wide text-content">{title}</h3>
    </div>
  )
}

export function ArchiveTabs({
  issuesByYear,
  years,
  articles,
  categories,
  recentArticles,
  topCategories,
}: ArchiveTabsProps) {
  return (
    <Tabs defaultValue="issues" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger
          value="issues"
          className="data-[state=active]:bg-[#8B1A1A] data-[state=active]:text-white"
        >
          <BookMarked className="h-4 w-4 mr-2" />
          Theo số tạp chí
        </TabsTrigger>
        <TabsTrigger
          value="articles"
          className="data-[state=active]:bg-[#8B1A1A] data-[state=active]:text-white"
        >
          <FileSearch className="h-4 w-4 mr-2" />
          Tra cứu bài báo
        </TabsTrigger>
      </TabsList>

      {/* Tab 1 — duyệt theo số + cột phụ */}
      <TabsContent value="issues" className="mt-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <IssueBookshelf issuesByYear={issuesByYear} years={years} />
          </div>

          <aside className="space-y-6">
            {recentArticles.length > 0 && (
              <Card className="card-bg">
                <CardContent className="p-5">
                  <SectionHeader icon={Clock} title="Bài báo mới nhất" />
                  <div className="space-y-2">
                    {recentArticles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/articles/${article.id}`}
                        className="block rounded-md border border-border p-3 transition-colors hover:border-[#8B1A1A]/40 hover:bg-[#8B1A1A]/5"
                      >
                        <h4 className="line-clamp-2 text-sm font-medium text-content">{article.title}</h4>
                        <p className="mt-1 text-xs text-content-muted">
                          {article.authorName} • {article.dateLabel}
                        </p>
                      </Link>
                    ))}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-4 w-full border-[#8B1A1A]/30 text-[#8B1A1A] hover:bg-[#8B1A1A]/5 dark:text-[#C8960C] dark:border-[#C8960C]/40"
                  >
                    <Link href="/articles">Xem tất cả bài báo</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {topCategories.length > 0 && (
              <Card className="card-bg">
                <CardContent className="p-5">
                  <SectionHeader icon={FolderTree} title="Lĩnh vực nổi bật" />
                  <div className="space-y-2">
                    {topCategories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:border-[#8B1A1A]/40 hover:bg-[#8B1A1A]/5"
                      >
                        <span className="text-sm font-medium text-content">{category.name}</span>
                        <Badge variant="secondary">{category.count}</Badge>
                      </Link>
                    ))}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-4 w-full border-[#8B1A1A]/30 text-[#8B1A1A] hover:bg-[#8B1A1A]/5 dark:text-[#C8960C] dark:border-[#C8960C]/40"
                  >
                    <Link href="/categories">Xem tất cả lĩnh vực</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </TabsContent>

      {/* Tab 2 — bảng tra cứu bài báo */}
      <TabsContent value="articles" className="mt-6">
        <ArticlesTableSection articles={articles} categories={categories} />
      </TabsContent>
    </Tabs>
  )
}
