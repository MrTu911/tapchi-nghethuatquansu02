import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ArrowLeft, 
  FileEdit, 
  CheckCircle, 
  UserCheck, 
  FileCheck, 
  Layout,
  BookOpen,
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCcw
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Quy trình xuất bản | Tạp chí Nghệ thuật Quân sự Việt Nam',
  description: 'Quy trình xuất bản bài báo khoa học tại Tạp chí Nghệ thuật Quân sự Việt Nam',
}

const publishingSteps = [
  {
    id: 1,
    title: 'Nộp Bài',
    icon: Send,
    duration: '1-2 ngày',
    color: 'blue',
    description: 'Tác giả nộp bản thảo bài báo qua hệ thống trực tuyến',
    details: [
      'Đăng ký tài khoản và đăng nhập vào hệ thống',
      'Điền đầy đủ thông tin bài báo (tiêu đề, tóm tắt, từ khóa)',
      'Tải lên file bài báo (Word hoặc PDF)',
      'Kiểm tra và xác nhận thông tin trước khi gửi',
    ],
    tips: 'Đảm bảo file bài báo tuân thủ đúng template của tạp chí'
  },
  {
    id: 2,
    title: 'Kiểm tra Sơ bộ',
    icon: FileEdit,
    duration: '3-5 ngày',
    color: 'emerald',
    description: 'Ban biên tập kiểm tra tính phù hợp và định dạng của bài báo',
    details: [
      'Kiểm tra tính phù hợp với định hướng của tạp chí',
      'Đánh giá chất lượng khoa học ban đầu',
      'Kiểm tra định dạng và yêu cầu kỹ thuật',
      'Quyết định chuyển phản biện hoặc từ chối',
    ],
    outcomes: [
      { label: 'Chuyển phản biện', icon: CheckCircle2, color: 'green' },
      { label: 'Yêu cầu chỉnh sửa', icon: RefreshCcw, color: 'yellow' },
      { label: 'Từ chối', icon: XCircle, color: 'red' },
    ]
  },
  {
    id: 3,
    title: 'Phản Biện',
    icon: UserCheck,
    duration: '20-30 ngày',
    color: 'purple',
    description: 'Chuyên gia độc lập đánh giá chất lượng khoa học của bài báo',
    details: [
      'Ban biên tập chỉ định 2-3 phản biện viên',
      'Phản biện viên đánh giá nội dung khoa học',
      'Đưa ra nhận xét và khuyến nghị',
      'Thời gian phản biện: 15-20 ngày',
    ],
    tips: 'Tạp chí áp dụng phản biện ẩn danh kép (Double Blind Review)'
  },
  {
    id: 4,
    title: 'Quyết định Biên tập',
    icon: FileCheck,
    duration: '5-7 ngày',
    color: 'orange',
    description: 'Ban biên tập đưa ra quyết định dựa trên kết quả phản biện',
    details: [
      'Tổng hợp ý kiến từ các phản biện viên',
      'Thảo luận trong ban biên tập',
      'Đưa ra quyết định cuối cùng',
      'Thông báo kết quả cho tác giả',
    ],
    outcomes: [
      { label: 'Chấp nhận', icon: CheckCircle2, color: 'green' },
      { label: 'Sửa nhỏ', icon: RefreshCcw, color: 'blue' },
      { label: 'Sửa lớn', icon: RefreshCcw, color: 'yellow' },
      { label: 'Từ chối', icon: XCircle, color: 'red' },
    ]
  },
  {
    id: 5,
    title: 'Chỉnh sửa & Duyệt lại',
    icon: RefreshCcw,
    duration: '10-15 ngày',
    color: 'cyan',
    description: 'Tác giả chỉnh sửa bài báo theo góp ý và gửi lại',
    details: [
      'Tác giả nhận ý kiến phản biện và biên tập',
      'Chỉnh sửa bài báo theo yêu cầu',
      'Viết thư trả lời từng góp ý (response letter)',
      'Nộp lại bản chỉnh sửa và thư trả lời',
    ],
    tips: 'Nên trả lời chi tiết từng góp ý của phản biện viên'
  },
  {
    id: 6,
    title: 'Sản xuất & Trình bày',
    icon: Layout,
    duration: '7-10 ngày',
    color: 'pink',
    description: 'Biên tập bố cục và tạo file xuất bản cuối cùng',
    details: [
      'Biên tập viên bố cục trình bày lại bài báo',
      'Tạo file PDF cuối cùng theo chuẩn tạp chí',
      'Gửi bản proof cho tác giả kiểm tra',
      'Xác nhận và hoàn thiện',
    ],
    tips: 'Tác giả cần kiểm tra kỹ bản proof để tránh sai sót'
  },
  {
    id: 7,
    title: 'Xuất bản',
    icon: BookOpen,
    duration: '1-2 ngày',
    color: 'teal',
    description: 'Bài báo được xuất bản chính thức trên tạp chí',
    details: [
      'Gán DOI cho bài báo',
      'Đăng tải lên website tạp chí',
      'Đưa vào số tạp chí tương ứng',
      'Thông báo cho tác giả về bài báo đã xuất bản',
    ],
    tips: 'Bài báo sẽ có thể được truy cập và trích dẫn ngay sau khi xuất bản'
  }
]

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    iconBg: 'bg-blue-500',
    gradient: 'from-blue-500 to-cyan-500'
  },
  emerald: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    iconBg: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-500'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    iconBg: 'bg-purple-500',
    gradient: 'from-purple-500 to-pink-500'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    iconBg: 'bg-orange-500',
    gradient: 'from-orange-500 to-red-500'
  },
  cyan: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    border: 'border-cyan-300',
    iconBg: 'bg-cyan-500',
    gradient: 'from-cyan-500 to-blue-500'
  },
  pink: {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    border: 'border-pink-300',
    iconBg: 'bg-pink-500',
    gradient: 'from-pink-500 to-rose-500'
  },
  teal: {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-300',
    iconBg: 'bg-teal-500',
    gradient: 'from-teal-500 to-emerald-500'
  }
}

