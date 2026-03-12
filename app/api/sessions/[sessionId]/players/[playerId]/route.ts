import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'
import { z } from 'zod'

const updatePlayerSchema = z.object({
  status: z.enum(['AVAILABLE', 'SITTING_OUT', 'ABSENT']),
})

async function getClubRole(sessionId: string, userId: string) {
  const s = await prisma.clubSession.findUnique({
    where: { id: sessionId },
    select: { clubId: true },
  })
  if (!s) return null
  return getUserClubRole(userId, s.clubId)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string; playerId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = await getClubRole(params.sessionId, session.user.id)
  if (!role || (role !== 'OWNER' && role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updatePlayerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await prisma.sessionPlayer.update({
    where: { id: params.playerId },
    data: { status: parsed.data.status },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { sessionId: string; playerId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = await getClubRole(params.sessionId, session.user.id)
  if (!role || (role !== 'OWNER' && role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  await prisma.sessionPlayer.delete({ where: { id: params.playerId } })

  return new NextResponse(null, { status: 204 })
}
