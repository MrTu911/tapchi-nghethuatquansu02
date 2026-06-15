'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { 
  Search, Loader2, AlertTriangle, CheckCircle, FileText, 
  Clock, RefreshCw, ExternalLink, Shield, Info
} from 'lucide-react'
import Link from 'next/link'

interface PlagiarismMatch {
  id: string
  title: string
  type: 'submission' | 'article' | 'journal'
  similarity: number
  phraseOverlap?: number // % cụm từ nguyên văn trùng (báo cáo cũ có thể không có)
  matchedPhrases: string[]
}

// Đường dẫn và nhãn hiển thị theo loại nguồn trùng lặp
function getMatchHref(type: PlagiarismMatch['type'], id: string): string {
  if (type === 'submission') return `/dashboard/editor/submissions/${id}`
  if (type === 'article') return `/articles/${id}`
  return '/library' // journal: bài trong số đã in — dẫn về Thư viện số
}

function getMatchLabel(type: PlagiarismMatch['type']): string {
  if (type === 'submission') return 'Bài nộp'
  if (type === 'article') return 'Bài xuất bản'
  return 'Tạp chí (số đã in)'
}

interface PlagiarismReport {
  id?: string
  score: number
  method: string
  status?: string
  matches: PlagiarismMatch[]
  totalCompared: number
  checkedAt: string
  checkedBy?: string
  notes?: string
}

interface Props {
  submissionId: string
  submissionCode: string
}

export function PlagiarismChecker({ submissionId, submissionCode }: Props) {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [report, setReport] = useState<PlagiarismReport | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [submissionId])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/plagiarism/check?submissionId=${submissionId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setReport(data.data)
      }
    } catch (error) {
      console.error('Fetch plagiarism report error:', error)
    } finally {
      setLoading(false)
    }
  }

  const runCheck = async () => {
    try {
      setChecking(true)
      setShowConfirm(false)
      
      const res = await fetch('/api/plagiarism/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ submissionId, method: 'cosine' })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setReport(data.data)
        toast.success(`Kiểm tra hoàn tất: ${data.data.score}% trùng lặp`)
      } else {
        toast.error(data.error || 'Lỗi kiểm tra đạo văn')
      }
    } catch (error: any) {
      toast.error('Lỗi kết nối server')
    } finally {
      setChecking(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score < 15) return 'text-green-600'
    if (score < 30) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score < 15) return 'bg-green-100 border-green-300'
    if (score < 30) return 'bg-amber-100 border-amber-300'
    return 'bg-red-100 border-red-300'
  }

  const getScoreLabel = (score: number) => {
    if (score < 15) return 'Đạt yêu cầu'
    if (score < 30) return 'Cần xem xét'
    return 'Nghi ngờ đạo văn'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Đang tải dữ liệu...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-indigo-200">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Shield className="h-5 w-5" />
                Kiểm tra đạo văn nội bộ
              </CardTitle>
              <CardDescription>
                So sánh với các bài viết trong cơ sở dữ liệu
              </CardDescription>
            </div>
            {report && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowConfirm(true)}
                disabled={checking}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${checking ? 'animate-spin' : ''}`} />
                Kiểm tra lại
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {!report ? (
            // Chưa có báo cáo
            <div className="text-center py-6">
              <Shield className="h-12 w-12 mx-auto text-indigo-300 mb-3" />
              <p className="text-muted-foreground mb-4">
                Chưa kiểm tra đạo văn cho bài này
              </p>
              <Button 
                onClick={() => setShowConfirm(true)} 
                disabled={checking}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {checking ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang kiểm tra...</>
                ) : (
                  <><Search className="h-4 w-4 mr-2" /> Kiểm tra ngay</>
                )}
              </Button>
            </div>
          ) : (
            // Hiển thị kết quả
            <div className="space-y-4">
              {/* Score Summary */}
              <div className={`p-4 rounded-lg border ${getScoreBg(report.score)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Mức độ trùng lặp cao nhất</p>
                    <p className={`text-4xl font-bold ${getScoreColor(report.score)}`}>
                      {report.score}%
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getScoreBg(report.score)}>
                      {report.score < 15 ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : report.score < 30 ? (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {getScoreLabel(report.score)}
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={report.score} 
                  className="h-2 mt-3"
                />
              </div>

              {/* Stats + Matches */}
              {(() => {
                // Guard: matches luôn là array (old reports có thể là object)
                const matchList: PlagiarismMatch[] = Array.isArray(report.matches) ? report.matches : []
                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-700">{report.totalCompared}</p>
                        <p className="text-xs text-muted-foreground">Bài đã so sánh</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{matchList.length}</p>
                        <p className="text-xs text-muted-foreground">Bài tương tự</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-600 capitalize">{report.method}</p>
                        <p className="text-xs text-muted-foreground">Phương pháp</p>
                      </div>
                    </div>

                    {/* Matches List */}
                    {matchList.length > 0 && (
                      <div>
                        <Separator className="my-4" />
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Danh sách bài tương tự
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {matchList.map((match, idx) => (
                            <div
                              key={match.id}
                              className="p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <Link
                                    href={getMatchHref(match.type, match.id)}
                                    className="font-medium text-blue-600 hover:underline line-clamp-1"
                                  >
                                    {match.title}
                                  </Link>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge variant="outline" className="text-xs">
                                      {getMatchLabel(match.type)}
                                    </Badge>
                                    {typeof match.phraseOverlap === 'number' && match.phraseOverlap > 0 && (
                                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                                        Trùng cụm từ nguyên văn {match.phraseOverlap}%
                                      </Badge>
                                    )}
                                    {match.matchedPhrases?.length > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        vd: “{match.matchedPhrases[0]}”
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-lg font-bold ${getScoreColor(match.similarity)}`}>
                                    {match.similarity}%
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">tương đồng</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}

              {/* Meta Info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Kiểm tra: {new Date(report.checkedAt).toLocaleString('vi-VN')}
                </span>
                {report.checkedBy && (
                  <span>Bởi: {report.checkedBy}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Kiểm tra đạo văn
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hệ thống sẽ so sánh nội dung bài <strong>{submissionCode}</strong> với tất cả bài viết trong cơ sở dữ liệu.<br/><br/>
              Quá trình này có thể mất vài giây tùy thuộc số lượng bài.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={runCheck}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Bắt đầu kiểm tra
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
