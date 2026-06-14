import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { FileText, User, Calendar, Tag, Download, Eye, ArrowLeft, BookOpen, Building2, Quote, ExternalLink, Lock } from 'lucide-react'

export const revalidate = 300

export async function generateMetadata({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id)
  if (!article) return { title: 'Không tìm thấy' }
  return {
    title: `${article.submission.title} | CSDL Bài báo`,
    description: article.submission.abstractVn?.slice(0, 160),
  }
}

async function getArticle(id: string) {
  return prisma.article.findUnique({
    where: { id, approvalStatus: 'APPROVED' },
    include: {
      submission: {
        include: {
          author: { select: { id: true, fullName: true, org: true, academicTitle: true, academicDegree: true } },
          category: true,
        },
      },
      issue: { include: { volume: true } },
    },
  })
}

export default async function RepositoryArticlePage({ params }: { params: { id: string } }) {
  const [article, session] = await Promise.all([
    getArticle(params.id),
    getServerSession(),
  ])

  if (!article) notFound()

  const isLoggedIn = !!session
  const sub = article.submission
  const keywords = sub.keywords ? (Array.isArray(sub.keywords) ? sub.keywords : JSON.parse(sub.keywords as string)) : []

  // Increment view count
  await prisma.article.update({
    where: { id: params.id },
    data: { views: { increment: 1 } },
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/repository" className="inline-flex items-center text-sky-600 hover:text-sky-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại CSDL bài báo
        </Link>

        {/* Main Content */}
        <Card className="bg-white dark:bg-gray-800 shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-sky-50 to-blue-50 dark:from-gray-800 dark:to-gray-750">
            <div className="flex items-start gap-3">
              <FileText className="h-8 w-8 text-sky-600 flex-shrink-0 mt-1" />
              <div>
                <Badge className="mb-2">{sub.category?.name || 'Chung'}</Badge>
                <CardTitle className="text-xl md:text-2xl text-gray-900 dark:text-white leading-tight">
                  {sub.title}
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Author Info */}
            <div className="flex flex-wrap items-center gap-4 text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-sky-600" />
                <span className="font-medium">
                  {sub.author.academicTitle && `${sub.author.academicTitle}. `}
                  {sub.author.academicDegree && `${sub.author.academicDegree}. `}
                  {sub.author.fullName}
                </span>
              </div>
              {sub.author.org && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Building2 className="h-4 w-4" />
                  <span>{sub.author.org}</span>
                </div>
              )}
            </div>

            {/* Issue & Date */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {article.issue && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Tập {article.issue.volume?.volumeNo}, Số {article.issue.number}/{article.issue.year}</span>
                </div>
              )}
              {article.publishedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Xuất bản: {new Date(article.publishedAt).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
              {article.pages && <span>Trang: {article.pages}</span>}
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Eye className="h-4 w-4" />
                <span>{article.views} lượt xem</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Download className="h-4 w-4" />
                <span>{article.downloads} lượt tải</span>
              </div>
            </div>

            <Separator />

            {/* Abstract */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tóm tắt</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {sub.abstractVn || 'Chưa có tóm tắt.'}
              </p>
            </div>

            {sub.abstractEn && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Abstract</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line italic">
                  {sub.abstractEn}
                </p>
              </div>
            )}

            {/* Keywords */}
            {keywords.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Từ khóa</h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      <Tag className="h-3 w-3 mr-1" />{kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* DOI */}
            {article.doiLocal && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4 text-gray-500" />
                <span className="text-gray-500">DOI:</span>
                <a href={`https://doi.org/${article.doiLocal}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                  {article.doiLocal}
                </a>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              {isLoggedIn ? (
                <>
                  <Button asChild className="bg-sky-600 hover:bg-sky-700">
                    <a href={`/api/repository/download/${article.id}`}>
                      <Download className="h-4 w-4 mr-2" /> Tải PDF
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/articles/${article.id}`}>
                      <Eye className="h-4 w-4 mr-2" /> Xem toàn văn
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Lock className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Đăng nhập để tải và xem toàn văn bài báo
                    </p>
                    <Link href="/login" className="text-sm text-sky-600 hover:underline">
                      Đăng nhập ngay →
                    </Link>
                  </div>
                </div>
              )}
              <Button variant="outline" asChild>
                <Link href={`/articles/${article.id}/citation`}>
                  <Quote className="h-4 w-4 mr-2" /> Trích dẫn
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
