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
  MEMBER: 'bg-gray-100 text-gray-500',
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
    return <main className="flex min-h-screen items-center justify-center"><p className="text-[14px] text-gray-400">Loading…</p></main>
  }

  const isOwner = userRole === 'OWNER'
  const isAdmin = isOwner || userRole === 'ADMIN'
  const owner = members.find((m) => m.role === 'OWNER')
  const admins = members.filter((m) => m.role === 'ADMIN')
  const regular = members.filter((m) => m.role === 'MEMBER')

  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[80px] pt-[20px]">
      <Link
        href={`/club/${params.clubId}`}
        className="mb-[20px] inline-flex items-center gap-[4px] text-[13px] font-medium text-gray-400 transition-colors hover:text-gray-600"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to club
      </Link>

      <div className="mb-[24px]">
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Members</h1>
        <p className="mt-[2px] text-[13px] text-gray-400">{members.length} member{members.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Add member form */}
      {isAdmin && (
        <form onSubmit={addMember} className="mb-[24px]">
          <div className="flex gap-[8px]">
            <input
              type="email"
              placeholder="Add by email address…"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setAddError('') }}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-[14px] py-[10px] text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              required
            />
            <button
              type="submit"
              disabled={addLoading || !email.trim()}
              className="shrink-0 rounded-xl bg-primary px-[16px] py-[10px] text-[13px] font-semibold text-white transition-all disabled:opacity-40 active:scale-[0.97]"
            >
              {addLoading ? '…' : 'Add'}
            </button>
          </div>
          {addError && (
            <p className="mt-[6px] text-[12px] text-red-500">{addError}</p>
          )}
        </form>
      )}

      {/* Member list */}
      <div className="space-y-[2px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
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
    <div className="relative flex items-center gap-[12px] px-[16px] py-[12px] transition-colors hover:bg-gray-50/50">
      {/* Avatar */}
      {member.user.image ? (
        <img src={member.user.image} alt="" className="h-[36px] w-[36px] rounded-full object-cover" />
      ) : (
        <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-gray-100 text-[14px] font-semibold text-gray-500">
          {initial}
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px]">
          <p className="truncate text-[14px] font-medium text-gray-900">{member.user.name ?? 'Unnamed'}</p>
          <span className={`shrink-0 rounded-full px-[7px] py-[1px] text-[10px] font-semibold ${roleColor[member.role]}`}>
            {roleLabel[member.role]}
          </span>
        </div>
        <p className="truncate text-[12px] text-gray-400">{member.user.email}</p>
      </div>

      {/* Actions */}
      {canManage && (
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={busy}
            className="flex h-[32px] w-[32px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.2" fill="currentColor"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="13" r="1.2" fill="currentColor"/></svg>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-[36px] z-20 w-[180px] overflow-hidden rounded-xl border border-gray-100 bg-white py-[4px] shadow-lg">
                {member.role === 'MEMBER' ? (
                  <button
                    onClick={() => { onUpdateRole('ADMIN'); setShowMenu(false) }}
                    className="flex w-full items-center gap-[8px] px-[12px] py-[8px] text-left text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9l-3 1.5.5-3.5L2 4.5 5.5 4 7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                    Make Admin
                  </button>
                ) : (
                  <button
                    onClick={() => { onUpdateRole('MEMBER'); setShowMenu(false) }}
                    className="flex w-full items-center gap-[8px] px-[12px] py-[8px] text-left text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 5L5.5 10.5 3 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Make Member
                  </button>
                )}
                <div className="mx-[8px] border-t border-gray-100" />
                <button
                  onClick={() => { onRemove(); setShowMenu(false) }}
                  className="flex w-full items-center gap-[8px] px-[12px] py-[8px] text-left text-[13px] text-red-500 hover:bg-red-50"
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
