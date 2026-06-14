'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, AlertTriangle, User, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

interface DeadlineCardProps {
  deadline: {
    id: string;
    type: string;
    dueDate: Date | string;
    isOverdue: boolean;
    completedAt: Date | string | null;
    submission: {
      id: string;
      code: string;
      title: string;
      status: string;
    };
    assignedUser?: {
      fullName: string;
      email: string;
    } | null;
  };
  onComplete?: (deadlineId: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  INITIAL_REVIEW: 'Phản biện ban đầu',
  REVISION_SUBMIT: 'Nộp bản sửa',
  RE_REVIEW: 'Phản biện lại',
  EDITOR_DECISION: 'Quyết định biên tập',
  PRODUCTION: 'Sản xuất/Dàn trang',
  PUBLICATION: 'Xuất bản',
};

export default function DeadlineCard({ deadline, onComplete }: DeadlineCardProps) {
  const dueDate = new Date(deadline.dueDate);
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const isUpcoming = dueDate > now && dueDate <= sevenDaysLater;

  const daysOverdue = deadline.isOverdue
    ? Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  return (
    <Card className={`
      ${deadline.isOverdue ? 'border-red-500 bg-red-50/50' : ''}
      ${isUpcoming && !deadline.isOverdue ? 'border-yellow-500 bg-yellow-50/50' : ''}
      ${deadline.completedAt ? 'opacity-60' : ''}
    `}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Type and Status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">
                {TYPE_LABELS[deadline.type] || deadline.type}
              </Badge>
              {deadline.isOverdue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Quá hạn {daysOverdue > 0 ? `${daysOverdue} ngày` : ''}
                </Badge>
              )}
              {isUpcoming && !deadline.isOverdue && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Sắp đến hạn
                </Badge>
              )}
              {deadline.completedAt && (
                <Badge className="flex items-center gap-1 bg-green-600">
                  <CheckCircle className="w-3 h-3" />
                  Đã hoàn thành
                </Badge>
              )}
            </div>

            {/* Submission info */}
            <div>
              <Link
                href={`/dashboard/editor/submissions/${deadline.submission.id}`}
                className="font-medium hover:underline"
              >
                {deadline.submission.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                Mã: {deadline.submission.code}
              </p>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Hạn: {dueDate.toLocaleDateString('vi-VN')}</span>
              <span className="text-muted-foreground">
                ({formatDistanceToNow(dueDate, { addSuffix: true, locale: vi })})
              </span>
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>
                Phụ trách:{' '}
                {deadline.assignedUser?.fullName ?? 'Chưa gán'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/editor/submissions/${deadline.submission.id}`}>
                <ExternalLink className="w-4 h-4 mr-1" />
                Xem & Xử lý
              </Link>
            </Button>
            {!deadline.completedAt && onComplete && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onComplete(deadline.id)}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Hoàn thành
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
