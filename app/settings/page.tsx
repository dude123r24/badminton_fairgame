'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserData {
  id: string
  name: string | null
  email: string
  image: string | null
  theme: string
}

const themes = [
  { value: 'system', label: 'System', desc: 'Match your device settings', icon: '💻' },
  { value: 'light', label: 'Light', desc: 'Always use light mode', icon: '☀️' },
  { value: 'dark', label: 'Dark', desc: 'Always use dark mode', icon: '🌙' },
]

export default function PlayerSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [theme, setTheme] = useState('system')

  const load = useCallback(async () => {
    const res = await fetch('/api/user')
    if (!res.ok) { router.push('/dashboard'); return }
    const data = await res.json()
    setUser(data)
    setName(data.name ?? '')
    setTheme(data.theme ?? 'system')
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaved(false)
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), theme }),
    })
    setSaving(false)
    if (res.ok) {
      applyTheme(theme)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (loading || !user) {
    return <main className="flex min-h-screen items-center justify-center"><p className="text-[14px] text-gray-400">Loading…</p></main>
  }

  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[80px] pt-[20px]">
      <Link href="/dashboard"
        className="mb-[20px] inline-flex items-center gap-[4px] text-[13px] font-medium text-gray-400 transition-colors hover:text-gray-600"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Dashboard
      </Link>

      <h1 className="mb-[24px] text-[22px] font-bold tracking-tight text-gray-900">Settings</h1>

      <form onSubmit={save} className="space-y-[24px]">
        {/* Profile */}
        <section className="rounded-2xl border border-gray-100 bg-white p-[20px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="mb-[16px] text-[15px] font-semibold text-gray-900">Profile</h2>
          <div className="flex items-center gap-[16px] mb-[16px]">
            {user.image ? (
              <img src={user.image} alt="" className="h-[48px] w-[48px] rounded-full object-cover" />
            ) : (
              <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-gray-100 text-[18px] font-bold text-gray-500">
                {(user.name ?? user.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-gray-900">{user.name ?? 'Unnamed'}</p>
              <p className="text-[12px] text-gray-400">{user.email}</p>
            </div>
          </div>
          <label className="mb-[6px] block text-[12px] font-medium text-gray-500">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-[14px] py-[10px] text-[14px] text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            required
          />
        </section>

        {/* Theme */}
        <section className="rounded-2xl border border-gray-100 bg-white p-[20px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="mb-[16px] text-[15px] font-semibold text-gray-900">Appearance</h2>
          <div className="grid grid-cols-3 gap-[8px]">
            {themes.map((t) => (
              <button key={t.value} type="button" onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-[6px] rounded-xl px-[12px] py-[14px] text-center transition-all ${
                  theme === t.value
                    ? 'bg-primary/[0.08] ring-2 ring-primary/30'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="text-[24px]">{t.icon}</span>
                <span className={`text-[13px] font-medium ${theme === t.value ? 'text-primary' : 'text-gray-700'}`}>{t.label}</span>
                <span className="text-[10px] text-gray-400">{t.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Save */}
        <div className="sticky bottom-0 border-t border-gray-100 bg-[#F7F8FA]/90 py-[16px] backdrop-blur-md">
          <button type="submit" disabled={saving}
            className="w-full rounded-xl bg-primary py-[14px] text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </form>
    </main>
  )
}

function applyTheme(theme: string) {
  const html = document.documentElement
  html.classList.remove('dark')
  if (theme === 'dark') {
    html.classList.add('dark')
  } else if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      html.classList.add('dark')
    }
  }
}
