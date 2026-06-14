
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AnalyticsExportButton from '@/components/dashboard/analytics-export-button';

interface EditorAnalytics {
  overview: {
    totalSubmissions: number;
    activeSubmissions: number;
    completedSubmissions: number;
    avgProcessingDays: number;
    acceptanceRate: number;
  };
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
  }>;
  timeline: Array<{
    month: string;
    submitted: number;
    accepted: number;
    rejected: number;
  }>;
  reviewerWorkload: {
    totalActiveReviewers: number;
    avgReviewsPerReviewer: number;
    overloadedReviewers: number;
  };
  performanceMetrics: {
    avgReviewTurnaroundDays: number;
    avgRevisionTurnaroundDays: number;
    avgTimeToDecision: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  DESK_REJECT: '#ef4444',
  UNDER_REVIEW: '#f59e0b',
  REVISION: '#8b5cf6',
  ACCEPTED: '#10b981',
  REJECTED: '#dc2626',
  IN_PRODUCTION: '#06b6d4',
  PUBLISHED: '#059669'
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới nộp',
  DESK_REJECT: 'Từ chối sơ bộ',
  UNDER_REVIEW: 'Đang phản biện',
  REVISION: 'Yêu cầu sửa',
  ACCEPTED: 'Chấp nhận',
  REJECTED: 'Từ chối',
  IN_PRODUCTION: 'Sản xuất',
  PUBLISHED: 'Đã xuất bản'
};

// Reviewer performance types (from /api/statistics/reviewers-advanced)
interface ReviewerReliability {
  reviewerId: string;
  reviewerName: string;
  completionRate: number;
  avgResponseDays: number;
  score: number;
}

interface ReviewerOnTime {
  reviewerId: string;
  reviewerName: string;
  onTime: number;
  late: number;
  rate: number;
}

interface ReviewerLoad {
  reviewerId: string;
  reviewerName: string;
  activeReviews: number;
  completedReviews: number;
  totalAssigned: number;
}

interface ReviewerAdvancedData {
  reliabilityScore: ReviewerReliability[];
  onTimeRate: { overall: number; byReviewer: ReviewerOnTime[] };
  loadDistribution: ReviewerLoad[];
  overview: {
    totalReviewers: number;
    activeReviewers: number;
    avgLoad: number;
    overloadedCount: number;
  };
}

