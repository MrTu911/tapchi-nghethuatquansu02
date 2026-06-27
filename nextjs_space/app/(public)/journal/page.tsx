
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { ISSUE_ARTICLE_COUNT_SELECT, getIssueArticleCount } from '@/lib/issue-utils'
import { BookOpen, Calendar, FileText } from 'lucide-react'

export const metadata = {
  title: 'Kho Tạp chí | Tạp chí điện tử Nghệ thuật Quân sự Việt Nam',
  description: 'Danh sách các số tạp chí và bài viết đã xuất bản'
}

export default async function JournalArchivePage() {
  const volumes = await prisma.volume.findMany({
    include: {
      issues: {
        where: {
          status: 'PUBLISHED'
        },
        include: {
          _count: {
            select: ISSUE_ARTICLE_COUNT_SELECT
          }
        },
        orderBy: {
          number: 'desc'
        }
      }
    },
    orderBy: {
      year: 'desc'
    }
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            🌐 Kho Tạp chí Điện tử
          </h1>
          <p className="text-lg text-muted-foreground">
            Các số tạp chí và bài viết khoa học đã xuất bản
          </p>
        </div>

        {volumes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Chưa có số tạp chí nào được xuất bản
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {volumes.map((volume) => (
              <Card key={volume.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Tập {volume.volumeNo} - Năm {volume.year}
                      </CardTitle>
                      {volume.title && (
                        <CardDescription className="mt-2">
                          {volume.title}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {volume.issues.length} số
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {volume.issues.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Chưa có số nào được xuất bản
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {volume.issues.map((issue) => (
                        <Link
                          key={issue.id}
                          href={`/journal/issues/${issue.id}`}
                        >
                          <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader>
                              <CardTitle className="text-lg">
                                Số {issue.number}
                              </CardTitle>
                              {issue.title && (
                                <CardDescription>{issue.title}</CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <FileText className="h-4 w-4" />
                                  <span>{getIssueArticleCount(issue)} bài viết</span>
                                </div>
                                {issue.publishDate && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {new Date(issue.publishDate).toLocaleDateString(
                                        'vi-VN'
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <Button className="w-full mt-4" variant="outline">
                                Xem chi tiết →
                              </Button>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
