import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'
import { z } from 'zod'

const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { clubId: string; userId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const callerRole = await getUserClubRole(session.user.id, params.clubId)
  if (!callerRole || callerRole !== 'OWNER') {
    return NextResponse.json({ error: 'Only the owner can change roles' }, { status: 403 })
  }

  if (params.userId === session.user.id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = updateMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const membership = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId: params.userId, clubId: params.clubId } },
  })

  if (!membership || membership.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  if (membership.role === 'OWNER') {
    return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 })
  }

  const updated = await prisma.clubMembership.update({
    where: { id: membership.id },
    data: { role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { clubId: string; userId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const callerRole = await getUserClubRole(session.user.id, params.clubId)
  const isSelf = params.userId === session.user.id

  if (!isSelf && (!callerRole || (callerRole !== 'OWNER' && callerRole !== 'ADMIN'))) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const membership = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId: params.userId, clubId: params.clubId } },
  })

  if (!membership || membership.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  if (membership.role === 'OWNER') {
    return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 400 })
  }

  await prisma.clubMembership.update({
    where: { id: membership.id },
    data: { status: 'SUSPENDED' },
  })

  return NextResponse.json({ success: true })
}
