import { Database } from 'lucide-react'
import { SearchBar } from '@/components/search-bar'

interface ArchiveHeroProps {
  issn?: string
}

// Dải hero đỏ rượu — nhận diện công báo/tạp chí học thuật. Eyebrow chip + tiêu đề serif + ô tìm kiếm nổi bật.
export function ArchiveHero({ issn = '1859-0454' }: ArchiveHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 shadow-sm">
      {/* Đường kẻ vàng đồng trên đỉnh dải — điểm nhấn ấm trên nền xanh */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#E5C86E] to-transparent" />

      <div className="px-6 py-10 sm:px-10 sm:py-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-4 py-1.5 text-xs font-medium tracking-wide text-white backdrop-blur-sm">
          <Database className="h-3.5 w-3.5" />
          Cơ sở dữ liệu báo chí đã xuất bản · ISSN {issn}
        </div>

        <h1 className="mt-5 font-serif text-3xl font-bold text-white drop-shadow-sm sm:text-4xl md:text-5xl">
          Kho Lưu trữ Tạp chí &amp; Bài báo
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm text-sky-50/95 sm:text-base">
          Tra cứu, duyệt theo số và tải xuống toàn bộ công trình đã công bố trên
          Tạp chí Nghệ thuật Quân sự Việt Nam.
        </p>

        <div className="mx-auto mt-7 max-w-xl">
          <SearchBar
            placeholder="Tìm theo tên bài, tác giả, từ khóa…"
            className="[&_input]:bg-white [&_input]:border-white/60 [&_input]:shadow-md"
          />
        </div>
      </div>
    </section>
  )
}
