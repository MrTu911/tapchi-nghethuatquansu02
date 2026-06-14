'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import DeadlineCard from '@/components/dashboard/deadline-card';
import { toast } from 'sonner';

export interface DeadlineItem {
  id: string;
  type: string;
  dueDate: string;
  isOverdue: boolean;
  completedAt: string | null;
  submission: {
    id: string;
    code: string;
    title: string;
    status: string;
  };
  assignedUser: {
    fullName: string;
    email: string;
  } | null;
}

interface WorkflowDeadlineTabsProps {
  overdueDeadlines: DeadlineItem[];
  upcomingDeadlines: DeadlineItem[];
  myDeadlines: DeadlineItem[];
  allDeadlines: DeadlineItem[];
}

const DEADLINE_TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả loại' },
  { value: 'INITIAL_REVIEW', label: 'Phản biện ban đầu' },
  { value: 'REVISION_SUBMIT', label: 'Nộp bản sửa' },
  { value: 'RE_REVIEW', label: 'Phản biện lại' },
  { value: 'EDITOR_DECISION', label: 'Quyết định biên tập' },
  { value: 'PRODUCTION', label: 'Sản xuất/Dàn trang' },
  { value: 'PUBLICATION', label: 'Xuất bản' },
];

const PAGE_SIZE = 20;

function toDeadlineCardShape(item: DeadlineItem) {
  return {
    ...item,
    dueDate: new Date(item.dueDate),
    completedAt: item.completedAt ? new Date(item.completedAt) : null,
  };
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-8">
        <p className="text-center text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

interface DeadlineListProps {
  items: DeadlineItem[];
  onComplete: (id: string) => void;
  emptyMessage: string;
  filterType?: string;
  showPagination?: boolean;
}

function DeadlineList({ items, onComplete, emptyMessage, filterType, showPagination }: DeadlineListProps) {
  const [page, setPage] = useState(1);

  const filtered = filterType && filterType !== 'ALL'
    ? items.filter((d) => d.type === filterType)
    : items;

  const totalPages = showPagination ? Math.ceil(filtered.length / PAGE_SIZE) : 1;
  const paged = showPagination ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : filtered;

  if (filtered.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-4">
      {paged.map((deadline) => (
        <DeadlineCard
          key={deadline.id}
          deadline={toDeadlineCardShape(deadline)}
          onComplete={onComplete}
        />
      ))}
      {showPagination && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page === 1}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 py-2 text-sm">
                Trang {page} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-disabled={page === totalPages}
                className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

export default function WorkflowDeadlineTabs({
  overdueDeadlines,
  upcomingDeadlines,
  myDeadlines,
  allDeadlines,
}: WorkflowDeadlineTabsProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('ALL');
  const [isPending, startTransition] = useTransition();

  const handleComplete = async (deadlineId: string) => {
    try {
      const res = await fetch(`/api/deadlines/${deadlineId}/complete`, {
        method: 'PATCH',
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Không thể hoàn thành deadline');
        return;
      }

      toast.success('Đã đánh dấu hoàn thành');
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error('Lỗi kết nối, thử lại sau');
    }
  };

  return (
    <Tabs defaultValue="overdue" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overdue">
          Quá hạn ({overdueDeadlines.length})
        </TabsTrigger>
        <TabsTrigger value="upcoming">
          Sắp đến hạn ({upcomingDeadlines.length})
        </TabsTrigger>
        <TabsTrigger value="my-deadlines">
          Của tôi ({myDeadlines.length})
        </TabsTrigger>
        <TabsTrigger value="all">
          Tất cả ({allDeadlines.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overdue" className="space-y-4">
        <DeadlineList
          items={overdueDeadlines}
          onComplete={handleComplete}
          emptyMessage="Không có deadline quá hạn"
        />
      </TabsContent>

      <TabsContent value="upcoming" className="space-y-4">
        <DeadlineList
          items={upcomingDeadlines}
          onComplete={handleComplete}
          emptyMessage="Không có deadline sắp đến hạn"
        />
      </TabsContent>

      <TabsContent value="my-deadlines" className="space-y-4">
        <DeadlineList
          items={myDeadlines}
          onComplete={handleComplete}
          emptyMessage="Bạn không có deadline nào"
        />
      </TabsContent>

      <TabsContent value="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isPending ? 'Đang cập nhật...' : `${allDeadlines.length} deadline`}
          </p>
          <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); }}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Lọc theo loại" />
            </SelectTrigger>
            <SelectContent>
              {DEADLINE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DeadlineList
          items={allDeadlines}
          onComplete={handleComplete}
          emptyMessage="Không có deadline nào"
          filterType={selectedType}
          showPagination
        />
      </TabsContent>
    </Tabs>
  );
}
