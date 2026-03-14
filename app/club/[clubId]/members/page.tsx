'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Member {
  id: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  joinedAt: string
  user: { id: string; name: string | null; email: string; image: string | null }
}

const roleLabel: Record<string, string> = { OWNER: 'Owner', ADMIN: 'Admin', MEMBER: 'Member' }
const roleColor: Record<string, string> = {
  OWNER: 'bg-primary/10 text-primary',
  ADMIN: 'bg-amber-50 text-amber-600',
  MEMBER: '',
}

export default function MembersPage({ params }: { params: { clubId: string } }) {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [email, setEmail] = useState('')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [actionBusy, setActionBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [membersRes, clubRes] = await Promise.all([
      fetch(`/api/clubs/${params.clubId}/members`),
      fetch(`/api/clubs/${params.clubId}`),
    ])
    if (!membersRes.ok) { router.push('/dashboard'); return }
    const membersData = await membersRes.json()
    const clubData = await clubRes.json()
    setMembers(membersData)
    setUserRole(clubData.userRole)
    setLoading(false)
  }, [params.clubId, router])

  useEffect(() => { load() }, [load])

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true); setAddError('')
    const res = await fetch(`/api/clubs/${params.clubId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    if (!res.ok) {
      const data = await res.json()
      setAddError(data.error?.formErrors?.[0] ?? data.error ?? 'Failed to add member')
    } else {
      setEmail('')
    }
    setAddLoading(false)
    await load()
  }

  async function updateRole(userId: string, role: 'ADMIN' | 'MEMBER') {
    setActionBusy(userId)
    await fetch(`/api/clubs/${params.clubId}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    await load()
    setActionBusy(null)
  }

  async function removeMember(userId: string, name: string) {
    if (!confirm(`Remove ${name} from the club?`)) return
    setActionBusy(userId)
    await fetch(`/api/clubs/${params.clubId}/members/${userId}`, { method: 'DELETE' })
    await load()
    setActionBusy(null)
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center"><p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</p></main>
  }

  const isOwner = userRole === 'OWNER'
  const isAdmin = isOwner || userRole === 'ADMIN'
  const owner = members.find((m) => m.role === 'OWNER')
  const admins = members.filter((m) => m.role === 'ADMIN')
  const regular = members.filter((m) => m.role === 'MEMBER')

  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[100px] pt-[16px] sm:px-[24px]">
      <Link
        href={`/club/${params.clubId}`}
        className="mb-[16px] inline-flex min-h-[44px] items-center gap-[6px] text-sm font-medium transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to club
      </Link>

      <div className="mb-[24px]">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Members</h1>
        <p className="mt-[4px] text-sm" style={{ color: 'var(--text-tertiary)' }}>{members.length} member{members.length !== 1 ? 's' : ''}</p>
      </div>

      {isAdmin && (
        <form onSubmit={addMember} className="mb-[24px]">
          <div className="flex gap-[8px]">
            <input
              type="email"
              placeholder="Add by email address..."
              value={email}
              onChange={(e) => { setEmail(e.target.value); setAddError('') }}
              className="flex-1 rounded-xl border px-[14px] py-[12px] text-[16px] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
              required
            />
            <button
              type="submit"
              disabled={addLoading || !email.trim()}
              className="shrink-0 rounded-xl bg-primary px-[16px] py-[12px] text-sm font-semibold text-white transition-all disabled:opacity-40 active:scale-[0.97]"
            >
              {addLoading ? '...' : 'Add'}
            </button>
          </div>
          {addError && (
            <p className="mt-[6px] text-xs text-red-500">{addError}</p>
          )}
        </form>
      )}

      <div className="card space-y-[2px] overflow-hidden">
        {owner && <MemberRow member={owner} isOwner={false} isSelf={false} actionBusy={actionBusy} onUpdateRole={() => {}} onRemove={() => {}} />}
        {admins.map((m) => (
          <MemberRow key={m.id} member={m} isOwner={isOwner} isSelf={false} actionBusy={actionBusy}
            onUpdateRole={(role) => updateRole(m.userId, role)}
            onRemove={() => removeMember(m.userId, m.user.name ?? m.user.email)}
          />
        ))}
        {regular.map((m) => (
          <MemberRow key={m.id} member={m} isOwner={isOwner} isSelf={false} actionBusy={actionBusy}
            onUpdateRole={(role) => updateRole(m.userId, role)}
            onRemove={() => removeMember(m.userId, m.user.name ?? m.user.email)}
          />
        ))}
      </div>
    </main>
  )
}

function MemberRow({ member, isOwner, isSelf: _isSelf, actionBusy, onUpdateRole, onRemove }: {
  member: Member
  isOwner: boolean
  isSelf: boolean
  actionBusy: string | null
  onUpdateRole: (role: 'ADMIN' | 'MEMBER') => void
  onRemove: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const busy = actionBusy === member.userId
  const canManage = isOwner && member.role !== 'OWNER'
  const initial = member.user.name?.charAt(0)?.toUpperCase() ?? member.user.email.charAt(0).toUpperCase()

  return (
    <div className="relative flex items-center gap-[12px] px-[16px] py-[12px] transition-colors" style={{ backgroundColor: 'transparent' }}>
      {member.user.image ? (
        <img src={member.user.image} alt={`${member.user.name ?? 'Member'} avatar`} className="h-[36px] w-[36px] rounded-full object-cover" />
      ) : (
        <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
          {initial}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px]">
          <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{member.user.name ?? 'Unnamed'}</p>
          <span className={`shrink-0 rounded-full px-[8px] py-[2px] text-xs font-semibold ${roleColor[member.role]}`}
            style={!roleColor[member.role] ? { backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' } : undefined}>
            {roleLabel[member.role]}
          </span>
        </div>
        <p className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>{member.user.email}</p>
      </div>

      {canManage && (
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={busy}
            className="icon-btn h-[44px] w-[44px] disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.2" fill="currentColor"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="13" r="1.2" fill="currentColor"/></svg>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-[36px] z-20 w-[180px] overflow-hidden rounded-xl border py-[4px]"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-elevated)' }}>
                {member.role === 'MEMBER' ? (
                  <button
                    onClick={() => { onUpdateRole('ADMIN'); setShowMenu(false) }}
                    className="flex w-full min-h-[44px] items-center gap-[8px] px-[14px] text-left text-sm transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9l-3 1.5.5-3.5L2 4.5 5.5 4 7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                    Make Admin
                  </button>
                ) : (
                  <button
                    onClick={() => { onUpdateRole('MEMBER'); setShowMenu(false) }}
                    className="flex w-full min-h-[44px] items-center gap-[8px] px-[14px] text-left text-sm transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 5L5.5 10.5 3 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Make Member
                  </button>
                )}
                <div className="mx-[8px] border-t" style={{ borderColor: 'var(--border-default)' }} />
                <button
                  onClick={() => { onRemove(); setShowMenu(false) }}
                  className="flex w-full min-h-[44px] items-center gap-[8px] px-[14px] text-left text-sm text-red-500 transition-colors hover:bg-red-50"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M11 4v7.5a1 1 0 01-1 1H4a1 1 0 01-1-1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
