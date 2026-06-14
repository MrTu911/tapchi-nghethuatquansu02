
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit, AuditEventType } from '@/lib/audit-logger';
import { getCachedData, invalidateCache } from '@/lib/cache';

/**
 * GET /api/site-settings
 * Retrieve all site settings or filter by category
 */
const SETTINGS_TTL = 5 * 60 // 5 minutes — settings change very rarely, but must feel fresh

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const cacheKey = `site-settings:${category ?? 'all'}`

    let settings = await getCachedData(
      cacheKey,
      () => prisma.siteSetting.findMany({
        where: category ? { category } : {},
        orderBy: [{ category: 'asc' }, { order: 'asc' }],
      }),
      SETTINGS_TTL
    )

    // Don't serve a stale empty-cache: if cached result is empty, re-query DB
    if (settings.length === 0) {
      invalidateCache(cacheKey)
      settings = await getCachedData(
        cacheKey,
        () => prisma.siteSetting.findMany({
          where: category ? { category } : {},
          orderBy: [{ category: 'asc' }, { order: 'asc' }],
        }),
        SETTINGS_TTL
      )
    }

    return successResponse({ settings });
  } catch (error: unknown) {
    console.error('[SITE_SETTINGS GET]', error);
    return errorResponse('Failed to fetch site settings', 500);
  }
}

/**
 * POST /api/site-settings
 * Create a new site setting (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return errorResponse('Unauthorized', 403);
    }

    const body = await request.json();
    const { category, key, value, label, labelEn, type, placeholder, helpText, order } = body;

    // Validate required fields
    if (!category || !key || !label || !type) {
      return errorResponse('Missing required fields: category, key, label, type', 400);
    }

    // Check for duplicate key
    const existing = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (existing) {
      return errorResponse('A setting with this key already exists', 400);
    }

    // Create setting
    const setting = await prisma.siteSetting.create({
      data: {
        category,
        key,
        value: value || null,
        label,
        labelEn: labelEn || null,
        type,
        placeholder: placeholder || null,
        helpText: helpText || null,
        order: order || 0,
      },
    });

    // Log audit event
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SETTINGS_CHANGED,
      object: 'SiteSetting',
      after: { key, category, settingId: setting.id },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    invalidateCache('site-settings:')
    return successResponse({ setting }, 'Site setting created successfully');
  } catch (error: unknown) {
    console.error('[SITE_SETTINGS POST]', error);
    return errorResponse('Failed to create site setting', 500);
  }
}

/**
 * PUT /api/site-settings (Bulk update)
 * Update multiple site settings at once
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return errorResponse('Unauthorized', 403);
    }

    const body = await request.json();
    const { settings } = body; // Array of { key, value }

    if (!Array.isArray(settings) || settings.length === 0) {
      return errorResponse('Invalid settings array', 400);
    }

    // Bulk update settings
    const updates = await Promise.all(
      settings.map(async ({ key, value }) => {
        return prisma.siteSetting.update({
          where: { key },
          data: { value },
        });
      })
    );

    // Log audit event
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SETTINGS_CHANGED,
      object: 'SiteSetting',
      after: { count: settings.length, keys: settings.map((s: any) => s.key) },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    invalidateCache('site-settings:')
    return successResponse({ updated: updates.length }, 'Site settings updated successfully');
  } catch (error: unknown) {
    console.error('[SITE_SETTINGS PUT]', error);
    return errorResponse('Failed to update site settings', 500);
  }
}