const outcomeColors = {
  green: 'text-green-600 bg-green-50 border-green-200',
  yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  red: 'text-red-600 bg-red-50 border-red-200',
  blue: 'text-blue-600 bg-blue-50 border-blue-200',
}

export default function PublishingProcessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="hover:bg-emerald-50">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Trở về trang chủ
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <AlertCircle className="h-4 w-4" />
            Hướng dẫn cho Tác giả
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 font-serif">
            Quy trình Xuất bản Bài báo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tìm hiểu chi tiết về 7 bước trong quy trình xuất bản bài báo khoa học tại 
            Tạp chí Nghệ thuật Quân sự Việt Nam
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-gray-600">
            <Clock className="h-5 w-5 text-emerald-600" />
            <span className="font-medium">Tổng thời gian trung bình: 50-80 ngày</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-teal-500 hidden md:block"></div>

          {/* Steps */}
          <div className="space-y-12">
            {publishingSteps.map((step, index) => {
              const Icon = step.icon
              const colors = colorClasses[step.color as keyof typeof colorClasses]
              const isEven = index % 2 === 0

              return (
                <div 
                  key={step.id}
                  className={`relative flex flex-col lg:flex-row items-start lg:items-center gap-8 ${
                    isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Step Number Badge - Desktop */}
                  <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white shadow-xl border-4 border-white items-center justify-center z-10">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                      <span className="text-white font-bold text-xl">{step.id}</span>
                    </div>
                  </div>

                  {/* Content Card */}
                  <Card className={`flex-1 shadow-xl hover:shadow-2xl transition-shadow duration-300 ${
                    isEven ? 'lg:mr-8' : 'lg:ml-8'
                  }`}>
                    <CardContent className="p-8">
                      {/* Step Header */}
                      <div className="flex items-start gap-4 mb-6">
                        {/* Icon - Mobile */}
                        <div className={`lg:hidden w-14 h-14 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-gray-900">
                              {step.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}>
                              {step.duration}
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed">
                            {step.description}
                          </p>
                        </div>

                        {/* Icon - Desktop */}
                        <div className={`hidden lg:flex w-16 h-16 rounded-xl bg-gradient-to-br ${colors.gradient} items-center justify-center flex-shrink-0 shadow-lg`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      {/* Details */}
                      <div className={`border-l-4 ${colors.border} pl-6 py-2 bg-gradient-to-r ${colors.bg}/30 to-transparent rounded-r-lg mb-4`}>
                        <h4 className="font-semibold text-gray-900 mb-3">Chi tiết:</h4>
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                              <CheckCircle className={`h-5 w-5 ${colors.iconBg.replace('bg-', 'text-')} flex-shrink-0 mt-0.5`} />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Outcomes */}
                      {step.outcomes && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-3">Kết quả có thể:</h4>
                          <div className="flex flex-wrap gap-2">
                            {step.outcomes.map((outcome, idx) => {
                              const OutcomeIcon = outcome.icon
                              return (
                                <div 
                                  key={idx}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium text-sm ${
                                    outcomeColors[outcome.color as keyof typeof outcomeColors]
                                  }`}
                                >
                                  <OutcomeIcon className="h-4 w-4" />
                                  <span>{outcome.label}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tips */}
                      {step.tips && (
                        <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-amber-900 mb-1">Lưu ý:</p>
                              <p className="text-sm text-amber-800">{step.tips}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>

        {/* Important Notes */}
        <Card className="mt-16 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <AlertCircle className="h-7 w-7 text-blue-600" />
              Lưu ý quan trọng
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Thời gian có thể thay đổi</h3>
                    <p className="text-sm text-gray-700">
                      Thời gian xử lý phụ thuộc vào chất lượng bài báo và tình trạng công việc của ban biên tập
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Tuân thủ template</h3>
                    <p className="text-sm text-gray-700">
                      Bài báo phải tuân thủ đúng template và quy định của tạp chí để tránh bị từ chối
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Phản biện ẩn danh</h3>
                    <p className="text-sm text-gray-700">
                      Tạp chí áp dụng phản biện ẩn danh kép để đảm bảo tính khách quan và công bằng
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Liên hệ hỗ trợ</h3>
                    <p className="text-sm text-gray-700">
                      Nếu có thắc mắc, vui lòng liên hệ ban biên tập qua email hoặc điện thoại
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button asChild size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xl text-lg px-8 py-6">
            <Link href="/dashboard/author/submit">
              <Send className="h-5 w-5 mr-2" />
              Nộp bài ngay
            </Link>
          </Button>
          <p className="mt-4 text-gray-600">
            Đã có tài khoản? <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
