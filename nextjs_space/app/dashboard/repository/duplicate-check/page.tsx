'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ShieldCheck, Loader2, ArrowLeft, AlertTriangle,
  CheckCircle2, XCircle, ExternalLink, Search,
  BookOpen, Info, Sparkles, ChevronRight,
} from 'lucide-react'

type SimilarityLevel = 'LOW' | 'MEDIUM' | 'HIGH'

interface DuplicateMatch {
  id: string
  title: string
  authors: string
  issueInfo: string
  publishedAt: string | null
  score: number
  level: SimilarityLevel
  sourceType: 'PEER_REVIEW' | 'JOURNAL_IMPORT'
  pdfUrl: string | null
}

interface CheckResult {
  matches: DuplicateMatch[]
  totalCompared: number
  checkedAt: string
}

const LEVEL_CFG: Record<SimilarityLevel, {
  label: string
  icon: React.ElementType
  gradient: string
  badgeCls: string
  rowCls: string
  textCls: string
  barCls: string
}> = {
  HIGH: {
    label: 'Rất có thể trùng',
    icon: XCircle,
    gradient: 'from-rose-500 to-red-600',
    badgeCls: 'bg-rose-100 text-rose-700 border-rose-300',
    rowCls: 'bg-rose-50/50 hover:bg-rose-50',
    textCls: 'text-rose-600',
    barCls: 'bg-gradient-to-r from-rose-400 to-red-600',
  },
  MEDIUM: {
    label: 'Có khả năng trùng',
    icon: AlertTriangle,
    gradient: 'from-amber-400 to-orange-500',
    badgeCls: 'bg-amber-100 text-amber-700 border-amber-300',
    rowCls: 'bg-amber-50/40 hover:bg-amber-50/60',
    textCls: 'text-amber-600',
    barCls: 'bg-gradient-to-r from-amber-400 to-orange-500',
  },
  LOW: {
    label: 'Tương đồng thấp',
    icon: CheckCircle2,
    gradient: 'from-emerald-400 to-green-500',
    badgeCls: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    rowCls: 'hover:bg-slate-50',
    textCls: 'text-emerald-600',
    barCls: 'bg-gradient-to-r from-emerald-400 to-green-500',
  },
}

const SOURCE_LABELS: Record<string, string> = {
  PEER_REVIEW: 'Gửi qua tạp chí',
  JOURNAL_IMPORT: 'Ấn phẩm in',
}

function ScoreBar({ score, level }: { score: number; level: SimilarityLevel }) {
  const pct = Math.round(score * 100)
  const cfg = LEVEL_CFG[level]
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', cfg.barCls)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('text-sm font-bold tabular-nums', cfg.textCls)}>{pct}%</span>
    </div>
  )
}

