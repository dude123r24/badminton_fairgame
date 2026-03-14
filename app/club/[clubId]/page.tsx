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
    <main className="mx-auto max-w-[768px] px-[16px] pb-[140px] pt-[16px] sm:px-[24px] sm:pt-[24px]">
      <Link href="/dashboard" className="mb-[16px] inline-flex min-h-[44px] items-center gap-[6px] text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        My Clubs
      </Link>

      <div className="mb-[24px]">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{club.name}</h1>
        {club.location && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{club.location}</p>}
        <p className="mt-[4px] text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {club._count.memberships} member{club._count.memberships !== 1 ? 's' : ''} · {role.charAt(0) + role.slice(1).toLowerCase()}
        </p>
      </div>

      <section className="mb-[24px]">
        <h2 className="mb-[12px] text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Sessions</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed py-[40px] text-center" style={{ borderColor: 'var(--border-default)' }}>
            <p className="mb-[4px] text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No upcoming sessions</p>
            {isAdmin && (
              <Link href={`/club/${params.clubId}/sessions/new`}
                className="mt-[12px] inline-block rounded-xl bg-primary px-[20px] py-[12px] text-sm font-semibold text-white">
                Create session
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-[8px]">
            {upcoming.map((s) => {
              const isLive = s.status === 'ACTIVE'
              return (
                <Link key={s.id} href={isLive ? `/session/${s.id}` : `/session/${s.id}/setup`}>
                  <div className="card flex min-h-[56px] items-center gap-[12px] px-[16px] py-[14px] active:scale-[0.99]">
                    <div className={`flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl text-lg ${isLive ? 'bg-primary/10' : ''}`}
                      style={!isLive ? { backgroundColor: 'var(--bg-hover)' } : undefined}>
                      {isLive ? '🟢' : '📅'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {s.name ?? new Date(s.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(s.date).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{s.courts} court{s.courts !== 1 ? 's' : ''}
                        {' · '}{s._count.sessionPlayers} player{s._count.sessionPlayers !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-[8px]">
                      {isLive && (
                        <span className="rounded-full bg-primary/10 px-[8px] py-[3px] text-xs font-semibold text-primary">LIVE</span>
                      )}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--text-tertiary)' }}><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mb-[24px]">
          <h2 className="mb-[12px] text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Past Sessions</h2>
          <div className="space-y-[8px]">
            {past.map((s) => (
              <Link key={s.id} href={`/session/${s.id}`}>
                <div className="card flex min-h-[56px] items-center gap-[12px] px-[16px] py-[14px] opacity-70">
                  <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>🏸</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {s.name ?? new Date(s.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{s._count.sessionPlayers} players · {s._count.games} games</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--text-tertiary)' }}><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="safe-bottom-bar fixed bottom-0 left-0 right-0 z-40 border-t px-[16px] py-[12px]"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'color-mix(in srgb, var(--bg-card) 90%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="mx-auto flex max-w-[768px] gap-[8px]">
          {isAdmin && (
            <Link href={`/club/${params.clubId}/sessions/new`} className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)]">
              + New Session
            </Link>
          )}
          <Link href={`/club/${params.clubId}/standings`} className="icon-btn border" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }} aria-label="Standings">
            <span className="text-base">🏆</span>
          </Link>
          {isAdmin && (
            <>
              <Link href={`/club/${params.clubId}/members`} className="flex min-h-[48px] items-center rounded-xl border px-[16px] text-sm font-semibold"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                Members
              </Link>
              <Link href={`/club/${params.clubId}/settings`} className="icon-btn border" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }} aria-label="Club settings">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 2.5l.7-1.2a1 1 0 011.6 0l.7 1.2 1.4.1a1 1 0 01.8 1.4l-.6 1.2.6 1.2a1 1 0 01-.8 1.4l-1.4.1-.7 1.2a1 1 0 01-1.6 0l-.7-1.2-1.4-.1a1 1 0 01-.8-1.4l.6-1.2-.6-1.2a1 1 0 01.8-1.4l1.4-.1z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
