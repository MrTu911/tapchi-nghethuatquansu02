'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import {
  FileText, Download, Eye, TrendingUp, Calendar, Users, BookOpen,
  Loader2, RefreshCw, Filter
} from 'lucide-react'

interface StatsData {
  overview: {
    totalArticles: number
    totalDownloads: number
    totalViews: number
    thisMonthArticles: number
    thisMonthDownloads: number
    avgDownloadsPerArticle: number
  }
  byYear: Array<{ year: number; count: number; downloads: number; views: number }>
  byCategory: Array<{ name: string; count: number; downloads: number }>
  topArticles: Array<{ id: string; title: string; downloads: number; views: number }>
  monthlyTrend: Array<{ month: string; articles: number; downloads: number }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function RepositoryStatsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [yearFilter, setYearFilter] = useState<string>('all')

  useEffect(() => {
    fetchStats()
  }, [yearFilter])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/repository/stats?year=${yearFilter}`)
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      } else {
        toast.error('Lỗi tải dữ liệu thống kê')
      }
    } catch (error) {
      toast.error('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Không có dữ liệu thống kê</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thống kê Kho bài báo</h1>
          <p className="text-muted-foreground">Phân tích lượt xem, tải và xu hướng xuất bản</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {[2026, 2025, 2024, 2023, 2022].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-700">Tổng bài</span>
            </div>
            <p className="text-3xl font-bold text-blue-800 mt-2">{stats.overview.totalArticles}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700">Lượt tải</span>
            </div>
            <p className="text-3xl font-bold text-green-800 mt-2">{stats.overview.totalDownloads.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-purple-700">Lượt xem</span>
            </div>
            <p className="text-3xl font-bold text-purple-800 mt-2">{stats.overview.totalViews.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-amber-700">Tháng này</span>
            </div>
            <p className="text-3xl font-bold text-amber-800 mt-2">+{stats.overview.thisMonthArticles}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-rose-600" />
              <span className="text-sm text-rose-700">Tải/tháng</span>
            </div>
            <p className="text-3xl font-bold text-rose-800 mt-2">{stats.overview.thisMonthDownloads}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-600" />
              <span className="text-sm text-cyan-700">TB tải/bài</span>
            </div>
            <p className="text-3xl font-bold text-cyan-800 mt-2">{stats.overview.avgDownloadsPerArticle.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* By Year Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Xuất bản theo năm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byYear}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Số bài" fill="#3b82f6" />
                <Bar dataKey="downloads" name="Lượt tải" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Phân bố theo chuyên mục
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.byCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Xu hướng hàng tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="articles" name="Bài mới" stroke="#3b82f6" fill="#93c5fd" />
                <Area type="monotone" dataKey="downloads" name="Lượt tải" stroke="#10b981" fill="#6ee7b7" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top 10 bài được tải nhiều nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {stats.topArticles.map((article, idx) => (
                <div key={article.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center font-bold">
                    {idx + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{article.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" /> {article.downloads}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {article.views}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
