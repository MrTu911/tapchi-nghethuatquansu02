'use client'

import { memo } from 'react'
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, Trophy, Activity, TrendingUp } from 'lucide-react'
import { CommanderData, CATEGORY_COLORS } from './types'

const ROLE_COLORS: Record<string, string> = {
  READER: '#94a3b8', AUTHOR: '#3b82f6', REVIEWER: '#f59e0b',
  SECTION_EDITOR: '#8b5cf6', LAYOUT_EDITOR: '#ec4899',
  MANAGING_EDITOR: '#10b981', EIC: '#1e3a5f',
  SECURITY_AUDITOR: '#ef4444', COMMANDER: '#d4a017', SYSADMIN: '#374151',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function getRankBadge(rank: number) {
  if (rank === 0) return { emoji: '🥇', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  if (rank === 1) return { emoji: '🥈', color: 'bg-slate-100 text-slate-700 border-slate-200' }
  if (rank === 2) return { emoji: '🥉', color: 'bg-orange-100 text-orange-700 border-orange-200' }
  return { emoji: `${rank + 1}`, color: 'bg-blue-50 text-blue-700 border-blue-100' }
}

function getPerformanceRating(onTimeRate: number, avgScore: number): { label: string; color: string } {
  const score = onTimeRate * 0.5 + (avgScore / 10) * 50
  if (score >= 80) return { label: 'Xuất sắc', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
  if (score >= 60) return { label: 'Tốt', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' }
  if (score >= 40) return { label: 'Trung bình', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' }
  return { label: 'Cần cải thiện', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' }
}

function EcosystemTab({ data }: { data: CommanderData }) {
  const totalUsers = data.userEcosystem.reduce((s, u) => s + u.count, 0)
  const maxOrg = data.topOrgs[0]?.count || 1

  return (
    <div className="space-y-6">

      {/* Active Users Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Tổng người dùng', value: totalUsers, icon: Users,
            gradient: 'from-blue-600 to-blue-800',
          },
          {
            label: 'Hoạt động 30 ngày', value: data.activeUsersLast30Days ?? '—', icon: Activity,
            gradient: 'from-emerald-500 to-teal-600',
          },
          {
            label: 'Tác giả đóng góp', value: data.overview.totalAuthors, icon: UserCheck,
            gradient: 'from-purple-600 to-purple-800',
          },
        ].map(({ label, value, icon: Icon, gradient }) => (
          <Card key={label} className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
            <div className={`h-0.5 bg-gradient-to-r ${gradient}`} />
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                  <p className={`text-3xl font-bold mt-1 bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>{value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Orgs Leaderboard + User Ecosystem */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Orgs Leaderboard */}
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden h-full">
          <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Bảng xếp hạng Đơn vị</CardTitle>
                <CardDescription className="text-xs">Top đơn vị/tổ chức đóng góp bài báo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2">
              {data.topOrgs.slice(0, 8).map((org, i) => {
                const { emoji, color } = getRankBadge(i)
                const pct = Math.round((org.count / maxOrg) * 100)
                return (
                  <div key={i}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border flex-shrink-0 ${color}`}>
                        {emoji}
                      </span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">{org.org || 'Không xác định'}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{org.count} bài</span>
                    </div>
                    <div className="ml-10 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* User Ecosystem Pie */}
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden h-full">
          <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Hệ sinh thái Người dùng</CardTitle>
                <CardDescription className="text-xs">Phân bổ theo vai trò</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {data.userEcosystem.length > 0 ? (
              <div className="flex flex-col items-center">
                <PieChart width={200} height={200}>
                  <Pie data={data.userEcosystem} cx={100} cy={100} innerRadius={50} outerRadius={85}
                    paddingAngle={2} dataKey="count" labelLine={false}>
                    {data.userEcosystem.map((u, i) => (
                      <Cell key={i} fill={ROLE_COLORS[u.role] || CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
                <div className="w-full grid grid-cols-2 gap-1.5 mt-1">
                  {data.userEcosystem.map((u, i) => (
                    <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: ROLE_COLORS[u.role] || CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1">{u.label}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{u.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400">Chưa có dữ liệu</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Growth Trend */}
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Tăng trưởng Người dùng</CardTitle>
              <CardDescription className="text-xs">Đăng ký mới 6 tháng gần nhất</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.userGrowthTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Đăng ký mới" stroke="#0891b2" strokeWidth={2.5}
                dot={{ r: 4, fill: '#0891b2', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Reviewer Performance Table */}
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Hiệu suất Phản biện viên</CardTitle>
              <CardDescription className="text-xs">Top 10 phản biện viên — đánh giá hiệu suất</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          {data.reviewerPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left py-2 px-2 text-slate-500 font-semibold uppercase tracking-wide">#</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-semibold uppercase tracking-wide">Họ tên</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-semibold uppercase tracking-wide hidden md:table-cell">Đơn vị</th>
                    <th className="text-center py-2 px-2 text-slate-500 font-semibold uppercase tracking-wide">Bài</th>
                    <th className="text-center py-2 px-2 text-slate-500 font-semibold uppercase tracking-wide">Đúng hạn</th>
                    <th className="text-center py-2 px-2 text-slate-500 font-semibold uppercase tracking-wide hidden sm:table-cell">Điểm TB</th>
                    <th className="text-center py-2 px-2 text-slate-500 font-semibold uppercase tracking-wide">Xếp loại</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reviewerPerformance.map((r, i) => {
                    const rating = getPerformanceRating(r.onTimeRate, r.avgScore)
                    const { emoji, color } = getRankBadge(i)
                    return (
                      <tr
                        key={i}
                        className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-2.5 px-2">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${color}`}>
                            {emoji}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-medium text-slate-700 dark:text-slate-200">{r.name}</td>
                        <td className="py-2.5 px-2 text-slate-400 hidden md:table-cell">{r.org || '—'}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-200">{r.completed}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`font-bold ${r.onTimeRate >= 80 ? 'text-emerald-600' : r.onTimeRate >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                            {r.onTimeRate}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                          {r.avgScore > 0 ? r.avgScore.toFixed(1) : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <Badge className={`text-[10px] border-0 ${rating.color}`}>{rating.label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-slate-400">Chưa có dữ liệu phản biện</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default memo(EcosystemTab)
