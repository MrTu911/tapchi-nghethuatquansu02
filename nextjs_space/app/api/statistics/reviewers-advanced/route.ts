
/**
 * 🧠 API: Advanced Reviewer Analytics
 * GET /api/statistics/reviewers-advanced
 */

import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getReviewerAnalytics } from '@/lib/advanced-analytics';
import { successResponse, errorResponse } from '@/lib/responses';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    // Only admin and editors can view
    const allowedRoles = ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Forbidden', 403);
    }

    const analytics = await getReviewerAnalytics();
    return successResponse(analytics);
    
  } catch (error: any) {
    console.error('❌ Error fetching reviewer analytics:', error);
    return errorResponse(error.message || 'Failed to fetch analytics', 500);
  }
}
