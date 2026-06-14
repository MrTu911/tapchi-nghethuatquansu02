import { FileText, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới nộp',
  DESK_REJECT: 'Từ chối sơ bộ',
  UNDER_REVIEW: 'Đang phản biện',
  REVISION: 'Yêu cầu sửa',
  ACCEPTED: 'Chấp nhận',
  REJECTED: 'Từ chối',
  IN_PRODUCTION: 'Đang sản xuất',
  PUBLISHED: 'Đã xuất bản',
};

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-700 border-slate-200',
  DESK_REJECT: 'bg-red-50 text-red-700 border-red-200',
  UNDER_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
  REVISION: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  IN_PRODUCTION: 'bg-purple-50 text-purple-700 border-purple-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

interface Props {
  submissionId: string;
  submissionCode: string;
  submissionTitle?: string | null;
  submissionStatus?: string | null;
}

export function SubmissionContextBanner({
  submissionId,
  submissionCode,
  submissionTitle,
  submissionStatus,
}: Props) {
  const statusLabel = submissionStatus ? (STATUS_LABELS[submissionStatus] ?? submissionStatus) : null;
  const statusStyle = submissionStatus
    ? (STATUS_STYLES[submissionStatus] ?? 'bg-gray-50 text-gray-700 border-gray-200')
    : '';

  return (
    <div className="mx-4 mt-3 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-blue-700">{submissionCode}</span>
            {statusLabel && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusStyle}`}>
                {statusLabel}
              </span>
            )}
          </div>
          {submissionTitle && (
            <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-xs">{submissionTitle}</p>
          )}
        </div>
      </div>
      <Link
        href={`/dashboard/editor/submissions/${submissionId}`}
        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 font-medium hover:underline transition-colors"
        target="_blank"
      >
        Xem bài
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
