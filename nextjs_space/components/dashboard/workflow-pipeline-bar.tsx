import Link from 'next/link';

interface PipelineStage {
  status: string;
  label: string;
  count: number;
  colorClass: string;
  href: string;
}

interface WorkflowPipelineBarProps {
  stages: PipelineStage[];
}

export default function WorkflowPipelineBar({ stages }: WorkflowPipelineBarProps) {
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        Pipeline xuất bản — {total} bài đang xử lý
      </p>
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
        {stages.map((stage) => (
          <Link
            key={stage.status}
            href={stage.href}
            className={`rounded-lg border p-4 text-center transition-opacity hover:opacity-80 ${stage.colorClass}`}
          >
            <p className="text-2xl font-bold">{stage.count}</p>
            <p className="mt-1 text-xs font-medium leading-tight">{stage.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
