import { getSession } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'
import Link from 'next/link'

export default async function ClubPage({ params }: { params: { clubId: string } }) {
  const session = await getSession()
  if (!session) redirect('/')

  const role = await getUserClubRole(session.user.id, params.clubId)
  if (!role) redirect('/dashboard')

  const club = await prisma.club.findUnique({
    where: { id: params.clubId },
    include: {
      _count: { select: { memberships: true } },
      clubSessions: {
        orderBy: { date: 'desc' },
        take: 10,
        include: { _count: { select: { sessionPlayers: true, games: true } } },
      },
    },
  })
  if (!club) redirect('/dashboard')

  const isAdmin = role === 'OWNER' || role === 'ADMIN'
  const upcoming = club.clubSessions.filter((s) => s.status !== 'ENDED')
  const past = club.clubSessions.filter((s) => s.status === 'ENDED')

  return (
    <main className="mx-auto max-w-2xl px-4 pb-32 pt-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="mb-4 flex items-center gap-1 text-sm text-neutral">
          ‹ My Clubs
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{club.name}</h1>
            {club.location && <p className="text-sm text-neutral">{club.location}</p>}
            <p className="mt-1 text-xs text-neutral">
              {club._count.memberships} member{club._count.memberships !== 1 ? 's' : ''} · {role.charAt(0) + role.slice(1).toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming / Active */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Sessions</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral/20 py-10 text-center">
            <p className="mb-1 text-sm font-medium text-gray-900">No upcoming sessions</p>
            {isAdmin && (
              <Link href={`/club/${params.clubId}/sessions/new`}
                className="mt-3 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">
                Create session
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((s) => {
              const isLive = s.status === 'ACTIVE'
              return (
                <Link key={s.id} href={isLive ? `/session/${s.id}` : `/session/${s.id}/setup`}>
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm active:scale-[0.99]">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${isLive ? 'bg-primary/10' : 'bg-neutral-light'}`}>
                      {isLive ? '🟢' : '📅'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {s.name ?? new Date(s.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-neutral">
                        {new Date(s.date).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{s.courts} court{s.courts !== 1 ? 's' : ''}
                        {' · '}{s._count.sessionPlayers} player{s._count.sessionPlayers !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isLive && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">LIVE</span>
                      )}
                      <span className="text-neutral/40">›</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Past sessions */}
      {past.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Past Sessions</h2>
          <div className="space-y-2">
            {past.map((s) => (
              <Link key={s.id} href={`/session/${s.id}`}>
                <div className="flex items-center gap-3 rounded-2xl bg-white/60 px-4 py-3.5 shadow-sm opacity-70">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-light text-lg">🏸</div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {s.name ?? new Date(s.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-neutral">{s._count.sessionPlayers} players · {s._count.games} games</p>
                  </div>
                  <span className="text-neutral/40 shrink-0">›</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky actions */}
      <div className="safe-bottom-bar fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white/90 px-[16px] py-[12px] backdrop-blur-md">
        <div className="mx-auto flex max-w-[640px] gap-[10px]">
          {isAdmin && (
            <Link href={`/club/${params.clubId}/sessions/new`} className="flex-1 rounded-xl bg-primary py-[14px] text-center text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)]">
              + New Session
            </Link>
          )}
          <Link href={`/club/${params.clubId}/standings`} className="rounded-xl border border-gray-200 bg-white px-[16px] py-[14px] text-[14px] font-semibold text-gray-700">
            🏆
          </Link>
          {isAdmin && (
            <>
              <Link href={`/club/${params.clubId}/members`} className="rounded-xl border border-gray-200 bg-white px-[16px] py-[14px] text-[14px] font-semibold text-gray-700">
                Members
              </Link>
              <Link href={`/club/${params.clubId}/settings`} className="rounded-xl border border-gray-200 bg-white px-[16px] py-[14px] text-[14px] font-semibold text-gray-700">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline-block"><path d="M6.5 2.5l.7-1.2a1 1 0 011.6 0l.7 1.2 1.4.1a1 1 0 01.8 1.4l-.6 1.2.6 1.2a1 1 0 01-.8 1.4l-1.4.1-.7 1.2a1 1 0 01-1.6 0l-.7-1.2-1.4-.1a1 1 0 01-.8-1.4l.6-1.2-.6-1.2a1 1 0 01.8-1.4l1.4-.1z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
