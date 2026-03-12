import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'
import { z } from 'zod'

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = await getUserClubRole(session.user.id, params.clubId)
  if (!role) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }

  const members = await prisma.clubMembership.findMany({
    where: { clubId: params.clubId, status: 'ACTIVE' },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return NextResponse.json(members)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = await getUserClubRole(session.user.id, params.clubId)
  if (!role || (role !== 'OWNER' && role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = addMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const targetUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  })

  if (!targetUser) {
    return NextResponse.json(
      { error: 'No user found with that email' },
      { status: 404 }
    )
  }

  const existing = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId: targetUser.id, clubId: params.clubId } },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'User is already a member' },
      { status: 409 }
    )
  }

  const membership = await prisma.$transaction(async (tx) => {
    const mem = await tx.clubMembership.create({
      data: {
        userId: targetUser.id,
        clubId: params.clubId,
        role: parsed.data.role,
        status: 'ACTIVE',
      },
    })

    // Create player profile if doesn't exist
    await tx.playerProfile.upsert({
      where: { userId_clubId: { userId: targetUser.id, clubId: params.clubId } },
      create: {
        userId: targetUser.id,
        clubId: params.clubId,
        class: 'INTERMEDIATE',
        rating: 1500,
      },
      update: {},
    })

    return mem
  })

  return NextResponse.json(membership, { status: 201 })
}
