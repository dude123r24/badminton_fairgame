import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createClubSchema = z.object({
  name: z.string().min(1).max(100),
  location: z.string().max(200).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const memberships = await prisma.clubMembership.findMany({
    where: { userId: session.user.id, status: 'ACTIVE' },
    include: {
      club: {
        include: {
          _count: { select: { memberships: true, clubSessions: true } },
          clubSessions: {
            where: { status: { in: ['UPCOMING', 'ACTIVE'] } },
            orderBy: { date: 'asc' },
            take: 1,
            select: { id: true, date: true, status: true, name: true },
          },
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return NextResponse.json(memberships)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createClubSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, location } = parsed.data

  const club = await prisma.$transaction(async (tx) => {
    const newClub = await tx.club.create({
      data: {
        name,
        location,
        ownerId: session.user.id,
      },
    })

    await tx.clubMembership.create({
      data: {
        userId: session.user.id,
        clubId: newClub.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    await tx.playerProfile.create({
      data: {
        userId: session.user.id,
        clubId: newClub.id,
        class: 'INTERMEDIATE',
        rating: 1500,
      },
    })

    return newClub
  })

  return NextResponse.json(club, { status: 201 })
}
