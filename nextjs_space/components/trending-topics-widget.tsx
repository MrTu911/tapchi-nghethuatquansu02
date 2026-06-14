
import { Tag } from 'lucide-react';
import Link from 'next/link';

interface TrendingTopicsWidgetProps {
  topics: string[];
}

export default function TrendingTopicsWidget({ topics }: TrendingTopicsWidgetProps) {
  if (!topics || topics.length === 0) {
    topics = ['Chiến lược quân sự', 'Nghệ thuật tác chiến', 'Lịch sử quân sự', 'Chiến dịch học', 'Chiến thuật học', 'Quốc phòng'];
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
      <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Chủ đề nổi bật
      </h4>
      <div className="flex flex-wrap gap-2">
        {topics.slice(0, 8).map((topic, index) => (
          <Link
            key={index}
            href={`/search?keyword=${encodeURIComponent(topic)}`}
            className="bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-300 px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            {topic}
          </Link>
        ))}
      </div>
    </div>
  );
}
