/**
 * API: Chat Conversations
 * Quản lý hội thoại (tạo mới, lấy danh sách)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canChat, getAllowedRoles, validateConversationParticipants } from '@/lib/chat-guard';
import { z } from 'zod';

// Validation schema
const createConversationSchema = z.object({
  participantIds: z.array(z.string()).min(1, 'Cần ít nhất 1 người tham gia'),
  type: z.enum(['private', 'group', 'system']).default('private'),
  title: z.string().optional(),
});

/**
 * GET /api/chat/conversations
 * Lấy danh sách hội thoại của người dùng hiện tại
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.uid;

    // Lấy danh sách hội thoại mà người dùng tham gia
    const conversations = await prisma.chatConversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
            isActive: true,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                org: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Tính số tin nhắn chưa đọc cho mỗi hội thoại bằng MỘT truy vấn duy nhất
    // (thay vì N count query) rồi đối chiếu với lastReadAt của từng hội thoại.
    const conversationIds = conversations.map((c) => c.id);
    const otherMessages = conversationIds.length
      ? await prisma.chatMessage.findMany({
          where: {
            conversationId: { in: conversationIds },
            senderId: { not: userId },
          },
          select: { conversationId: true, createdAt: true },
        })
      : [];

    const lastReadByConversation = new Map<string, Date>();
    for (const conv of conversations) {
      const participant = conv.participants.find((p) => p.userId === userId);
      lastReadByConversation.set(conv.id, participant?.lastReadAt ?? new Date(0));
    }

    const unreadCountByConversation = new Map<string, number>();
    for (const msg of otherMessages) {
      const lastReadAt = lastReadByConversation.get(msg.conversationId);
      if (lastReadAt && msg.createdAt > lastReadAt) {
        unreadCountByConversation.set(
          msg.conversationId,
          (unreadCountByConversation.get(msg.conversationId) ?? 0) + 1
        );
      }
    }

    const conversationsWithUnread = conversations.map((conv) => ({
      ...conv,
      unreadCount: unreadCountByConversation.get(conv.id) ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: conversationsWithUnread,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations
 * Tạo hội thoại mới hoặc tìm hội thoại đã tồn tại
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createConversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { participantIds, type, title } = validation.data;
    const userId = session.uid;

    // Thêm người dùng hiện tại vào danh sách nếu chưa có
    const allParticipantIds = Array.from(new Set([userId, ...participantIds]));

    // Lấy thông tin người dùng
    const users = await prisma.user.findMany({
      where: {
        id: { in: allParticipantIds },
        isActive: true,
      },
      select: {
        id: true,
        role: true,
        fullName: true,
      },
    });

    if (users.length !== allParticipantIds.length) {
      return NextResponse.json(
        { success: false, error: 'Một số người dùng không tồn tại hoặc không hoạt động' },
        { status: 400 }
      );
    }

    // Kiểm tra quyền chat
    const currentUser = users.find(u => u.id === userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 400 }
      );
    }

    // Validate participants theo quy tắc blind review
    const participantRoles = users.map(u => u.role);
    const validation2 = validateConversationParticipants(participantRoles);
    
    if (!validation2.valid) {
      return NextResponse.json(
        { success: false, error: validation2.reason },
        { status: 403 }
      );
    }

    // Nếu là private chat (2 người), kiểm tra xem đã có hội thoại chưa
    if (type === 'private' && allParticipantIds.length === 2) {
      const existingConversation = await prisma.chatConversation.findFirst({
        where: {
          type: 'private',
          participants: {
            every: {
              userId: { in: allParticipantIds },
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                  org: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation && existingConversation.participants.length === 2) {
        return NextResponse.json({
          success: true,
          data: existingConversation,
          message: 'Hội thoại đã tồn tại',
        });
      }
    }

    // Tạo hội thoại mới
    const conversation = await prisma.chatConversation.create({
      data: {
        type,
        title,
        participants: {
          create: allParticipantIds.map(id => ({
            userId: id,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                org: true,
              },
            },
          },
        },
        messages: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: conversation,
        message: 'Tạo hội thoại thành công',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
