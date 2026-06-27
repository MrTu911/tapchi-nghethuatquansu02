import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { can, type Role } from "@/lib/rbac";

/**
 * GET /api/public-pages/[id]/versions
 * Liệt kê lịch sử phiên bản của một trang public (admin only).
 * Trả về metadata + nội dung để client xem trước / khôi phục.
 */
export async function GET(
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

    const versions = await prisma.publicPageVersion.findMany({
      where: { pageId: params.id },
      orderBy: { versionNo: "desc" },
    });

    return NextResponse.json({ success: true, data: versions });
  } catch (error: any) {
    console.error("List public page versions error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
