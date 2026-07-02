
import Link from 'next/link'
import { MapPin, Mail, Phone, Facebook, Youtube } from 'lucide-react'
import { ExternalLinksSection } from '@/components/external-links-section'
import { getFooterBranding } from '@/lib/site-settings'

export async function Footer() {
  // Nội dung chân trang lấy từ Cài đặt (DB) — fallback giữ đúng identity NTQS.
  const b = await getFooterBranding()
  const telHref = `tel:${b.phone.replace(/[^0-9+]/g, '')}`

  return (
    <footer className="w-full mt-auto bg-redbar">
      {/* 4-column info section */}
      <div className="border-t border-gold/20">
        <div className="max-w-[1280px] mx-auto px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Cột 1: Về Tạp chí */}
            <div>
              <h4 className="text-gold font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-gold/30">
                {b.siteName}
              </h4>
              <p className="text-[#F9F9F9]/85 text-sm leading-relaxed">
                {b.aboutText}
              </p>
              <div className="mt-4 flex gap-2">
                <span className="text-[10px] bg-redbar-dark text-gold px-2 py-1 rounded border border-gold/30">ISSN: {b.issn}</span>
              </div>
              <div className="mt-4 space-y-1 text-[11px] text-[#F9F9F9]/70 leading-relaxed">
                <p>{b.licenseText}</p>
                <p>{b.printText}</p>
                <p>{b.poBoxText}</p>
              </div>
            </div>

            {/* Cột 2: Chuyên mục */}
            <div>
              <h4 className="text-gold font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-gold/30">
                Chuyên Mục
              </h4>
              <ul className="space-y-2">
                {b.categories.map(item => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-[#F9F9F9]/85 hover:text-gold transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1 h-1 rounded-full bg-gold/50 flex-shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột 3: Thông tin liên hệ */}
            <div>
              <h4 className="text-gold font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-gold/30">
                Thông Tin Liên Hệ
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#F9F9F9]/85 leading-relaxed">
                    {b.address}
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                  <a href={telHref} className="text-sm text-[#F9F9F9]/85 hover:text-gold transition-colors">
                    {b.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                  <a href={`mailto:${b.email}`} className="text-sm text-[#F9F9F9]/85 hover:text-gold transition-colors">
                    {b.email}
                  </a>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gold/20">
                <p className="text-xs text-[#F9F9F9]/70">Giờ làm việc: {b.hours}</p>
              </div>
            </div>

            {/* Cột 4: Mạng xã hội + links hữu ích */}
            <div>
              <h4 className="text-gold font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-gold/30">
                Kết Nối
              </h4>
              <div className="flex gap-3 mb-5">
                <a
                  href={b.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#1877F2] flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4 text-white" />
                </a>
                <a
                  href={b.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#FF0000] flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4 text-white" />
                </a>
                {/* Zalo icon (text-based fallback) */}
                <a
                  href={b.zalo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#0068FF] flex items-center justify-center transition-colors"
                  aria-label="Zalo"
                >
                  <span className="text-white text-[11px] font-bold">Zalo</span>
                </a>
              </div>

              <div className="[&_h3]:text-gold/80 [&_h3]:text-xs [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:mb-2 [&_a]:text-xs [&_a]:text-[#F9F9F9]/80 [&_a:hover]:text-gold [&_svg]:text-gold/50 [&_svg:hover]:text-gold">
                <ExternalLinksSection />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="bg-redbar-dark border-t border-gold/20">
        <div className="max-w-[1440px] mx-auto px-6 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
            <p className="text-[#F9F9F9]/85 text-center sm:text-left text-xs sm:text-sm">
              © {new Date().getFullYear()} {b.siteName} — {b.publisher}
            </p>
            <div className="flex gap-3 text-xs">
              <Link href="/pages/privacy" className="text-gold/70 hover:text-gold transition-colors">
                Chính sách bảo mật
              </Link>
              <span className="text-gold/30">•</span>
              <Link href="/pages/copyright" className="text-gold/70 hover:text-gold transition-colors">
                Bản quyền
              </Link>
              <span className="text-gold/30">•</span>
              <Link href="/sitemap.xml" className="text-gold/70 hover:text-gold transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
