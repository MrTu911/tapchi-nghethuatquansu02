import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { can, type Role } from "@/lib/rbac";
import { logAudit } from "@/lib/audit-logger";
import { snapshotPublicPage } from "@/lib/services/public-page-versions";

/**
 * POST /api/public-pages/[id]/versions/[versionId]/restore
 * Khôi phục trang về một phiên bản cũ:
 *  1. Snapshot trạng thái hiện tại (để có thể undo lại lần restore này).
 *  2. Ghi đè field nội dung từ version đã chọn (KHÔNG đụng isPublished/order/slug).
 *  3. Audit.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
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

    const [current, version] = await Promise.all([
      prisma.publicPage.findUnique({ where: { id: params.id } }),
      prisma.publicPageVersion.findUnique({ where: { id: params.versionId } }),
    ]);

    if (!current) {
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 }
      );
    }
    if (!version || version.pageId !== params.id) {
      return NextResponse.json(
        { success: false, message: "Version not found" },
        { status: 404 }
      );
    }

    const restored = await prisma.$transaction(async (tx) => {
      // Lưu lại bản hiện tại trước khi ghi đè, để admin có đường lùi.
      await snapshotPublicPage(current, {
        changeNote: `Trước khi khôi phục về v${version.versionNo}`,
        actorId: session.uid,
        actorName: session.fullName,
        tx,
      });

      return tx.publicPage.update({
        where: { id: params.id },
        data: {
          title: version.title,
          titleEn: version.titleEn,
          content: version.content,
          contentEn: version.contentEn,
          metaTitle: version.metaTitle,
          metaTitleEn: version.metaTitleEn,
          metaDesc: version.metaDesc,
          metaDescEn: version.metaDescEn,
          ogImage: version.ogImage,
          template: version.template,
        },
      });
    });

    await logAudit({
      actorId: session.uid,
      action: "PUBLIC_PAGE_VERSION_RESTORED",
      object: `public-page:${restored.id}`,
      objectId: restored.id,
      after: { restoredFromVersion: version.versionNo },
      ipAddress:
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        undefined,
    });

    return NextResponse.json({ success: true, data: restored });
  } catch (error: any) {
    console.error("Restore public page version error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
