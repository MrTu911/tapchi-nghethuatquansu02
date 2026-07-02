/**
 * API: Đánh dấu đã đọc hội thoại
 * PATCH /api/chat/conversations/[id]/read
 *
 * Cập nhật lastReadAt của người dùng hiện tại (để tắt badge chưa đọc) và
 * đánh dấu isRead=true cho các tin nhắn do người khác gửi (để read receipt
 * ✓✓ hiển thị đúng phía người gửi). Gọi khi mở/đang đọc một hội thoại.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession();

    if (!session?.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: conversationId } = await context.params;
    const userId = session.uid;

    // Chỉ thành viên active mới được đánh dấu đã đọc
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId, isActive: true },
      select: { id: true },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Not a participant of this conversation' },
        { status: 403 }
      );
    }

    const now = new Date();

    // Cập nhật mốc đọc + đánh dấu tin của người khác là đã đọc
    await prisma.$transaction([
      prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: { lastReadAt: now },
      }),
      prisma.chatMessage.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: { isRead: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark conversation as read' },
      { status: 500 }
    );
  }
}
