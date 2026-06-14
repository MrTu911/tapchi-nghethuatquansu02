'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Printer, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CommanderData } from '../components/types'
import { STATUS_LABELS } from '../components/types'

const ROLE_DASHBOARDS: Record<string, string> = {
  AUTHOR: '/dashboard/author', REVIEWER: '/dashboard/reviewer',
  SECTION_EDITOR: '/dashboard/editor', MANAGING_EDITOR: '/dashboard/managing',
  EIC: '/dashboard/eic', SYSADMIN: '/dashboard/admin',
  LAYOUT_EDITOR: '/dashboard/layout', SECURITY_AUDITOR: '/dashboard/security',
}

export default function CommanderReportPage() {
  const router = useRouter()
  const [data, setData] = useState<CommanderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Chỉ huy')

  const fetchData = useCallback(async () => {
    try {
      const [meRes, statsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/statistics/commander'),
      ])
      const me = await meRes.json()
      if (me?.data?.user) {
        const u = me.data.user
        if (ROLE_DASHBOARDS[u.role]) { router.replace(ROLE_DASHBOARDS[u.role]); return }
        setUserName(u.fullName || 'Chỉ huy')
      }
      if (statsRes.ok) {
        const json = await statsRes.json()
        if (json.success) setData(json.data)
      }
    } catch (e) {
      console.error('[CommanderReport]', e)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="text-slate-500 text-sm">Đang tải báo cáo...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const ov = data.overview
  const qm = data.qualityMetrics
  const activeWorkflow = data.workloadPipeline.filter(p => !['PUBLISHED', 'REJECTED', 'DESK_REJECT'].includes(p.status))
  const totalActive = activeWorkflow.reduce((s, p) => s + p.count, 0)

  return (
    <>
      {/* Screen-only controls */}
      <div className="print:hidden bg-gradient-to-r from-[#0f1f3d] to-[#1e3a5f] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/commander">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 gap-1.5 h-8 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại
            </Button>
          </Link>
          <span className="text-blue-300/50">|</span>
          <span className="text-sm text-blue-200">Báo cáo Điều hành</span>
        </div>
        <Button
          onClick={() => window.print()}
          size="sm"
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-semibold gap-1.5 h-8 text-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          In / Xuất PDF
        </Button>
      </div>

      {/* Report Content */}
      <div className="bg-white min-h-screen print:min-h-0">
        <div className="max-w-4xl mx-auto px-8 py-10 print:px-6 print:py-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between mb-8 pb-6 border-b-2 border-[#0f1f3d]"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0f1f3d] to-[#1e3a5f] flex items-center justify-center">
                  <Shield className="w-7 h-7 text-yellow-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#0f1f3d] leading-tight">HỌC VIỆN QUỐC PHÒNG</h1>
                  <p className="text-sm text-slate-600">Tạp chí Nghệ thuật Quân sự Việt Nam</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">BÁO CÁO ĐIỀU HÀNH</p>
              <p className="text-xs text-slate-500 mt-1">{today}</p>
              <p className="text-xs text-slate-400 mt-0.5">Kính gửi: {userName}</p>
            </div>
          </motion.div>

          {/* Executive Summary Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0f1f3d] text-white rounded-xl p-5 mb-8"
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-4">TÓM TẮT ĐIỀU HÀNH</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Bài đã xuất bản', value: ov.totalPublished, unit: 'bài' },
                { label: 'Số tạp chí', value: ov.totalIssues, unit: 'số' },
                { label: 'Tỷ lệ chấp nhận', value: `${ov.acceptanceRate}%`, unit: '' },
                { label: 'Bài đang xử lý', value: totalActive, unit: 'bài' },
              ].map(({ label, value, unit }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold text-yellow-300">{value}<span className="text-sm font-normal ml-1 text-yellow-400/60">{unit}</span></p>
                  <p className="text-xs text-blue-200 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section 1: KPI Table */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-sm font-bold text-[#0f1f3d] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#0f1f3d] text-white rounded flex items-center justify-center text-xs">1</span>
              Chỉ số Hoạt động Chính
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 border border-slate-200">Chỉ số</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-slate-600 border border-slate-200">Giá trị</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 border border-slate-200">Nhận xét</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Tổng bài đã xuất bản', value: `${ov.totalPublished} bài`, note: 'Tích lũy tất cả thời gian' },
                  { label: 'Số tạp chí đã phát hành', value: `${ov.totalIssues} số`, note: 'Đã công bố chính thức' },
                  { label: 'Tác giả đã đóng góp', value: `${ov.totalAuthors} người`, note: 'Đã có ít nhất 1 bài nộp' },
                  { label: 'Tỷ lệ chấp nhận', value: `${ov.acceptanceRate}%`, note: ov.acceptanceRate >= 30 ? 'Tốt — trong ngưỡng chuẩn' : 'Thấp — cần cải thiện chất lượng đầu vào' },
                  { label: 'Thời gian xử lý trung bình', value: ov.avgProcessingDays > 0 ? `${ov.avgProcessingDays} ngày` : 'Chưa có dữ liệu', note: 'Từ nộp bài đến quyết định' },
                  { label: 'Bài đang xử lý (active)', value: `${totalActive} bài`, note: 'Đang trong quy trình phản biện/biên tập' },
                  { label: 'Bài quá hạn', value: `${ov.overdueCount} bài`, note: ov.overdueCount === 0 ? 'Tốt — không có bài quá hạn' : '⚠ Cần đôn đốc xử lý ngay' },
                  { label: 'Tỷ lệ trùng lặp trung bình', value: `${qm.avgPlagiarismScore}%`, note: qm.avgPlagiarismScore <= 15 ? 'Trong ngưỡng cho phép' : '⚠ Vượt ngưỡng 15%' },
                  { label: 'Điểm phản biện trung bình', value: qm.avgReviewScore > 0 ? `${qm.avgReviewScore}/10` : 'Chưa có', note: qm.avgReviewScore >= 6 ? 'Tốt' : 'Cần cải thiện tiêu chí phản biện' },
                ].map(({ label, value, note }, i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 border border-slate-200 text-slate-700 font-medium">{label}</td>
                    <td className="py-2 px-3 border border-slate-200 text-center font-bold text-[#0f1f3d]">{value}</td>
                    <td className="py-2 px-3 border border-slate-200 text-xs text-slate-500">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.section>

          {/* Section 2: Pipeline Status */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-sm font-bold text-[#0f1f3d] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#0f1f3d] text-white rounded flex items-center justify-center text-xs">2</span>
              Phân bổ Bài báo theo Trạng thái
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.workloadPipeline.filter(p => p.count > 0).map((p, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-[#0f1f3d]">{p.count}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{STATUS_LABELS[p.status] || p.status}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Section 3: Recent Issues */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <h2 className="text-sm font-bold text-[#0f1f3d] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#0f1f3d] text-white rounded flex items-center justify-center text-xs">3</span>
              Số Tạp chí Gần nhất
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 border border-slate-200">Số / Năm</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-slate-600 border border-slate-200">Số bài</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 border border-slate-200">Ngày phát hành</th>
                </tr>
              </thead>
              <tbody>
                {data.recentIssues.slice(0, 6).map((issue, i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 border border-slate-200 font-medium text-slate-700">Số {issue.volume}/{issue.year}</td>
                    <td className="py-2 px-3 border border-slate-200 text-center">{issue.articleCount} bài</td>
                    <td className="py-2 px-3 border border-slate-200 text-slate-500 text-xs">
                      {issue.publishedAt ? new Date(issue.publishedAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.section>

          {/* Section 4: Top Organizations */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-sm font-bold text-[#0f1f3d] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#0f1f3d] text-white rounded flex items-center justify-center text-xs">4</span>
              Đơn vị Đóng góp Nhiều nhất
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {data.topOrgs.slice(0, 6).map((org, i) => (
                <div key={i} className="flex items-center gap-2 border border-slate-200 rounded-lg p-2.5">
                  <span className="w-6 h-6 bg-[#0f1f3d] text-yellow-400 rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{org.org || 'Không xác định'}</p>
                    <p className="text-[10px] text-slate-400">{org.count} bài</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Footer */}
          <div className="border-t-2 border-[#0f1f3d] pt-4 mt-8">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <p>Tạp chí Nghệ thuật Quân sự Việt Nam — Học viện Quốc phòng</p>
              <p>Báo cáo tạo lúc {new Date().toLocaleTimeString('vi-VN')} — {today}</p>
            </div>
            <p className="text-[10px] text-slate-300 mt-1">Tài liệu này chỉ dành cho lãnh đạo có thẩm quyền. Không phổ biến rộng rãi.</p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page { margin: 15mm; size: A4; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  )
}
