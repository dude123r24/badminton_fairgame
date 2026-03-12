import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'

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

  const rows = await prisma.sessionPlayer.findMany({
    where: {
      session: { clubId: params.clubId },
      userId: null,
      guestName: { not: null },
    },
    select: {
      guestName: true,
      guestEmail: true,
    },
  })

  // Deduplicate by guestName (case-insensitive), count sessions played
  const map = new Map<string, { guestName: string; guestEmail: string | null; sessionCount: number }>()
  for (const r of rows) {
    if (!r.guestName) continue
    const key = r.guestName.toLowerCase()
    const prev = map.get(key)
    if (prev) {
      prev.sessionCount++
      if (!prev.guestEmail && r.guestEmail) prev.guestEmail = r.guestEmail
    } else {
      map.set(key, { guestName: r.guestName, guestEmail: r.guestEmail, sessionCount: 1 })
    }
  }

  const guests = Array.from(map.values()).sort((a, b) => b.sessionCount - a.sessionCount)

  return NextResponse.json(guests)
}
