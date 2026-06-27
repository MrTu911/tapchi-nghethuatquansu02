
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getServerSession } from "@/lib/auth";
import { can, type Role } from "@/lib/rbac";
import { logAudit } from "@/lib/audit-logger";
import {
  snapshotPublicPage,
  hasContentChange,
} from "@/lib/services/public-page-versions";
import sanitizeHtml from "sanitize-html";

function getClientIp(req: NextRequest): string | undefined {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    undefined
  );
}

/**
 * API: Public Page Operations
 * GET /api/public-pages/[id] - Get page by ID
 * PATCH /api/public-pages/[id] - Update page (ADMIN only)
 * DELETE /api/public-pages/[id] - Delete page (ADMIN only)
 */

// GET: Get page by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const page = await prisma.publicPage.findUnique({
      where: { id: params.id }
    });

    if (!page) {
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: page
    });

  } catch (error: any) {
    console.error("Get public page error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update page (ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!can.admin(session.role as Role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Trạng thái hiện tại — cần để snapshot version + ghi audit before/after.
    const current = await prisma.publicPage.findUnique({
      where: { id: params.id },
    });
    if (!current) {
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    // Autosave gọi với ?snapshot=false để không tạo version cho mỗi lần gõ.
    const allowSnapshot = searchParams.get("snapshot") !== "false";

    const body = await req.json();
    const updateData: any = {};

    // Process fields
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.titleEn !== undefined) updateData.titleEn = body.titleEn;
    if (body.metaTitle !== undefined) updateData.metaTitle = body.metaTitle;
    if (body.metaTitleEn !== undefined) updateData.metaTitleEn = body.metaTitleEn;
    if (body.metaDesc !== undefined) updateData.metaDesc = body.metaDesc;
    if (body.metaDescEn !== undefined) updateData.metaDescEn = body.metaDescEn;
    if (body.ogImage !== undefined) updateData.ogImage = body.ogImage;
    if (body.template !== undefined) updateData.template = body.template;
    if (body.order !== undefined) updateData.order = body.order;
    
    // Sanitize HTML content
    if (body.content !== undefined) {
      updateData.content = sanitizeHtml(body.content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'video', 'audio', 'figure', 'figcaption']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          '*': ['class', 'id', 'style'],
          img: ['src', 'alt', 'title', 'width', 'height'],
          iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
        }
      });
    }

    if (body.contentEn !== undefined) {
      updateData.contentEn = body.contentEn ? sanitizeHtml(body.contentEn, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'video', 'audio', 'figure', 'figcaption']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          '*': ['class', 'id', 'style'],
          img: ['src', 'alt', 'title', 'width', 'height'],
          iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
        }
      }) : null;
    }

    // Handle publish status
    if (body.isPublished !== undefined) {
      updateData.isPublished = body.isPublished;
      if (body.isPublished && !current.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    // Snapshot trạng thái cũ trước khi ghi đè (bỏ qua khi autosave hoặc không đổi nội dung).
    const willSnapshot = allowSnapshot && hasContentChange(current, updateData);

    const page = await prisma.$transaction(async (tx) => {
      if (willSnapshot) {
        await snapshotPublicPage(current, {
          changeNote: typeof body.changeNote === "string" ? body.changeNote : undefined,
          actorId: session.uid,
          actorName: session.fullName,
          tx,
        });
      }
      return tx.publicPage.update({
        where: { id: params.id },
        data: updateData,
      });
    });

    // Audit: phân biệt publish / unpublish / update thường.
    let action = "PUBLIC_PAGE_UPDATED";
    if (body.isPublished !== undefined && body.isPublished !== current.isPublished) {
      action = body.isPublished ? "PUBLIC_PAGE_PUBLISHED" : "PUBLIC_PAGE_UNPUBLISHED";
    }
    await logAudit({
      actorId: session.uid,
      action,
      object: `public-page:${page.id}`,
      objectId: page.id,
      before: { isPublished: current.isPublished, title: current.title, slug: current.slug },
      after: { isPublished: page.isPublished, title: page.title, slug: page.slug },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({
      success: true,
      data: page
    });

  } catch (error: any) {
    console.error("Update public page error:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 }
      );
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: "Page with this slug already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete page (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session || !['SYSADMIN'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Only SYSADMIN can delete pages" },
        { status: 403 }
      );
    }

    const deleted = await prisma.publicPage.delete({
      where: { id: params.id }
    });

    await logAudit({
      actorId: session.uid,
      action: "PUBLIC_PAGE_DELETED",
      object: `public-page:${deleted.id}`,
      objectId: deleted.id,
      before: { slug: deleted.slug, title: deleted.title },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({
      success: true,
      message: "Page deleted successfully"
    });

  } catch (error: any) {
    console.error("Delete public page error:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
