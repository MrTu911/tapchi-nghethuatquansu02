import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Users, Clock, CheckCircle, 
  Mail, Building2, Award, UserPlus
} from 'lucide-react'



export default async function ReviewersManagementPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Get all reviewers with their statistics
  const reviewers = await prisma.user.findMany({
    where: {
      role: 'REVIEWER'
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      org: true,
      reviews: {
        select: {
          id: true,
          submittedAt: true,
          recommendation: true,
          invitedAt: true,
          declinedAt: true,
          submission: {
            select: {
              category: {
                select: { name: true }
              }
            }
          }
        }
      }
    },
    orderBy: {
      fullName: 'asc'
    }
  })

  // Calculate stats for each reviewer
  const reviewersWithStats = reviewers.map(reviewer => {
    const completedReviews = reviewer.reviews.filter(r => r.submittedAt)
    const pendingReviews = reviewer.reviews.filter(r => !r.submittedAt && !r.declinedAt)
    const declinedReviews = reviewer.reviews.filter(r => r.declinedAt)
    
    // Average response time (days from invited to submitted)
    const responseTimes = completedReviews
      .filter(r => r.submittedAt && r.invitedAt)
      .map(r => {
        const invited = new Date(r.invitedAt).getTime()
        const submitted = new Date(r.submittedAt!).getTime()
        return (submitted - invited) / (1000 * 60 * 60 * 24)
      })
    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length)
      : null

    // Categories reviewed
    const categories: string[] = [...new Set(
      reviewer.reviews
        .filter(r => r.submission?.category?.name)
        .map(r => r.submission.category!.name)
    )]

    // Acceptance rate based on recommendations
    const recommendationsWithDecision = completedReviews.filter(r => r.recommendation)
    const acceptRecommendations = recommendationsWithDecision.filter(
      r => r.recommendation === 'ACCEPT' || r.recommendation === 'MINOR'
    ).length
    const acceptanceRate = recommendationsWithDecision.length > 0
      ? Math.round((acceptRecommendations / recommendationsWithDecision.length) * 100)
      : null

    return {
      ...reviewer,
      stats: {
        total: reviewer.reviews.length,
        completed: completedReviews.length,
        pending: pendingReviews.length,
        declined: declinedReviews.length,
        avgResponseTime,
        categories,
        acceptanceRate
      }
    }
  })

  // Overall stats
  const totalReviewers = reviewers.length
  const activeReviewers = reviewersWithStats.filter(r => r.stats.pending > 0 || r.stats.completed > 0).length
  const totalCompletedReviews = reviewersWithStats.reduce((sum, r) => sum + r.stats.completed, 0)
  const totalPendingReviews = reviewersWithStats.reduce((sum, r) => sum + r.stats.pending, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand dark:text-emerald-300">
            Quản lý Phản biện viên
          </h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi hiệu suất và phân công phản biện
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/users?role=REVIEWER">
            <UserPlus className="h-4 w-4 mr-2" />
            Thêm phản biện viên
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Tổng số</p>
                <p className="text-3xl font-bold text-purple-700">{totalReviewers}</p>
              </div>
              <Users className="h-10 w-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Đang hoạt động</p>
                <p className="text-3xl font-bold text-green-700">{activeReviewers}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Đã hoàn thành</p>
                <p className="text-3xl font-bold text-blue-700">{totalCompletedReviews}</p>
              </div>
              <Award className="h-10 w-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Đang chờ</p>
                <p className="text-3xl font-bold text-amber-700">{totalPendingReviews}</p>
              </div>
              <Clock className="h-10 w-10 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviewers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách Phản biện viên</CardTitle>
              <CardDescription>Thông tin và hiệu suất phản biện</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviewersWithStats.map(reviewer => (
              <div 
                key={reviewer.id}
                className="p-4 border rounded-lg hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-emerald-600 flex items-center justify-center text-white font-bold">
                        {reviewer.fullName?.charAt(0) || 'R'}
                      </div>
                      <div>
                        <h3 className="font-semibold">{reviewer.fullName}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {reviewer.email}
                        </p>
                      </div>
                    </div>
                    
                    {reviewer.org && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2 ml-13">
                        <Building2 className="h-3 w-3" />
                        {reviewer.org}
                      </p>
                    )}

                    {/* Categories */}
                    {reviewer.stats.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {reviewer.stats.categories.slice(0, 3).map(cat => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                        {reviewer.stats.categories.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{reviewer.stats.categories.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{reviewer.stats.completed}</p>
                      <p className="text-xs text-muted-foreground">Hoàn thành</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">{reviewer.stats.pending}</p>
                      <p className="text-xs text-muted-foreground">Đang chờ</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{reviewer.stats.declined}</p>
                      <p className="text-xs text-muted-foreground">Từ chối</p>
                    </div>
                    {reviewer.stats.avgResponseTime !== null && (
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{reviewer.stats.avgResponseTime}d</p>
                        <p className="text-xs text-muted-foreground">TB phản hồi</p>
                      </div>
                    )}
                    {reviewer.stats.acceptanceRate !== null && (
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{reviewer.stats.acceptanceRate}%</p>
                        <p className="text-xs text-muted-foreground">Tỷ lệ đề xuất</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/editor/assign-reviewers?reviewerId=${reviewer.id}`}>
                        Gán bài
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {reviewersWithStats.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có phản biện viên nào</p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/admin/users">
                    Thêm phản biện viên
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
