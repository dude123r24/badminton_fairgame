'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateClubPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Club name is required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), location: location.trim() || undefined }),
      })
      if (!res.ok) { setError('Failed to create club'); return }
      const club = await res.json()
      router.push(`/club/${club.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-sm px-[16px] pb-[100px] pt-[24px] sm:px-[24px]">
      <button onClick={() => router.back()} className="mb-[20px] inline-flex min-h-[44px] items-center gap-[6px] text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back
      </button>
      <h1 className="mb-[4px] text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create a Club</h1>
      <p className="mb-[24px] text-sm" style={{ color: 'var(--text-secondary)' }}>{"You'll be the owner and can invite members after."}</p>

      <form onSubmit={handleSubmit} className="space-y-[16px]">
        <div>
          <label className="mb-[6px] block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Club name</label>
          <input
            type="text"
            placeholder="e.g. Eastside Badminton Club"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border px-[16px] py-[14px] text-[16px] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
            style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="mb-[6px] block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Location <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Eastside Community Centre"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border px-[16px] py-[14px] text-[16px] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
            style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded-xl bg-primary py-[14px] text-base font-semibold text-white disabled:opacity-50 active:scale-[0.98] active:bg-primary-dark"
        >
          {loading ? 'Creating...' : 'Create Club'}
        </button>
      </form>
    </main>
  )
}
