import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { deleteStoredVideoFile } from '@/lib/services/video-upload-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || !['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'].includes(session.role)) {
      return errorResponse('Unauthorized', 401)
    }

    const { id } = params

    const video = await prisma.video.findUnique({ where: { id } })
    if (!video) return errorResponse('Video not found', 404)

    const formData = await request.formData()
    const image = formData.get('thumbnail') as File | null
    if (!image || image.size === 0) return errorResponse('No image provided', 400)

    const buffer = Buffer.from(await image.arrayBuffer())
    const filename = `${Date.now()}-${id}.jpg`
    const dir = join(process.cwd(), 'public/uploads/images/thumbnails')

    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, filename), buffer)

    const thumbnailUrl = `/uploads/images/thumbnails/${filename}`

    // Dọn ảnh đại diện cũ (best-effort) để tránh orphan trên đĩa
    await deleteStoredVideoFile(video.thumbnailUrl)

    await prisma.video.update({
      where: { id },
      data: { thumbnailUrl },
    })

    return successResponse({ thumbnailUrl })
  } catch (error) {
    console.error('Error saving thumbnail:', error)
    return errorResponse('Failed to save thumbnail', 500)
  }
}
