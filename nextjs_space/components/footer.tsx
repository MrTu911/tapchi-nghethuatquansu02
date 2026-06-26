
import Link from 'next/link'
import { MapPin, Mail, Phone, Facebook, Youtube } from 'lucide-react'
import { ExternalLinksSection } from '@/components/external-links-section'

export async function Footer() {
  return (
    <footer className="w-full mt-auto bg-[#6B1313]">
      {/* 4-column info section */}
      <div className="border-t border-[#C8960C]/20">
        <div className="max-w-[1280px] mx-auto px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Cột 1: Về Tạp chí */}
            <div>
              <h4 className="text-[#C8960C] font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-[#C8960C]/30">
                Tạp Chí Nghệ Thuật Quân Sự Việt Nam
              </h4>
              <p className="text-[#F9F9F9]/75 text-sm leading-relaxed">
                Diễn đàn khoa học uy tín về nghệ thuật quân sự, công bố các công trình nghiên cứu có giá trị khoa học và thực tiễn cao.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="text-[10px] bg-[#8B1A1A] text-[#C8960C] px-2 py-1 rounded border border-[#C8960C]/30">ISSN: 1859-0454</span>
              </div>
              <div className="mt-4 space-y-1 text-[11px] text-[#F9F9F9]/55 leading-relaxed">
                <p>Giấy phép hoạt động báo chí số 619/GP-BTTTT do Bộ Thông tin và Truyền thông cấp ngày 23-12-2020.</p>
                <p>In tại Xưởng in Học viện Quốc phòng.</p>
                <p>Hòm thư: 2EA6 – Hà Nội.</p>
              </div>
            </div>

            {/* Cột 2: Chuyên mục */}
            <div>
              <h4 className="text-[#C8960C] font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-[#C8960C]/30">
                Chuyên Mục
              </h4>
              <ul className="space-y-2">
                {[
                  { label: 'Nghệ thuật quân sự', href: '/categories/nghe-thuat-quan-su' },
                  { label: 'Nghiên cứu khoa học', href: '/categories/nckh' },
                  { label: 'Đào tạo & Giáo dục', href: '/categories/dao-tao' },
                  { label: 'Tin tức Học viện', href: '/news' },
                  { label: 'Thông báo', href: '/news?category=thong_bao' },
                  { label: 'Hợp tác quốc tế', href: '/news?category=hop_tac_quoc_te' },
                ].map(item => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-[#F9F9F9]/70 hover:text-[#C8960C] transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#C8960C]/50 flex-shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột 3: Thông tin liên hệ */}
            <div>
              <h4 className="text-[#C8960C] font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-[#C8960C]/30">
                Thông Tin Liên Hệ
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C8960C] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#F9F9F9]/75 leading-relaxed">
                    Học viện Quốc phòng, 93 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#C8960C] flex-shrink-0" />
                  <a href="tel:069556635" className="text-sm text-[#F9F9F9]/75 hover:text-[#C8960C] transition-colors">
                    (069) 556 635
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#C8960C] flex-shrink-0" />
                  <a href="mailto:tapchintqsvn@gmail.com" className="text-sm text-[#F9F9F9]/75 hover:text-[#C8960C] transition-colors">
                    tapchintqsvn@gmail.com
                  </a>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-[#C8960C]/20">
                <p className="text-xs text-[#F9F9F9]/50">Giờ làm việc: Thứ 2 – Thứ 6</p>
                <p className="text-xs text-[#F9F9F9]/50">7:30 – 11:30 | 13:30 – 17:00</p>
              </div>
            </div>

            {/* Cột 4: Mạng xã hội + links hữu ích */}
            <div>
              <h4 className="text-[#C8960C] font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-[#C8960C]/30">
                Kết Nối
              </h4>
              <div className="flex gap-3 mb-5">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#1877F2] flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4 text-white" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#FF0000] flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4 text-white" />
                </a>
                {/* Zalo icon (text-based fallback) */}
                <a
                  href="https://zalo.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#0068FF] flex items-center justify-center transition-colors"
                  aria-label="Zalo"
                >
                  <span className="text-white text-[11px] font-bold">Zalo</span>
                </a>
              </div>

              <div className="[&_h3]:text-[#C8960C]/80 [&_h3]:text-xs [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:mb-2 [&_a]:text-xs [&_a]:text-[#F9F9F9]/60 [&_a:hover]:text-[#C8960C] [&_svg]:text-[#C8960C]/50 [&_svg:hover]:text-[#C8960C]">
                <ExternalLinksSection />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="bg-[#6B1313] border-t border-[#C8960C]/20">
        <div className="max-w-[1440px] mx-auto px-6 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
            <p className="text-[#F9F9F9]/70 text-center sm:text-left text-xs sm:text-sm">
              © {new Date().getFullYear()} Tạp chí Nghệ thuật Quân sự Việt Nam — Học viện Quốc phòng
            </p>
            <div className="flex gap-3 text-xs">
              <Link href="/pages/privacy" className="text-[#C8960C]/70 hover:text-[#C8960C] transition-colors">
                Chính sách bảo mật
              </Link>
              <span className="text-[#C8960C]/30">•</span>
              <Link href="/pages/copyright" className="text-[#C8960C]/70 hover:text-[#C8960C] transition-colors">
                Bản quyền
              </Link>
              <span className="text-[#C8960C]/30">•</span>
              <Link href="/sitemap.xml" className="text-[#C8960C]/70 hover:text-[#C8960C] transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
