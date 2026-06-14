
import type { Metadata } from "next"
import { Lora } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "./providers"

// Serif hiển thị cho tiêu đề (h1/h2, tên số, tên bài). Body giữ font hệ thống.
// Tải qua next/font để self-host, có vietnamese subset cho dấu tiếng Việt.
const serif = Lora({
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
  display: "swap",
})

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    template: '%s | Tạp chí Nghệ thuật Quân sự Việt Nam',
    default: 'Tạp chí Nghệ thuật Quân sự Việt Nam'
  },
  description: 'Tạp chí chuyên ngành về lĩnh vực nghệ thuật quân sự, được xuất bản định kỳ nhằm phổ biến các nghiên cứu khoa học, kinh nghiệm thực tiễn và những thành tựu mới trong nghệ thuật quân sự của Quân đội nhân dân Việt Nam.',
  keywords: ['nghệ thuật quân sự', 'nghiên cứu khoa học', 'quân đội', 'việt nam', 'tạp chí', 'học thuật'],
  authors: [{ name: 'Học viện Quốc phòng' }],
  openGraph: {
    title: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
    description: 'Tạp chí chuyên ngành về lĩnh vực nghệ thuật quân sự, được xuất bản định kỳ nhằm phổ biến các nghiên cứu khoa học, kinh nghiệm thực tiễn và những thành tựu mới trong nghệ thuật quân sự của Quân đội nhân dân Việt Nam.',
    url: '/',
    siteName: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
    images: ['/og-image.png'],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tạp chí Nghệ thuật Quân sự Việt Nam',
    description: 'Tạp chí chuyên ngành về lĩnh vực nghệ thuật quân sự',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={serif.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="min-h-screen flex flex-col">
              {children}
            </div>
            <Toaster position="top-center" richColors />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
