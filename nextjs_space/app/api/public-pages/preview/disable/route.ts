import { NextRequest, NextResponse } from "next/server";
import { draftMode } from "next/headers";

/**
 * GET /api/public-pages/preview/disable?slug=<slug>
 * Tắt draftMode và quay lại trang (mặc định trang chủ).
 */
export async function GET(req: NextRequest) {
  draftMode().disable();
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const target = slug ? `/pages/${slug}` : "/";
  return NextResponse.redirect(new URL(target, req.url));
}
