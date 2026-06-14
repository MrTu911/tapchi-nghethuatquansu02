'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, AlertCircle, Loader2,
  Eye, RefreshCw, FileSearch2, FileText, Search, ChevronRight,
  Sparkles, ScanSearch, Upload, X, FileUp, Database,
} from 'lucide-react';
import { TableScrollWrapper } from '@/components/dashboard/table-scroll-wrapper';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/* ─────────── Types ─────────── */
interface PlagiarismMatch {
  id: string; title: string;
  type?: 'submission' | 'article';
  similarity: number;
  matchedPhrases?: string[];
}

interface PlagiarismReport {
  id: string; submissionId?: string; articleId?: string;
  score: number; method: string; status?: string;
  matches: PlagiarismMatch[]; totalCompared: number;
  checkedBy?: string; checkedAt: string; notes: string | null;
  checker?: { fullName: string; email: string };
  article?: { id: string; submission: { title: string; author: { fullName: string; org?: string } } };
  submission?: { title: string; author?: { fullName: string } };
}

interface PdfCheckResult {
  fileName: string; fileSize: number; extractedLength: number;
  score: number; averageScore: number; totalCompared: number;
  matchCount: number; matches: PlagiarismMatch[];
  method: string; checkedAt: string;
}

interface Submission { id: string; code: string; title: string; status: string }

type LevelFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

/* ─────────── Shared helpers ─────────── */
type ScoreCfg = {
  label: string; severity: LevelFilter; gradient: string;
  badgeCls: string; barCls: string; textCls: string;
  bgCard: string; icon: React.ElementType;
};

function getScoreCfg(score: number): ScoreCfg {
  if (score >= 70) return {
    label: 'Rất cao', severity: 'critical',
    gradient: 'from-rose-500 to-red-600',
    badgeCls: 'bg-rose-100 text-rose-700 border-rose-300',
    barCls: 'bg-gradient-to-r from-rose-400 to-red-600',
    textCls: 'text-rose-600', bgCard: 'bg-rose-50 border-rose-200', icon: ShieldAlert,
  };
  if (score >= 40) return {
    label: 'Cao', severity: 'high',
    gradient: 'from-orange-400 to-amber-500',
    badgeCls: 'bg-orange-100 text-orange-700 border-orange-300',
    barCls: 'bg-gradient-to-r from-orange-400 to-amber-500',
    textCls: 'text-orange-500', bgCard: 'bg-orange-50 border-orange-200', icon: AlertTriangle,
  };
  if (score >= 20) return {
    label: 'Trung bình', severity: 'medium',
    gradient: 'from-amber-400 to-yellow-500',
    badgeCls: 'bg-amber-100 text-amber-700 border-amber-300',
    barCls: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    textCls: 'text-amber-600', bgCard: 'bg-amber-50 border-amber-200', icon: AlertCircle,
  };
  return {
    label: 'Thấp', severity: 'low',
    gradient: 'from-emerald-400 to-green-500',
    badgeCls: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    barCls: 'bg-gradient-to-r from-emerald-400 to-green-500',
    textCls: 'text-emerald-600', bgCard: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2,
  };
}

