import { prisma } from "@/lib/prisma";
import type { Prisma, PublicPage } from "@prisma/client";

/**
 * Service: lịch sử phiên bản trang public.
 * Chụp snapshot trạng thái HIỆN TẠI của trang trước khi nó bị ghi đè (lưu tay /
 * publish / restore), đánh số tăng dần và prune để tránh phình bảng.
 */

// Giữ tối đa số bản gần nhất cho mỗi trang.
const MAX_VERSIONS_PER_PAGE = 50;

// Các field nội dung; chỉ snapshot khi một trong số này thực sự thay đổi.
const VERSIONED_FIELDS = [
  "title",
  "titleEn",
  "content",
  "contentEn",
  "metaTitle",
  "metaTitleEn",
  "metaDesc",
  "metaDescEn",
  "ogImage",
  "template",
] as const;

type VersionedField = (typeof VERSIONED_FIELDS)[number];

/**
 * Xác định bản cập nhật có chạm vào nội dung trang hay không
 * (so giá trị mới trong updateData với giá trị hiện tại của trang).
 */
export function hasContentChange(
  current: Pick<PublicPage, VersionedField>,
  updateData: Record<string, unknown>
): boolean {
  return VERSIONED_FIELDS.some(
    (field) =>
      updateData[field] !== undefined &&
      updateData[field] !== (current[field] as unknown)
  );
}

/**
 * Tạo một snapshot từ trạng thái hiện tại của trang.
 * Phải gọi TRƯỚC khi update/ghi đè trang.
 * Dùng tx (transaction client) khi có để đảm bảo tính nguyên tử.
 */
export async function snapshotPublicPage(
  page: PublicPage,
  options: {
    changeNote?: string;
    actorId?: string | null;
    actorName?: string | null;
    tx?: Prisma.TransactionClient;
  } = {}
): Promise<void> {
  const db = options.tx ?? prisma;

  const last = await db.publicPageVersion.findFirst({
    where: { pageId: page.id },
    orderBy: { versionNo: "desc" },
    select: { versionNo: true },
  });
  const nextVersionNo = (last?.versionNo ?? 0) + 1;

  await db.publicPageVersion.create({
    data: {
      pageId: page.id,
      versionNo: nextVersionNo,
      title: page.title,
      titleEn: page.titleEn,
      content: page.content,
      contentEn: page.contentEn,
      metaTitle: page.metaTitle,
      metaTitleEn: page.metaTitleEn,
      metaDesc: page.metaDesc,
      metaDescEn: page.metaDescEn,
      ogImage: page.ogImage,
      template: page.template,
      changeNote: options.changeNote ?? null,
      createdById: options.actorId ?? null,
      createdByName: options.actorName ?? null,
    },
  });

  await pruneVersions(page.id, db);
}

/**
 * Giữ tối đa MAX_VERSIONS_PER_PAGE bản gần nhất, xoá phần dư cũ nhất.
 */
async function pruneVersions(
  pageId: string,
  db: Prisma.TransactionClient | typeof prisma
): Promise<void> {
  const total = await db.publicPageVersion.count({ where: { pageId } });
  if (total <= MAX_VERSIONS_PER_PAGE) return;

  const toRemove = total - MAX_VERSIONS_PER_PAGE;
  const oldest = await db.publicPageVersion.findMany({
    where: { pageId },
    orderBy: { versionNo: "asc" },
    take: toRemove,
    select: { id: true },
  });

  await db.publicPageVersion.deleteMany({
    where: { id: { in: oldest.map((v) => v.id) } },
  });
}