export default function DuplicateCheckPage() {
  const [title, setTitle] = useState('')
  const [abstractVn, setAbstractVn] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)

  const addKeyword = () => {
    const kw = keywordInput.trim()
    if (kw && !keywords.includes(kw)) setKeywords(prev => [...prev, kw])
    setKeywordInput('')
  }
  const removeKeyword = (kw: string) => setKeywords(prev => prev.filter(k => k !== kw))

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || title.trim().length < 3)
      return toast.error('Vui lòng nhập tiêu đề (tối thiểu 3 ký tự)')

    setChecking(true)
    setResult(null)
    try {
      const res = await fetch('/api/repository/duplicate-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), abstractVn: abstractVn.trim() || undefined, keywords: keywords.length > 0 ? keywords : undefined }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
        const high = data.data.matches.filter((m: DuplicateMatch) => m.level === 'HIGH').length
        if (data.data.matches.length === 0) toast.success('Không tìm thấy bài báo trùng lặp')
        else if (high > 0) toast.warning(`${high} bài báo có độ tương đồng rất cao!`)
        else toast.info(`Tìm thấy ${data.data.matches.length} bài báo có điểm tương đồng`)
      } else {
        toast.error(data.error || 'Lỗi kiểm tra')
      }
    } catch { toast.error('Lỗi kết nối') }
    finally { setChecking(false) }
  }

  const high = result?.matches.filter(m => m.level === 'HIGH') ?? []
  const medium = result?.matches.filter(m => m.level === 'MEDIUM') ?? []
  const low = result?.matches.filter(m => m.level === 'LOW') ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-cyan-50/20">
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-700 -ml-1">
            <Link href="/dashboard/repository">
              <ArrowLeft className="h-4 w-4 mr-1" />
              CSDL báo chí
            </Link>
          </Button>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Kiểm tra trùng lặp CSDL</h1>
            <p className="text-sm text-slate-500 mt-0.5">So sánh với toàn bộ bài báo đã xuất bản trong cơ sở dữ liệu</p>
          </div>
        </div>

        {/* ── Input Form ── */}
        <div className="rounded-2xl border border-sky-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-sky-500/5 to-cyan-500/5 border-b border-sky-100">
            <p className="font-semibold text-slate-700 text-sm">Thông tin bài báo cần kiểm tra</p>
            <p className="text-xs text-slate-400 mt-0.5">Nhập càng đầy đủ, độ chính xác càng cao</p>
          </div>
          <form onSubmit={handleCheck} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">
                Tiêu đề bài báo <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề đầy đủ để có kết quả chính xác nhất…"
                rows={2}
                required
                className="resize-none rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">
                Tóm tắt
                <span className="ml-2 text-xs font-normal text-slate-400">(tăng độ chính xác 30%)</span>
              </Label>
              <Textarea
                value={abstractVn}
                onChange={e => setAbstractVn(e.target.value)}
                placeholder="Tóm tắt nội dung bài báo bằng tiếng Việt…"
                rows={4}
                className="resize-none rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">
                Từ khóa
                <span className="ml-2 text-xs font-normal text-slate-400">(tăng độ chính xác 20%)</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }}
                  placeholder="Nhập từ khóa → Enter để thêm"
                  className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                />
                <Button type="button" variant="outline" onClick={addKeyword} className="rounded-xl shrink-0">
                  Thêm
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map(kw => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700 border border-sky-200 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-200 transition-colors"
                    >
                      {kw}
                      <XCircle className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              {/* Algorithm info */}
              <div className="flex flex-wrap gap-2">
                {['Tiêu đề 50%', 'Tóm tắt 30%', 'Từ khóa 20%'].map(t => (
                  <span key={t} className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
                    <ChevronRight className="h-3 w-3 text-sky-400" />
                    {t}
                  </span>
                ))}
              </div>
              <Button
                type="submit"
                disabled={checking}
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 shadow-md shadow-sky-500/25 text-white font-semibold gap-2"
              >
                {checking
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang kiểm tra…</>
                  : <><Sparkles className="h-4 w-4" /> Kiểm tra trùng lặp</>
                }
              </Button>
            </div>
          </form>
        </div>

        {/* ── Results ── */}
        {result && (
          <div className="space-y-4">

            {/* Summary KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Bài đã so sánh', value: result.totalCompared, gradient: 'from-slate-400 to-slate-500', textCls: 'text-slate-700' },
                { label: 'Rất có thể trùng', value: high.length, gradient: 'from-rose-500 to-red-600', textCls: high.length > 0 ? 'text-rose-600' : 'text-slate-700', highlight: high.length > 0 },
                { label: 'Có khả năng trùng', value: medium.length, gradient: 'from-amber-400 to-orange-500', textCls: medium.length > 0 ? 'text-amber-600' : 'text-slate-700', highlight: medium.length > 0 },
                { label: 'Tương đồng thấp', value: low.length, gradient: 'from-emerald-400 to-green-500', textCls: 'text-slate-700' },
              ].map(card => (
                <div key={card.label} className={cn(
                  'relative rounded-2xl border bg-white shadow-sm overflow-hidden',
                  card.highlight && 'ring-2 ring-rose-300'
                )}>
                  <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', card.gradient)} />
                  <div className="p-4 text-center pt-5">
                    <p className={cn('text-4xl font-black', card.textCls)}>{card.value}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Match list or empty */}
            {result.matches.length === 0 ? (
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8 flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-emerald-700 text-lg">Không tìm thấy bài báo trùng lặp</p>
                  <p className="text-sm text-emerald-600 mt-1">
                    Đã so sánh với {result.totalCompared} bài báo — không có bài nào đạt ngưỡng tương đồng đáng kể.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <p className="font-semibold text-slate-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Danh sách bài báo tương đồng
                    <span className="text-slate-400 font-normal text-sm">({result.matches.length} kết quả)</span>
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {result.matches.map(match => {
                    const cfg = LEVEL_CFG[match.level]
                    const LevelIcon = cfg.icon
                    return (
                      <div key={match.id} className={cn('p-4 transition-colors', cfg.rowCls)}>
                        <div className="flex items-start gap-4">
                          {/* Level indicator */}
                          <div className={cn(
                            'shrink-0 h-10 w-10 rounded-xl flex items-center justify-center',
                            match.level === 'HIGH' ? 'bg-rose-100' : match.level === 'MEDIUM' ? 'bg-amber-100' : 'bg-emerald-100'
                          )}>
                            <LevelIcon className={cn('h-5 w-5', cfg.textCls)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-700 text-sm line-clamp-2 leading-snug">{match.title}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                              <span className="text-xs text-slate-500 truncate max-w-[200px]" title={match.authors}>
                                {match.authors}
                              </span>
                              {match.issueInfo && (
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                  <BookOpen className="h-3 w-3" />
                                  {match.issueInfo}
                                </span>
                              )}
                              <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                                {SOURCE_LABELS[match.sourceType] ?? match.sourceType}
                              </Badge>
                            </div>
                          </div>

                          {/* Score + Level + Action */}
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <ScoreBar score={match.score} level={match.level} />
                            <Badge className={cn('text-xs border font-semibold', cfg.badgeCls)}>
                              {cfg.label}
                            </Badge>
                            {match.pdfUrl && (
                              <Link
                                href={`/repository/${match.id}`}
                                target="_blank"
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-600 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Xem bài
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Kiểm tra lúc {new Date(result.checkedAt).toLocaleString('vi-VN')} ·
                    Ngưỡng hiển thị: ≥30% · HIGH ≥85% · MEDIUM ≥60%
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Info box ── */}
        {!result && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5">
            <p className="text-sm font-semibold text-sky-700 mb-3 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Cách tính điểm tương đồng
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { pct: '50%', label: 'Tiêu đề', desc: 'Jaccard similarity — so sánh các từ trong tiêu đề', color: 'bg-sky-200 text-sky-800' },
                { pct: '30%', label: 'Tóm tắt', desc: 'Cosine similarity — so sánh nội dung tóm tắt', color: 'bg-cyan-200 text-cyan-800' },
                { pct: '20%', label: 'Từ khóa', desc: 'Jaccard similarity — so sánh danh sách từ khóa', color: 'bg-teal-200 text-teal-800' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-sky-100">
                  <span className={cn('shrink-0 px-2 py-1 rounded-lg text-sm font-black', item.color)}>{item.pct}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