function getTitle(r: PlagiarismReport) {
  return r.article?.submission?.title || r.submission?.title || '(Không rõ tiêu đề)';
}
function getAuthor(r: PlagiarismReport) {
  return r.article?.submission?.author?.fullName || r.submission?.author?.fullName || '—';
}
function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ─────────── Sub-components ─────────── */
function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const cfg = getScoreCfg(score);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={10} className="text-gray-200" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`} className={cfg.textCls} stroke="currentColor" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-extrabold leading-none', cfg.textCls)}>{score.toFixed(0)}</span>
        <span className="text-[10px] text-gray-400 font-medium">%</span>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const cfg = getScoreCfg(score);
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', cfg.barCls)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn('text-sm font-bold tabular-nums w-12 text-right', cfg.textCls)}>{score.toFixed(1)}%</span>
    </div>
  );
}

function KpiCard({ count, label, gradient, textCls }: { count: number; label: string; gradient: string; textCls: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', gradient)} />
      <div className="p-4 text-center pt-5">
        <p className={cn('text-4xl font-black', textCls)}>{count}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

/* ─────────── Matches List (shared) ─────────── */
function MatchList({ matches }: { matches: PlagiarismMatch[] }) {
  if (matches.length === 0) return (
    <div className="text-center py-6 text-slate-400 text-sm">Không tìm thấy tài liệu tương tự</div>
  );
  return (
    <div className="space-y-2">
      {matches.map((m, idx) => {
        const mc = getScoreCfg(m.similarity);
        return (
          <div key={m.id || idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-slate-700 line-clamp-1">{m.title || `Tài liệu ${idx + 1}`}</p>
              <div className="flex items-center gap-2 mt-1">
                {m.type && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-500 font-medium">
                    {m.type === 'submission' ? 'Bài nộp' : 'Bài xuất bản'}
                  </span>
                )}
                {m.matchedPhrases && m.matchedPhrases.length > 0 && (
                  <span className="text-[11px] text-slate-400">{m.matchedPhrases.length} cụm từ trùng</span>
                )}
              </div>
            </div>
            <div className={cn('text-sm font-bold shrink-0 tabular-nums', mc.textCls)}>
              {m.similarity.toFixed(1)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────── Detail Dialog ─────────── */
function DetailDialog({
  report, onClose,
}: {
  report: PlagiarismReport | PdfCheckResult | null;
  onClose: () => void;
}) {
  if (!report) return null;

  const isPdf = 'fileName' in report;
  const score = report.score;
  const cfg = getScoreCfg(score);
  const Icon = cfg.icon;
  const matchList = Array.isArray(report.matches) ? report.matches : [];
  const title = isPdf ? report.fileName : getTitle(report as PlagiarismReport);
  const notes = isPdf ? null : (report as PlagiarismReport).notes;
  const checker = isPdf ? null : (report as PlagiarismReport).checker;

  return (
    <Dialog open={!!report} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        {/* Gradient header */}
        <div className={cn('rounded-t-2xl p-6 bg-gradient-to-br', cfg.gradient)}>
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold leading-snug pr-8 line-clamp-2">
              {title}
            </DialogTitle>
            {isPdf && (
              <p className="text-white/70 text-sm mt-0.5">
                {fmtSize(report.fileSize)} · {report.extractedLength.toLocaleString()} ký tự
              </p>
            )}
          </DialogHeader>

          <div className="mt-5 flex items-center gap-6">
            <ScoreRing score={score} size={100} />
            <div className="flex-1 grid grid-cols-2 gap-3">
              {[
                { label: 'Mức độ', value: cfg.label },
                { label: 'Phương pháp', value: report.method },
                { label: 'Tài liệu so sánh', value: `${report.totalCompared} bài` },
                { label: 'Trùng tìm thấy', value: `${matchList.length} bài` },
              ].map(item => (
                <div key={item.label} className="bg-white/15 rounded-xl p-3">
                  <p className="text-white/60 text-xs">{item.label}</p>
                  <p className="text-white font-bold text-sm mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/50 text-xs mt-4">
            {format(new Date(report.checkedAt), 'HH:mm · dd/MM/yyyy', { locale: vi })}
            {checker?.fullName && ` · ${checker.fullName}`}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Recommendation */}
          <div className={cn('rounded-xl border p-4', cfg.bgCard)}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('h-4 w-4', cfg.textCls)} />
              <p className={cn('font-semibold text-sm', cfg.textCls)}>Khuyến nghị xử lý</p>
            </div>
            <ul className="space-y-1 text-sm text-slate-600">
              {score >= 70 && <>
                <li className="font-semibold text-rose-700">• Độ tương đồng rất cao — Xem xét từ chối bài</li>
                <li>• Kiểm tra kỹ nguồn trích dẫn và xem các đoạn trùng</li>
                <li>• Liên hệ tác giả để làm rõ trước khi quyết định</li>
              </>}
              {score >= 40 && score < 70 && <>
                <li className="font-semibold text-orange-700">• Độ tương đồng cao — Cần tác giả giải trình</li>
                <li>• Yêu cầu bổ sung trích dẫn và ghi nguồn đầy đủ</li>
              </>}
              {score >= 20 && score < 40 && <>
                <li className="font-semibold text-amber-700">• Độ tương đồng trung bình — Theo dõi thêm</li>
                <li>• Rà soát các đoạn có thể trùng, đặc biệt phần tổng quan</li>
              </>}
              {score < 20 && <>
                <li className="font-semibold text-emerald-700">• Độ tương đồng thấp — Chấp nhận được</li>
                <li>• Bài viết đáp ứng tiêu chuẩn tính nguyên gốc</li>
              </>}
            </ul>
          </div>

          {/* Matches */}
          <div>
            <p className="flex items-center gap-2 font-semibold text-sm text-slate-700 mb-3">
              <FileText className="h-4 w-4 text-slate-400" />
              Tài liệu tương tự ({matchList.length})
            </p>
            <MatchList matches={matchList} />
          </div>

          {notes && (
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Ghi chú</p>
              <p className="text-sm text-slate-600">{notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────── PDF Upload Panel ─────────── */
function PdfUploadPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [method, setMethod] = useState<'cosine' | 'jaccard'>('cosine');
  const [dragging, setDragging] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<PdfCheckResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  function pickFile(f: File) {
    if (f.type !== 'application/pdf') return toast.error('Chỉ chấp nhận file PDF');
    if (f.size > 20 * 1024 * 1024) return toast.error('File tối đa 20MB');
    setFile(f);
    setResult(null);
  }

  async function handleCheck() {
    if (!file) return;
    setChecking(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('method', method);
      const res = await fetch('/api/plagiarism/check-pdf', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        toast.success(`Hoàn tất — ${data.data.score.toFixed(1)}% tương đồng`);
      } else {
        toast.error(data.error || 'Kiểm tra thất bại');
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setChecking(false); }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }}
        onClick={() => !file && fileRef.current?.click()}
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-all cursor-pointer',
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50/60 hover:border-indigo-300 hover:bg-indigo-50/30',
          file && 'cursor-default'
        )}
      >
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />

        {!file ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <FileUp className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-600">Kéo thả file PDF vào đây</p>
              <p className="text-sm text-slate-400 mt-0.5">hoặc nhấn để chọn file · tối đa 20MB</p>
            </div>
            <div className="flex gap-2 mt-1">
              {['Extract text tự động', 'Không lưu vào CSDL', 'Kết quả tức thì'].map(t => (
                <span key={t} className="text-xs text-slate-400 bg-white border border-slate-200 rounded-full px-2.5 py-0.5">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-700 text-sm truncate">{file.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{fmtSize(file.size)}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Method + Check button */}
      {file && (
        <div className="flex gap-3">
          <Select value={method} onValueChange={v => setMethod(v as 'cosine' | 'jaccard')}>
            <SelectTrigger className="w-36 rounded-xl bg-slate-50 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cosine">Cosine</SelectItem>
              <SelectItem value="jaccard">Jaccard</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleCheck}
            disabled={checking}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/25 text-white font-semibold gap-2"
          >
            {checking
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang extract &amp; phân tích…</>
              : <><Sparkles className="h-4 w-4" /> Kiểm tra PDF ngay</>
            }
          </Button>
        </div>
      )}

      {/* Inline result preview */}
      {result && (
        <div className={cn('rounded-2xl border-2 p-5', getScoreCfg(result.score).bgCard)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ScoreRing score={result.score} size={72} />
              <div>
                <p className="text-xs text-slate-500 mb-1">Độ tương đồng cao nhất</p>
                <Badge className={cn('text-sm font-bold border', getScoreCfg(result.score).badgeCls)}>
                  {getScoreCfg(result.score).label}
                </Badge>
                <p className="text-xs text-slate-400 mt-1.5">
                  {result.matchCount} tài liệu trùng / {result.totalCompared} đã so sánh
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetail(true)}
              className="rounded-xl gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              Xem chi tiết
            </Button>
          </div>

          {/* Top 3 matches preview */}
          {result.matches.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Top kết quả trùng</p>
              {result.matches.slice(0, 3).map((m, i) => {
                const mc = getScoreCfg(m.similarity);
                return (
                  <div key={m.id || i} className="flex items-center gap-2 text-sm">
                    <span className={cn('font-bold w-10 text-right shrink-0', mc.textCls)}>{m.similarity.toFixed(0)}%</span>
                    <span className="text-slate-600 line-clamp-1">{m.title}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <DetailDialog report={showDetail ? result : null} onClose={() => setShowDetail(false)} />
    </div>
  );
}

/* ─────────── Main Page ─────────── */
type CheckTab = 'db' | 'pdf';

export default function PlagiarismCheckPage() {
  const [tab, setTab] = useState<CheckTab>('db');
  const [reports, setReports] = useState<PlagiarismReport[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'cosine' | 'jaccard'>('cosine');
  const [selectedReport, setSelectedReport] = useState<PlagiarismReport | null>(null);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');

  useEffect(() => { fetchReports(); fetchSubmissions(); }, []);

  async function fetchReports() {
    try {
      setLoading(true);
      const res = await fetch('/api/plagiarism/reports');
      const data = await res.json();
      if (data.success) setReports(data.data || []);
      else toast.error(data.message || 'Không tải được báo cáo');
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  }

  async function fetchSubmissions() {
    try {
      const res = await fetch('/api/submissions?status=ACCEPTED&limit=100');
      const data = await res.json();
      if (data.success) setSubmissions(data.data?.submissions || data.data || []);
    } catch { /* non-blocking */ }
  }

  async function handleCheck() {
    if (!selectedSubmissionId) return toast.error('Vui lòng chọn bài viết');
    try {
      setChecking(true);
      const res = await fetch('/api/plagiarism/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: selectedSubmissionId, method: selectedMethod }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Hoàn tất — ${data.data.score?.toFixed(1) ?? 0}% tương đồng`);
        setSelectedSubmissionId('');
        fetchReports();
      } else {
        toast.error(data.error || 'Kiểm tra thất bại');
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setChecking(false); }
  }

  const kpi = useMemo(() => ({
    total: reports.length,
    critical: reports.filter(r => r.score >= 70).length,
    high: reports.filter(r => r.score >= 40 && r.score < 70).length,
    medium: reports.filter(r => r.score >= 20 && r.score < 40).length,
    low: reports.filter(r => r.score < 20).length,
  }), [reports]);

  const filtered = useMemo(() => reports.filter(r => {
    const q = searchTerm.toLowerCase();
    if (q && !getTitle(r).toLowerCase().includes(q) && !getAuthor(r).toLowerCase().includes(q)) return false;
    if (levelFilter === 'all') return true;
    return getScoreCfg(r.score).severity === levelFilter;
  }), [reports, searchTerm, levelFilter]);

  const LEVEL_BTNS: { value: LevelFilter; label: string; count: number; activeCls: string; dotCls: string }[] = [
    { value: 'all', label: 'Tất cả', count: kpi.total, activeCls: 'bg-slate-800 text-white border-slate-800', dotCls: 'bg-slate-400' },
    { value: 'critical', label: 'Rất cao', count: kpi.critical, activeCls: 'bg-rose-600 text-white border-rose-600', dotCls: 'bg-rose-500' },
    { value: 'high', label: 'Cao', count: kpi.high, activeCls: 'bg-orange-500 text-white border-orange-500', dotCls: 'bg-orange-400' },
    { value: 'medium', label: 'Trung bình', count: kpi.medium, activeCls: 'bg-amber-500 text-white border-amber-500', dotCls: 'bg-amber-400' },
    { value: 'low', label: 'Thấp', count: kpi.low, activeCls: 'bg-emerald-600 text-white border-emerald-600', dotCls: 'bg-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ScanSearch className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kiểm tra Đạo văn</h1>
              <p className="text-sm text-slate-500 mt-0.5">Phân tích độ tương đồng · Hỗ trợ bài trong hệ thống & upload PDF</p>
            </div>
          </div>
          <button onClick={fetchReports} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Tải lại
          </button>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard count={kpi.critical} label="Rất cao ≥70%" gradient="from-rose-500 to-red-600" textCls="text-rose-600" />
          <KpiCard count={kpi.high} label="Cao 40–70%" gradient="from-orange-400 to-amber-500" textCls="text-orange-500" />
          <KpiCard count={kpi.medium} label="Trung bình 20–40%" gradient="from-amber-400 to-yellow-500" textCls="text-amber-600" />
          <KpiCard count={kpi.low} label="Thấp <20%" gradient="from-emerald-400 to-green-500" textCls="text-emerald-600" />
        </div>

        {/* ── Check Panel with Tabs ── */}
        <div className="rounded-2xl border border-indigo-100 bg-white shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-slate-100">
            {([
              { id: 'db' as CheckTab, icon: Database, label: 'Bài trong hệ thống', desc: 'Chọn submission đã Accepted' },
              { id: 'pdf' as CheckTab, icon: Upload, label: 'Upload file PDF', desc: 'Kiểm tra PDF bất kỳ tức thì' },
            ]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 flex items-center gap-3 px-5 py-4 text-left transition-all border-b-2',
                  tab === t.id
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-transparent hover:bg-slate-50'
                )}
              >
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                  tab === t.id ? 'bg-indigo-100' : 'bg-slate-100')}>
                  <t.icon className={cn('h-4 w-4', tab === t.id ? 'text-indigo-600' : 'text-slate-400')} />
                </div>
                <div>
                  <p className={cn('font-semibold text-sm', tab === t.id ? 'text-indigo-700' : 'text-slate-600')}>
                    {t.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'db' ? (
              <>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Select value={selectedSubmissionId} onValueChange={setSelectedSubmissionId}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                        <SelectValue placeholder="Chọn bài viết (trạng thái Accepted)…" />
                      </SelectTrigger>
                      <SelectContent>
                        {submissions.length === 0
                          ? <SelectItem value="_" disabled>Không có bài viết nào</SelectItem>
                          : submissions.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                <span className="font-mono text-xs text-slate-400 mr-2">[{s.code}]</span>
                                {s.title}
                              </SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-36">
                    <Select value={selectedMethod} onValueChange={v => setSelectedMethod(v as 'cosine' | 'jaccard')}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cosine">Cosine</SelectItem>
                        <SelectItem value="jaccard">Jaccard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCheck} disabled={checking || !selectedSubmissionId}
                    className="h-11 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/25 text-white font-semibold gap-2 shrink-0">
                    {checking
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang phân tích…</>
                      : <><Sparkles className="h-4 w-4" /> Kiểm tra ngay</>
                    }
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Title + Abstract + HTML body', 'PDF đính kèm (nếu không có text)', 'Cosine/Jaccard + N-gram matching'].map(hint => (
                    <span key={hint} className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-2.5 py-0.5">
                      <ChevronRight className="h-3 w-3 text-indigo-400" />{hint}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <PdfUploadPanel />
            )}
          </div>
        </div>

        {/* ── Filter + Table (chỉ hiện khi tab DB) ── */}
        {tab === 'db' && (
          <>
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input className="pl-9 h-10 rounded-xl bg-white border-slate-200"
                  placeholder="Tìm theo tiêu đề hoặc tác giả…"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {LEVEL_BTNS.map(btn => (
                  <button key={btn.value} onClick={() => setLevelFilter(btn.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all',
                      levelFilter === btn.value
                        ? btn.activeCls + ' shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    )}
                  >
                    <span className={cn('h-2 w-2 rounded-full', levelFilter === btn.value ? 'bg-white/60' : btn.dotCls)} />
                    {btn.label}
                    {btn.count > 0 && (
                      <span className={cn('ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                        levelFilter === btn.value ? 'bg-white/20' : 'bg-slate-100 text-slate-600')}>
                        {btn.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Reports Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-700">Lịch sử báo cáo</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {filtered.length} kết quả{levelFilter !== 'all' ? ` · lọc từ ${kpi.total}` : ''}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  </div>
                  <p className="text-sm text-slate-400">Đang tải dữ liệu…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <FileSearch2 className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-500">
                    {reports.length === 0 ? 'Chưa có báo cáo nào' : 'Không khớp bộ lọc'}
                  </p>
                  {reports.length === 0 && (
                    <p className="text-xs text-slate-400 max-w-xs">
                      Chọn bài viết và nhấn "Kiểm tra ngay" để bắt đầu phân tích
                    </p>
                  )}
                </div>
              ) : (
                <TableScrollWrapper>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                        {['Bài viết', 'Tác giả', 'Độ tương đồng', 'Mức độ', 'Phương pháp', 'So sánh', 'Ngày', ''].map(h => (
                          <TableHead key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(report => {
                        const cfg = getScoreCfg(report.score);
                        return (
                          <TableRow key={report.id}
                            className={cn('hover:bg-slate-50/80 transition-colors',
                              cfg.severity === 'critical' && 'bg-rose-50/40 hover:bg-rose-50/60')}>
                            <TableCell className="max-w-[240px]">
                              <p className="font-medium text-slate-700 text-sm line-clamp-2 leading-snug">{getTitle(report)}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-slate-600">{getAuthor(report)}</p>
                            </TableCell>
                            <TableCell><ScoreBar score={report.score} /></TableCell>
                            <TableCell>
                              <Badge className={cn('text-xs border font-semibold', cfg.badgeCls)}>{cfg.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="inline-block px-2 py-0.5 rounded-md text-xs font-mono bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                                {report.method}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-500">
                                {report.totalCompared > 0 ? `${report.totalCompared} bài` : '—'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs text-slate-500">
                                {format(new Date(report.checkedAt), 'dd/MM/yyyy', { locale: vi })}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[100px]">
                                {report.checker?.fullName || report.checkedBy || '—'}
                              </p>
                            </TableCell>
                            <TableCell>
                              <button onClick={() => setSelectedReport(report)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all">
                                <Eye className="h-3.5 w-3.5" />
                                Chi tiết
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableScrollWrapper>
              )}
            </div>
          </>
        )}
      </div>

      <DetailDialog report={selectedReport} onClose={() => setSelectedReport(null)} />
    </div>
  );
}
