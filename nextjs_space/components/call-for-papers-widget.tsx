
import { Megaphone } from 'lucide-react';

export default function CallForPapersWidget() {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
      <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
        <Megaphone className="h-4 w-4" />
        Thông báo – Tuyển bài
      </h4>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        Tạp chí Nghệ thuật Quân sự Việt Nam trân trọng mời các nhà nghiên cứu gửi bài cho số đặc biệt về
        "Ứng dụng công nghệ mới trong nghệ thuật quân sự". Hạn nộp bài: 31/12/2025.
      </p>
    </div>
  );
}
