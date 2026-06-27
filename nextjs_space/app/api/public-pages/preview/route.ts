import { NextRequest, NextResponse } from "next/server";
import { draftMode } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { can, type Role } from "@/lib/rbac";

/**
 * GET /api/public-pages/preview?id=<pageId>
 * Bật Next draftMode (admin only) rồi chuyển tới trang public theo slug.
 * Khi draftMode bật, trang /pages/[slug] sẽ render cả bản chưa publish.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session || !can.admin(session.role as Role)) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const slugParam = searchParams.get("slug");

  let slug = slugParam ?? undefined;
  if (!slug && id) {
    const page = await prisma.publicPage.findUnique({
      where: { id },
      select: { slug: true },
    });
    slug = page?.slug;
  }

  if (!slug) {
    return NextResponse.json(
      { success: false, message: "Page not found" },
      { status: 404 }
    );
  }

  draftMode().enable();
  return NextResponse.redirect(new URL(`/pages/${slug}`, req.url));
}
