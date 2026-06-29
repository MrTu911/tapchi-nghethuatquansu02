
import { ArticleCard } from '@/components/article-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, User, Eye, Download, BookOpen, ArrowLeft, FileText, Hash, Quote } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import components to avoid React Hooks errors
const ShareButton = dynamic(() => import('@/components/share-button').then(mod => ({ default: mod.ShareButton })), {
  ssr: false,
  loading: () => <Button variant="outline" disabled>Chia sẻ</Button>
})

const ScrollProgress = dynamic(() => import('@/components/scroll-progress').then(mod => ({ default: mod.ScrollProgress })), {
  ssr: false
})

const PDFViewerSimple = dynamic(() => import('@/components/pdf-viewer-simple').then(mod => ({ default: mod.PDFViewerSimple })), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
})

const TableOfContents = dynamic(() => import('@/components/table-of-contents').then(mod => ({ default: mod.TableOfContents })), {
  ssr: false
})

const ArticleComments = dynamic(() => import('@/components/article-comments').then(mod => ({ default: mod.ArticleComments })), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-lg" />
})

const CitationBox = dynamic(() => import('@/components/citation-box').then(mod => ({ default: mod.CitationBox })), {
  ssr: false
})

// Get article by ID
async function getArticle(id: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/articles/${id}`, {
      next: { revalidate: 300 }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch article')
    }
    
    const data = await response.json()
    return {
      article: data.article,
      relatedArticles: data.relatedArticles || []
    }
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const articleData = await getArticle(id)
  
  if (!articleData) {
    return {
      title: 'Không tìm thấy bài báo',
      description: 'Bài báo không tồn tại hoặc đã bị xóa.'
    }
  }

  const { article } = articleData
  
  return {
    title: article.submission.title,
    description: article.submission.abstractVn || article.submission.abstractEn || 'Bài báo khoa học',
    openGraph: {
      title: article.submission.title,
      description: article.submission.abstractVn || article.submission.abstractEn,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.submission.author.fullName],
    },
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params
  const articleData = await getArticle(id)

  if (!articleData) {
    notFound()
  }

  const { article, relatedArticles } = articleData

  // Prepare citation data
  const citationData = {
    title: article.submission.title,
    authors: article.submission.author.fullName,
    year: article.publishedAt ? new Date(article.publishedAt).getFullYear().toString() : new Date().getFullYear().toString(),
    volume: article.issue?.volume?.volumeNo?.toString() || article.issue?.year?.toString(),
    issue: article.issue?.number?.toString(),
    pages: article.pages || undefined,
    doi: article.doiLocal || undefined,
    journal: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
  }

  return (
    <>
      {/* Scroll Progress Bar */}
      <ScrollProgress />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="max-w-[1400px] mx-auto px-0 sm:px-0 py-8">
          {/* Back Button */}
          <div className="mb-8">
            <Button asChild variant="ghost" className="hover:bg-emerald-50">
              <Link href="/articles">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Trở lại danh sách
              </Link>
            </Button>
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-8">
            {/* Left Sidebar - Article Info */}
            <aside className="space-y-6 order-2 lg:order-1">
              {/* Article Info Card */}
              <Card className="shadow-lg sticky top-8">
                <CardContent className="p-6">
                  {/* Category Badge */}
                  {article.submission.category && (
                    <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 w-full justify-center py-2">
                      {article.submission.category.name}
                    </Badge>
                  )}

                  {/* Author Info */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-xl shadow-md">
                        {article.submission.author.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tác giả</p>
                        <p className="font-semibold text-gray-900 text-sm leading-tight">
                          {article.submission.author.fullName}
                        </p>
                      </div>
                    </div>
                    {article.submission.author.org && (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {article.submission.author.org}
                      </p>
                    )}
                    {article.submission.author.email && (
                      <a href={`mailto:${article.submission.author.email}`} className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline mt-2 inline-block">
                        {article.submission.author.email}
                      </a>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                    {article.publishedAt && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ngày xuất bản</p>
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Calendar className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span>{new Date(article.publishedAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      </div>
                    )}
                    {article.issue && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Xuất bản trong</p>
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <FileText className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span>
                            Tập {article.issue.volume?.volumeNo || article.issue.year}, Số {article.issue.number} ({article.issue.year})
                          </span>
                        </div>
                      </div>
                    )}
                    {article.pages && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Trang</p>
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <BookOpen className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span>{article.pages}</span>
                        </div>
                      </div>
                    )}
                    {article.doiLocal && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">DOI</p>
                        <a
                          href={`https://doi.org/${article.doiLocal}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 p-2 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors group"
                        >
                          {/* DOI badge */}
                          <span className="shrink-0 text-[10px] font-bold bg-blue-600 text-white px-1 py-0.5 rounded uppercase tracking-wide">
                            DOI
                          </span>
                          <span className="font-mono text-blue-700 text-xs break-all group-hover:underline">
                            {article.doiLocal}
                          </span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="flex flex-col items-center gap-2 px-3 py-3 bg-blue-50 rounded-lg">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <span className="font-bold text-blue-900 text-lg">{article.views?.toLocaleString() || 0}</span>
                      <span className="text-xs text-blue-700">lượt xem</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 px-3 py-3 bg-green-50 rounded-lg">
                      <Download className="h-5 w-5 text-green-600" />
                      <span className="font-bold text-green-900 text-lg">{article.downloads?.toLocaleString() || 0}</span>
                      <span className="text-xs text-green-700">tải về</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {article.pdfFile && (
                      <Button asChild className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md">
                        <Link href={article.pdfFile} target="_blank">
                          <Download className="h-4 w-4 mr-2" />
                          Tải toàn văn PDF
                        </Link>
                      </Button>
                    )}
                    
                    <ShareButton 
                      title={article.submission.title}
                      text={article.submission.abstractVn || ''}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Citation Box */}
              <CitationBox article={citationData} />

              {/* Table of Contents */}
              {article.htmlBody && <TableOfContents />}
            </aside>

            {/* Main Content - Center */}
            <div className="space-y-6 order-1 lg:order-2">
              {/* Article Header */}
              <article className="bg-white rounded-2xl shadow-lg p-8 lg:p-10 border border-gray-100">
                {/* Title */}
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8 leading-tight font-serif">
                  {article.submission.title}
                </h1>

                {/* Abstract */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Quote className="h-6 w-6 text-emerald-700" />
                    <h2 className="text-xl font-bold text-emerald-900">Tóm tắt</h2>
                  </div>
                  
                  {article.submission.abstractVn && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-emerald-900 mb-2 uppercase tracking-wide">Tiếng Việt</h3>
                      <p className="text-gray-800 leading-relaxed text-justify">
                        {article.submission.abstractVn}
                      </p>
                    </div>
                  )}

                  {article.submission.abstractEn && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-emerald-900 mb-2 uppercase tracking-wide">Abstract</h3>
                      <p className="text-gray-800 leading-relaxed text-justify italic">
                        {article.submission.abstractEn}
                      </p>
                    </div>
                  )}

                  {/* Keywords */}
                  {article.submission.keywords?.length > 0 && (
                    <div className="pt-4 border-t border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="h-4 w-4 text-emerald-700" />
                        <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wide">Từ khóa</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {article.submission.keywords.map((keyword: string) => (
                          <Badge 
                            key={keyword} 
                            className="bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-3 py-1"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>

              {/* PDF Viewer - CENTER STAGE */}
              {article.pdfFile && (
                <Card className="shadow-xl border-2 border-emerald-100">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-white" />
                        <h2 className="text-xl font-bold text-white">Toàn văn bài báo</h2>
                      </div>
                      <Button asChild variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <Link href={article.pdfFile} target="_blank">
                          <Download className="h-4 w-4 mr-2" />
                          Tải về
                        </Link>
                      </Button>
                    </div>
                    <div className="p-4">
                      <PDFViewerSimple 
                        fileUrl={article.pdfFile}
                        title={article.submission.title}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Article Content */}
              {article.htmlBody && (
                <Card className="shadow-md">
                  <CardContent className="p-8 lg:p-10">
                    <div 
                      className="article-content prose prose-lg prose-emerald max-w-none 
                        prose-headings:font-serif prose-headings:text-gray-900 prose-headings:font-bold
                        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-emerald-200 prose-h2:pb-2
                        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-justify prose-p:mb-4
                        prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:text-emerald-700 hover:prose-a:underline
                        prose-img:rounded-xl prose-img:shadow-lg prose-img:my-6
                        prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:italic
                        prose-strong:text-gray-900 prose-strong:font-semibold
                        prose-ul:my-4 prose-ol:my-4 prose-li:my-2
                        prose-code:text-emerald-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:shadow-lg
                        prose-table:border-collapse prose-table:my-6 
                        prose-th:bg-emerald-50 prose-th:border prose-th:border-emerald-200 prose-th:p-3 prose-th:text-left prose-th:font-semibold
                        prose-td:border prose-td:border-gray-200 prose-td:p-3"
                      dangerouslySetInnerHTML={{ __html: article.htmlBody }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles?.length > 0 && (
            <div className="mt-16 pt-12 border-t border-gray-200">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 font-serif">Bài báo liên quan</h2>
                <Button asChild variant="outline" className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300">
                  <Link href={`/categories/${article.submission.category?.slug}`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Xem thêm
                  </Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedArticles?.slice(0, 3)?.map((relatedArticle: any) => (
                  <ArticleCard 
                    key={relatedArticle.id} 
                    article={relatedArticle}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <ArticleComments articleId={article.id} />
          </div>
        </div>
      </div>
    </>
  )
}
