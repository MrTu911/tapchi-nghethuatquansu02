
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getServerSession } from "@/lib/auth";
import { can, type Role } from "@/lib/rbac";
import { logAudit } from "@/lib/audit-logger";

/**
 * API: Navigation Item Operations
 * GET /api/navigation/[id] - Get item by ID
 * PATCH /api/navigation/[id] - Update item (ADMIN only)
 * DELETE /api/navigation/[id] - Delete item (ADMIN only)
 */

// GET: Get navigation item by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.navigationItem.findUnique({
      where: { id: params.id }
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: "Navigation item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item
    });

  } catch (error: any) {
    console.error("Get navigation item error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update navigation item (ADMIN only)
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

    const body = await req.json();
    const updateData: any = {};

    if (body.label !== undefined) updateData.label = body.label;
    if (body.labelEn !== undefined) updateData.labelEn = body.labelEn;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.parentId !== undefined) updateData.parentId = body.parentId;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.target !== undefined) updateData.target = body.target;
    if (body.icon !== undefined) updateData.icon = body.icon;

    const item = await prisma.navigationItem.update({
      where: { id: params.id },
      data: updateData
    });

    await logAudit({
      actorId: session.uid,
      action: "NAVIGATION_ITEM_UPDATED",
      object: `navigation:${item.id}`,
      objectId: item.id,
      after: { label: item.label, url: item.url, isActive: item.isActive },
    });

    return NextResponse.json({
      success: true,
      data: item
    });

  } catch (error: any) {
    console.error("Update navigation item error:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: "Navigation item not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete navigation item (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session || !['SYSADMIN'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Only SYSADMIN can delete navigation items" },
        { status: 403 }
      );
    }

    const deleted = await prisma.navigationItem.delete({
      where: { id: params.id }
    });

    await logAudit({
      actorId: session.uid,
      action: "NAVIGATION_ITEM_DELETED",
      object: `navigation:${deleted.id}`,
      objectId: deleted.id,
      before: { label: deleted.label, url: deleted.url },
    });

    return NextResponse.json({
      success: true,
      message: "Navigation item deleted successfully"
    });

  } catch (error: any) {
    console.error("Delete navigation item error:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: "Navigation item not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
