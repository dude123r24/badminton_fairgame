import { getSession } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const roleLabel: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
}

const roleColor: Record<string, string> = {
  OWNER: 'bg-primary/10 text-primary',
  ADMIN: 'bg-amber-50 text-amber-600',
  MEMBER: 'bg-gray-100 text-gray-500',
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const memberships = await prisma.clubMembership.findMany({
    where: { userId: session.user.id, status: 'ACTIVE' },
    include: {
      club: {
        include: {
          _count: { select: { memberships: true } },
          clubSessions: {
            where: { status: { in: ['UPCOMING', 'ACTIVE'] } },
            orderBy: { date: 'asc' },
            take: 5,
            select: { id: true, date: true, status: true, name: true },
          },
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  })

  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[80px] pt-[24px]">
      {/* Header */}
      <div className="mb-[24px]">
        <p className="mb-[2px] text-[13px] font-medium text-gray-400">Welcome back, {firstName}</p>
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-bold tracking-tight text-gray-900">My Clubs</h1>
          <Link
            href="/club/create"
            className="inline-flex items-center gap-[6px] rounded-xl bg-primary px-[16px] py-[10px] text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.2)] transition-all active:scale-[0.97] active:bg-primary-dark"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            New Club
          </Link>
        </div>
      </div>

      {memberships.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 py-[48px] text-center">
          <span className="mb-[12px] text-[48px]">🏸</span>
          <p className="mb-[4px] text-[16px] font-semibold text-gray-900">No clubs yet</p>
          <p className="mb-[24px] text-[14px] text-gray-500">Create a club to start running sessions</p>
          <Link
            href="/club/create"
            className="rounded-xl bg-primary px-[24px] py-[12px] text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.2)]"
          >
            Create your first club
          </Link>
        </div>
      ) : (
        <div className="space-y-[12px]">
          {memberships.map(({ club, role }) => {
            const liveSessions = club.clubSessions.filter((s) => s.status === 'ACTIVE')
            const upcoming = club.clubSessions.filter((s) => s.status === 'UPCOMING')
            const hasLive = liveSessions.length > 0
            return (
              <div key={club.id} className="space-y-[6px]">
                <Link href={`/club/${club.id}`}>
                  <div className={`group relative overflow-hidden rounded-2xl bg-white p-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:scale-[0.99] ${
                    hasLive ? 'ring-1 ring-primary/20' : 'border border-gray-100'
                  }`}>
                    {hasLive && (
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-[8px]">
                          <p className="text-[16px] font-semibold text-gray-900">{club.name}</p>
                          <span className={`rounded-full px-[8px] py-[2px] text-[10px] font-semibold ${roleColor[role] ?? 'bg-gray-100 text-gray-500'}`}>
                            {roleLabel[role] ?? role}
                          </span>
                        </div>
                        <div className="mt-[6px] flex items-center gap-[12px] text-[12px] text-gray-400">
                          <span className="flex items-center gap-[4px]">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1C3.24 1 1 3.24 1 6s2.24 5 5 5 5-2.24 5-5S8.76 1 6 1z" stroke="currentColor" strokeWidth="1.2"/><path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                            {club._count.memberships} member{club._count.memberships !== 1 ? 's' : ''}
                          </span>
                          {club.location && (
                            <span className="flex items-center gap-[4px]">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1C4.07 1 2.5 2.57 2.5 4.5 2.5 7.5 6 11 6 11s3.5-3.5 3.5-6.5C9.5 2.57 7.93 1 6 1z" stroke="currentColor" strokeWidth="1.2"/><circle cx="6" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1"/></svg>
                              {club.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-[12px] shrink-0 text-right">
                        {hasLive ? (
                          <span className="text-[12px] font-semibold text-primary">{liveSessions.length} live</span>
                        ) : upcoming.length > 0 ? (
                          <p className="text-[12px] font-medium text-gray-600">
                            {new Date(upcoming[0].date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                        ) : (
                          <p className="text-[12px] text-gray-400">No upcoming</p>
                        )}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-auto mt-[4px] text-gray-300 transition-colors group-hover:text-gray-500">
                          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
                {/* Quick-access links for live sessions */}
                {liveSessions.map((ls) => (
                  <Link key={ls.id} href={`/session/${ls.id}`}>
                    <div className="ml-[16px] flex items-center gap-[8px] rounded-xl bg-primary/[0.06] px-[14px] py-[10px] transition-colors hover:bg-primary/[0.1]">
                      <span className="relative flex h-[6px] w-[6px]">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                        <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-primary" />
                      </span>
                      <span className="flex-1 text-[13px] font-medium text-primary">
                        {ls.name ?? new Date(ls.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-primary/50"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </Link>
                ))}
              </div>
            )
          })}

          <Link href="/club/create">
            <div className="flex items-center justify-center gap-[8px] rounded-2xl border-2 border-dashed border-gray-200 py-[20px] text-[13px] font-medium text-gray-400 transition-colors hover:border-primary/30 hover:text-primary">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Create another club
            </div>
          </Link>
        </div>
      )}
    </main>
  )
}
