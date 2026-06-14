/**
 * API Kiểm tra đạo văn nội bộ
 * POST /api/plagiarism/check
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { checkSubmissionPlagiarism, savePlagiarismReport, getLatestPlagiarismReport } from '@/lib/plagiarism'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit-logger'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Chỉ biên tập viên và admin mới được kiểm tra
    const allowedRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'LAYOUT_EDITOR', 'SYSADMIN']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền thực hiện chức năng này' },
        { status: 403 }
      )
    }
    
    const { submissionId, method = 'cosine' } = await req.json()
    
    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu submissionId' },
        { status: 400 }
      )
    }
    
    // Kiểm tra submission tồn tại
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, code: true, title: true }
    })
    
    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy bài nộp' },
        { status: 404 }
      )
    }
    
    // Thực hiện kiểm tra đạo văn
    const result = await checkSubmissionPlagiarism(
      submissionId, 
      method as 'cosine' | 'jaccard'
    )
    
    // Lưu kết quả
    const report = await savePlagiarismReport(submissionId, result, session.uid)
    
    // Ghi audit log
    await logAudit({
      actorId: session.uid,
      action: 'PLAGIARISM_CHECK',
      object: `submission:${submissionId}`,
      after: {
        method,
        score: result.score,
        matchCount: result.matches.length,
        totalCompared: result.totalCompared
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        score: result.score,
        averageScore: result.averageScore,
        totalCompared: result.totalCompared,
        matchCount: result.matches.length,
        matches: result.matches,
        method: result.method,
        checkedAt: report.checkedAt
      }
    })
    
  } catch (error: any) {
    console.error('Plagiarism check error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi kiểm tra đạo văn' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/plagiarism/check?submissionId=xxx
 * Lấy báo cáo kiểm tra đạo văn mới nhất
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(req.url)
    const submissionId = searchParams.get('submissionId')
    
    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu submissionId' },
        { status: 400 }
      )
    }
    
    const report = await getLatestPlagiarismReport(submissionId)
    
    if (!report) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Chưa có báo cáo kiểm tra đạo văn'
      })
    }
    
    // Normalize matches: old reports stored { similarArticles: [] }, new ones store PlagiarismMatch[]
    const rawMatches = report.matches
    const normalizedMatches = Array.isArray(rawMatches) ? rawMatches : []

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        score: report.score,
        method: report.method,
        status: report.status,
        matches: normalizedMatches,
        totalCompared: report.totalCompared,
        checkedAt: report.checkedAt,
        checkedBy: report.checker?.fullName || 'Hệ thống',
        notes: report.notes
      }
    })
    
  } catch (error: any) {
    console.error('Get plagiarism report error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi lấy báo cáo' },
      { status: 500 }
    )
  }
}