export default function EICAnalyticsPage() {
  const [analytics, setAnalytics] = useState<EditorAnalytics | null>(null);
  const [trend, setTrend] = useState<Array<{ month: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [reviewerData, setReviewerData] = useState<ReviewerAdvancedData | null>(null);
  const [reviewerLoading, setReviewerLoading] = useState(false);
  const [reviewerError, setReviewerError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Lazy-load reviewer performance when tab first activated
  useEffect(() => {
    if (activeTab === 'reviewers' && !reviewerData && !reviewerLoading) {
      fetchReviewerData();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/statistics/editor');

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.data.analytics);
      setTrend(data.data.trend);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewerData = async () => {
    try {
      setReviewerLoading(true);
      setReviewerError(null);
      const response = await fetch('/api/statistics/reviewers-advanced');
      if (!response.ok) throw new Error('Failed to fetch reviewer data');
      const json = await response.json();
      setReviewerData(json.data);
    } catch (err: any) {
      setReviewerError(err.message);
    } finally {
      setReviewerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-[300px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Lỗi</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Không thể tải dữ liệu analytics'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Tổng quan và phân tích toàn hệ thống
          </p>
        </div>
        <AnalyticsExportButton className="mt-1 shrink-0" />
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bài nộp</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.overview.activeSubmissions} đang xử lý
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ chấp nhận</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.acceptanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.overview.completedSubmissions} bài hoàn tất
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời gian xử lý TB</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.avgProcessingDays.toFixed(0)} ngày
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Từ nộp đến quyết định
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phản biện viên</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.reviewerWorkload.totalActiveReviewers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.reviewerWorkload.overloadedReviewers > 0 && (
                <span className="text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {analytics.reviewerWorkload.overloadedReviewers} quá tải
                </span>
              )}
              {analytics.reviewerWorkload.overloadedReviewers === 0 && 'Workload ổn định'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Xu hướng</TabsTrigger>
          <TabsTrigger value="status">Trạng thái</TabsTrigger>
          <TabsTrigger value="category">Chuyên mục</TabsTrigger>
          <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
          <TabsTrigger value="reviewers">Phản biện viên</TabsTrigger>
        </TabsList>

        {/* Timeline Chart */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Số lượng bài nộp theo tháng</CardTitle>
              <CardDescription>12 tháng gần nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Số bài nộp"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Distribution */}
        <TabsContent value="status">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố theo trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.byStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry: any) => STATUS_LABELS[entry.status as string] || entry.status}
                    >
                      {analytics.byStatus.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STATUS_COLORS[entry.status] || '#94a3b8'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chi tiết trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.byStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: STATUS_COLORS[item.status] }}
                        />
                        <span className="text-sm font-medium">
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.count}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Category Distribution */}
        <TabsContent value="category">
          <Card>
            <CardHeader>
              <CardTitle>Bài nộp theo chuyên mục</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoryName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" name="Số bài" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics */}
        <TabsContent value="performance">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hiệu suất xử lý</CardTitle>
                <CardDescription>Thời gian trung bình (ngày)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Phản biện</span>
                      <span className="text-2xl font-bold">
                        {analytics.performanceMetrics.avgReviewTurnaroundDays.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Thời gian từ mời đến hoàn tất phản biện
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Quyết định</span>
                      <span className="text-2xl font-bold">
                        {analytics.performanceMetrics.avgTimeToDecision.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Thời gian từ nộp đến quyết định cuối
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workload phản biện viên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Tổng phản biện viên</span>
                      <span className="text-2xl font-bold">
                        {analytics.reviewerWorkload.totalActiveReviewers}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Trung bình review/người</span>
                      <span className="text-2xl font-bold">
                        {analytics.reviewerWorkload.avgReviewsPerReviewer.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {analytics.reviewerWorkload.overloadedReviewers > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-orange-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {analytics.reviewerWorkload.overloadedReviewers} phản biện viên đang quá tải
                        </span>
                      </div>
                      <p className="text-xs text-orange-700 mt-1">
                        Cân nhắc phân phối lại workload hoặc tuyển thêm reviewer
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reviewer Performance Tab */}
        <TabsContent value="reviewers">
          {reviewerLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {reviewerError && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-destructive text-sm">{reviewerError}</p>
              </CardContent>
            </Card>
          )}

          {reviewerData && (
            <div className="space-y-6">
              {/* Overview strip */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{reviewerData.overview.activeReviewers}</div>
                    <p className="text-xs text-muted-foreground mt-1">Phản biện viên hoạt động</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{reviewerData.overview.avgLoad.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Trung bình bài/người</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{reviewerData.onTimeRate.overall.toFixed(0)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Tỷ lệ đúng hạn tổng thể</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className={`text-2xl font-bold ${reviewerData.overview.overloadedCount > 0 ? 'text-orange-600' : ''}`}>
                      {reviewerData.overview.overloadedCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Phản biện viên quá tải</p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance leaderboard table */}
              <Card>
                <CardHeader>
                  <CardTitle>Bảng xếp hạng hiệu suất phản biện</CardTitle>
                  <CardDescription>
                    Điểm tổng hợp = Hoàn thành (50%) + Đúng hạn (30%) + Tốc độ (20%)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 text-muted-foreground">
                          <th className="px-4 py-3 text-left font-medium w-10">#</th>
                          <th className="px-4 py-3 text-left font-medium">Tên phản biện viên</th>
                          <th className="px-4 py-3 text-left font-medium min-w-[140px]">Điểm tổng hợp</th>
                          <th className="px-4 py-3 text-right font-medium">Hoàn thành</th>
                          <th className="px-4 py-3 text-right font-medium">Đúng hạn</th>
                          <th className="px-4 py-3 text-right font-medium">TB ngày</th>
                          <th className="px-4 py-3 text-right font-medium">Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewerData.reliabilityScore.map((reviewer, index) => {
                          const onTimeInfo = reviewerData.onTimeRate.byReviewer.find(
                            r => r.reviewerId === reviewer.reviewerId
                          );
                          const loadInfo = reviewerData.loadDistribution.find(
                            r => r.reviewerId === reviewer.reviewerId
                          );
                          const scorePct = Math.round(reviewer.score);
                          const scoreColor =
                            scorePct >= 70
                              ? 'bg-green-500'
                              : scorePct >= 40
                              ? 'bg-amber-500'
                              : 'bg-red-400';
                          const scoreTextColor =
                            scorePct >= 70
                              ? 'text-green-700'
                              : scorePct >= 40
                              ? 'text-amber-700'
                              : 'text-red-600';

                          return (
                            <tr key={reviewer.reviewerId} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="px-4 py-3 text-muted-foreground font-medium">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 font-medium">{reviewer.reviewerName}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${scoreColor}`}
                                      style={{ width: `${scorePct}%` }}
                                      role="presentation"
                                    />
                                  </div>
                                  <span className={`text-xs font-semibold tabular-nums w-8 text-right ${scoreTextColor}`}>
                                    {scorePct}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                {reviewer.completionRate.toFixed(0)}%
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                {onTimeInfo ? `${onTimeInfo.rate.toFixed(0)}%` : '—'}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                {reviewer.avgResponseDays > 0
                                  ? `${reviewer.avgResponseDays.toFixed(1)}d`
                                  : '—'}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                {loadInfo ? loadInfo.activeReviews : '—'}
                              </td>
                            </tr>
                          );
                        })}
                        {reviewerData.reliabilityScore.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                              Chưa có dữ liệu phản biện viên
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Timeline with decisions */}
      <Card>
        <CardHeader>
          <CardTitle>Xu hướng quyết định</CardTitle>
          <CardDescription>6 tháng gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="submitted" 
                stroke="#3b82f6" 
                name="Nộp"
              />
              <Line 
                type="monotone" 
                dataKey="accepted" 
                stroke="#10b981" 
                name="Chấp nhận"
              />
              <Line 
                type="monotone" 
                dataKey="rejected" 
                stroke="#ef4444" 
                name="Từ chối"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
