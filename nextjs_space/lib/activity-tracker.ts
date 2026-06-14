/**
 * Activity Tracker - Internal Analytics System
 * 
 * Wrapper around audit-logger for tracking user activities and behaviors.
 * Designed for intranet environments without external analytics dependencies.
 * 
 * Usage:
 *   import { trackView, trackDownload, trackSearch } from '@/lib/activity-tracker'
 *   
 *   // In API routes
 *   await trackView(userId, 'ARTICLE', articleId)
 *   await trackDownload(userId, fileId)
 *   await trackSearch(userId, 'query text')
 */

import { logAudit } from './audit-logger'

/**
 * Activity parameters interface
 */
export interface ActivityParams {
  userId: string
  action: string
  entityType?: string
  entityId?: string | null
  metadata?: Record<string, any>
}

/**
 * Activity event types for internal analytics
 */
export const ActivityEvents = {
  // Authentication & Access
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  
  // Content Viewing
  VIEW_ARTICLE: 'VIEW_ARTICLE',
  VIEW_SUBMISSION: 'VIEW_SUBMISSION',
  VIEW_ISSUE: 'VIEW_ISSUE',
  VIEW_CATEGORY: 'VIEW_CATEGORY',
  
  // File Operations
  DOWNLOAD_PDF: 'DOWNLOAD_PDF',
  DOWNLOAD_FILE: 'DOWNLOAD_FILE',
  UPLOAD_FILE: 'UPLOAD_FILE',
  
  // Search & Discovery
  SEARCH: 'SEARCH',
  ADVANCED_SEARCH: 'ADVANCED_SEARCH',
  FILTER: 'FILTER',
  
  // Submission Actions
  CREATE_SUBMISSION: 'CREATE_SUBMISSION',
  UPDATE_SUBMISSION: 'UPDATE_SUBMISSION',
  SUBMIT_REVISION: 'SUBMIT_REVISION',
  
  // Review Actions
  VIEW_REVIEW: 'VIEW_REVIEW',
  SUBMIT_REVIEW: 'SUBMIT_REVIEW',
  UPDATE_REVIEW: 'UPDATE_REVIEW',
  
  // Editorial Actions
  ASSIGN_REVIEWER: 'ASSIGN_REVIEWER',
  MAKE_DECISION: 'MAKE_DECISION',
  PUBLISH_ARTICLE: 'PUBLISH_ARTICLE',
  
  // Communication
  SEND_MESSAGE: 'SEND_MESSAGE',
  VIEW_MESSAGE: 'VIEW_MESSAGE',
  
  // Data Export
  EXPORT_DATA: 'EXPORT_DATA',
  EXPORT_REPORT: 'EXPORT_REPORT',
} as const

/**
 * Track a user activity
 * 
 * This function logs user activities to the audit log for internal analytics.
 * It's designed to fail silently to avoid disrupting the main application flow.
 * 
 * @param params - Activity parameters
 * @returns Promise that resolves when logging is complete
 * 
 * @example
 * ```typescript
 * await trackActivity({
 *   userId: session.user.id,
 *   action: 'VIEW_ARTICLE',
 *   entityType: 'ARTICLE',
 *   entityId: articleId,
 *   metadata: { source: 'search', category: 'military' }
 * })
 * ```
 */
export async function trackActivity(params: ActivityParams): Promise<void> {
  try {
    await logAudit({
      actorId: params.userId,
      action: params.action,
      object: `${params.entityType || 'SYSTEM'}:${params.entityId || 'N/A'}`,
      after: params.metadata || {},
    })
  } catch (error) {
    // Silent fail - don't crash the app if tracking fails
    console.error('[Activity Tracker] Failed to log activity:', error)
  }
}

/**
 * Track content view (article, issue, submission)
 * 
 * @param userId - User ID
 * @param entityType - Type of content (ARTICLE, ISSUE, SUBMISSION, etc.)
 * @param entityId - Content ID
 * @param metadata - Optional additional data
 * 
 * @example
 * ```typescript
 * await trackView(session.user.id, 'ARTICLE', '123')
 * ```
 */
export async function trackView(
  userId: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>
): Promise<void> {
  return trackActivity({
    userId,
    action: `VIEW_${entityType}`,
    entityType,
    entityId,
    metadata,
  })
}

