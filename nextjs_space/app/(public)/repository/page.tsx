import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, FileText, Users, Calendar, Tag, Database, BookOpen } from 'lucide-react'
import RepositorySearch from './repository-search'

export const revalidate = 300

export const metadata = {
  title: 'Cơ sở dữ liệu bài báo | Tạp chí KHQS',
  description: 'Tra cứu cơ sở dữ liệu bài báo khoa học',
}

async function getStats() {
  const [totalArticles, totalAuthors, totalCategories, recentArticles] = await Promise.all([
    prisma.article.count({ where: { approvalStatus: 'APPROVED' } }),
    prisma.user.count({ where: { role: 'AUTHOR', isActive: true } }),
    prisma.category.count(),
    prisma.article.count({
      where: {
        approvalStatus: 'APPROVED',
        publishedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    })
  ])
  return { totalArticles, totalAuthors, totalCategories, recentArticles }
}

async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } })
}

async function getYears() {
  const issues = await prisma.issue.findMany({
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' }
  })
  return issues.map(i => i.year)
}

export default async function RepositoryPage() {
  const [stats, categories, years] = await Promise.all([
    getStats(),
    getCategories(),
    getYears()
  ])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Database className="h-10 w-10" />
            <h1 className="text-3xl font-bold">Cơ sở dữ liệu Bài báo Khoa học</h1>
          </div>
          <p className="text-sky-100 text-lg max-w-3xl">
            Tra cứu, tìm kiếm và truy cập toàn bộ các bài báo đã xuất bản trong hệ thống Tạp chí Khoa học Quân sự.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-sky-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-sky-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalArticles}</p>
                  <p className="text-sm text-gray-500">Bài báo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAuthors}</p>
                  <p className="text-sm text-gray-500">Tác giả</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Tag className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCategories}</p>
                  <p className="text-sm text-gray-500">Chuyên mục</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-rose-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recentArticles}</p>
                  <p className="text-sm text-gray-500">Bài mới (30 ngày)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Component */}
        <RepositorySearch categories={categories} years={years} />
      </div>
    </div>
  )
}
