'use client'

import Link from 'next/link'

export default function ModernFooter() {
  return (
    <footer className="bg-[#6B1313] mt-12">
      <div className="max-w-[1440px] mx-auto">
        {/* Bottom Copyright Bar */}
        <div className="bg-[#6B1313] border-t border-[#C8960C]/30">
          <div className="px-6 py-3">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
              <p className="text-[#F9F9F9] text-center sm:text-left text-xs sm:text-sm">
                © {new Date().getFullYear()} Tạp chí Nghệ thuật Quân sự Việt Nam
              </p>
              <div className="flex gap-3 text-xs">
                <Link href="/pages/privacy" className="text-[#C8960C] hover:text-white transition-colors">
                  Chính sách bảo mật
                </Link>
                <span className="text-[#C8960C]/50">•</span>
                <Link href="/pages/copyright" className="text-[#C8960C] hover:text-white transition-colors">
                  Bản quyền
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