/**
 * Track file download
 * 
 * @param userId - User ID
 * @param fileId - File ID
 * @param fileType - Type of file (PDF, DOC, etc.)
 * @param metadata - Optional additional data
 * 
 * @example
 * ```typescript
 * await trackDownload(session.user.id, fileId, 'PDF')
 * ```
 */
export async function trackDownload(
  userId: string,
  fileId: string,
  fileType?: string,
  metadata?: Record<string, any>
): Promise<void> {
  return trackActivity({
    userId,
    action: ActivityEvents.DOWNLOAD_FILE,
    entityType: 'FILE',
    entityId: fileId,
    metadata: { fileType, ...metadata },
  })
}

/**
 * Track search query
 * 
 * @param userId - User ID
 * @param query - Search query text
 * @param searchType - Type of search (basic, advanced, filter)
 * @param metadata - Optional additional data (filters, results count, etc.)
 * 
 * @example
 * ```typescript
 * await trackSearch(session.user.id, 'nghệ thuật quân sự', 'advanced', {
 *   filters: { category: 'defense', year: 2024 },
 *   resultsCount: 15
 * })
 * ```
 */
export async function trackSearch(
  userId: string,
  query: string,
  searchType: 'basic' | 'advanced' | 'filter' = 'basic',
  metadata?: Record<string, any>
): Promise<void> {
  return trackActivity({
    userId,
    action: searchType === 'advanced' ? ActivityEvents.ADVANCED_SEARCH : ActivityEvents.SEARCH,
    entityType: 'SEARCH',
    entityId: null,
    metadata: { query, searchType, ...metadata },
  })
}

/**
 * Track submission creation or update
 * 
 * @param userId - User ID
 * @param submissionId - Submission ID
 * @param action - Action type (create, update, submit_revision)
 * @param metadata - Optional additional data
 * 
 * @example
 * ```typescript
 * await trackSubmission(session.user.id, submissionId, 'create')
 * ```
 */
export async function trackSubmission(
  userId: string,
  submissionId: string,
  action: 'create' | 'update' | 'submit_revision',
  metadata?: Record<string, any>
): Promise<void> {
  const actionMap = {
    create: ActivityEvents.CREATE_SUBMISSION,
    update: ActivityEvents.UPDATE_SUBMISSION,
    submit_revision: ActivityEvents.SUBMIT_REVISION,
  }

  return trackActivity({
    userId,
    action: actionMap[action],
    entityType: 'SUBMISSION',
    entityId: submissionId,
    metadata,
  })
}

/**
 * Track review actions
 * 
 * @param userId - User ID
 * @param reviewId - Review ID
 * @param action - Action type (view, submit, update)
 * @param metadata - Optional additional data
 * 
 * @example
 * ```typescript
 * await trackReview(session.user.id, reviewId, 'submit', { rating: 'ACCEPT' })
 * ```
 */
export async function trackReview(
  userId: string,
  reviewId: string,
  action: 'view' | 'submit' | 'update',
  metadata?: Record<string, any>
): Promise<void> {
  const actionMap = {
    view: ActivityEvents.VIEW_REVIEW,
    submit: ActivityEvents.SUBMIT_REVIEW,
    update: ActivityEvents.UPDATE_REVIEW,
  }

  return trackActivity({
    userId,
    action: actionMap[action],
    entityType: 'REVIEW',
    entityId: reviewId,
    metadata,
  })
}

/**
 * Track data export
 * 
 * @param userId - User ID
 * @param exportType - Type of export (report, data, backup)
 * @param format - Export format (PDF, Excel, CSV, etc.)
 * @param metadata - Optional additional data
 * 
 * @example
 * ```typescript
 * await trackExport(session.user.id, 'report', 'PDF', { reportType: 'analytics' })
 * ```
 */
export async function trackExport(
  userId: string,
  exportType: 'report' | 'data' | 'backup',
  format: string,
  metadata?: Record<string, any>
): Promise<void> {
  return trackActivity({
    userId,
    action: exportType === 'report' ? ActivityEvents.EXPORT_REPORT : ActivityEvents.EXPORT_DATA,
    entityType: 'EXPORT',
    entityId: null,
    metadata: { exportType, format, ...metadata },
  })
}
