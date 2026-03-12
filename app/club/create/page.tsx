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
    <main className="mx-auto max-w-sm px-4 pb-24 pt-8">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-1 text-sm text-neutral">
        ‹ Back
      </button>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Create a Club</h1>
      <p className="mb-6 text-sm text-neutral">{"You'll be the owner and can invite members after."}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-900">Club name</label>
          <input
            type="text"
            placeholder="e.g. Eastside Badminton Club"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-neutral/20 bg-white px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-900">
            Location <span className="font-normal text-neutral">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Eastside Community Centre"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-neutral/20 bg-white px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-white disabled:opacity-50 active:bg-primary-dark"
        >
          {loading ? 'Creating…' : 'Create Club'}
        </button>
      </form>
    </main>
  )
}
