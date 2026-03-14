'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { applyTheme } from '@/components/ThemeProvider'

interface UserData {
  id: string
  name: string | null
  email: string
  image: string | null
  theme: string
}

const themes = [
  { value: 'system', label: 'System', desc: 'Match device', icon: '💻' },
  { value: 'light', label: 'Light', desc: 'Clean white', icon: '☀️' },
  { value: 'dark', label: 'Dark', desc: 'Easy on eyes', icon: '🌙' },
  { value: 'google-glass', label: 'Material', desc: 'Frosted warm', icon: '🟣', preview: 'google' },
  { value: 'apple-glass', label: 'Apple', desc: 'Frosted cool', icon: '🔵', preview: 'apple' },
]

function ThemePreview({ theme }: { theme: string }) {
  if (theme === 'google') {
    return (
      <div className="mx-auto mb-[6px] h-[36px] w-[48px] overflow-hidden rounded-lg" style={{
        background: 'linear-gradient(135deg, #E8DEF8, #FCE4EC, #FFF3E0)',
      }}>
        <div className="mx-[4px] mt-[6px] h-[10px] rounded-[4px]" style={{
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(4px)',
        }} />
        <div className="mx-[4px] mt-[3px] h-[10px] rounded-[4px]" style={{
          background: 'rgba(255,255,255,0.4)',
        }} />
      </div>
    )
  }
  if (theme === 'apple') {
    return (
      <div className="mx-auto mb-[6px] h-[36px] w-[48px] overflow-hidden rounded-lg" style={{
        background: 'linear-gradient(160deg, #1a1a2e, #0f3460)',
      }}>
        <div className="mx-[4px] mt-[6px] h-[10px] rounded-[4px]" style={{
          background: 'rgba(255,255,255,0.08)',
          border: '0.5px solid rgba(255,255,255,0.1)',
        }} />
        <div className="mx-[4px] mt-[3px] h-[10px] rounded-[4px]" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '0.5px solid rgba(255,255,255,0.06)',
        }} />
      </div>
    )
  }
  return null
}

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

  function handleThemeSelect(value: string) {
    setTheme(value)
    applyTheme(value)
  }

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
    return <main className="flex min-h-screen items-center justify-center"><p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</p></main>
  }

  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[100px] pt-[16px] sm:px-[24px] sm:pt-[20px]">
      <Link href="/dashboard"
        className="mb-[16px] inline-flex min-h-[44px] items-center gap-[6px] text-sm font-medium transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Dashboard
      </Link>

      <h1 className="mb-[24px] text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h1>

      <form onSubmit={save} className="space-y-[20px]">
        <section className="card p-[20px]">
          <h2 className="mb-[16px] text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Profile</h2>
          <div className="mb-[16px] flex items-center gap-[16px]">
            {user.image ? (
              <img src={user.image} alt={`${user.name ?? 'User'} avatar`} className="h-[48px] w-[48px] rounded-full object-cover" />
            ) : (
              <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full text-lg font-bold"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                {(user.name ?? user.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.name ?? 'Unnamed'}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
            </div>
          </div>
          <label className="mb-[6px] block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border px-[14px] py-[12px] text-[16px] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
            style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
            required
          />
        </section>

        <section className="card p-[20px]">
          <h2 className="mb-[16px] text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
          <div className="grid grid-cols-3 gap-[8px] sm:grid-cols-5" role="radiogroup" aria-label="Theme">
            {themes.map((t) => (
              <button key={t.value} type="button" onClick={() => handleThemeSelect(t.value)}
                role="radio" aria-checked={theme === t.value}
                className={`flex min-h-[90px] flex-col items-center justify-center gap-[2px] rounded-xl px-[8px] py-[10px] text-center transition-all ${
                  theme === t.value
                    ? 'ring-2 ring-primary/40'
                    : ''
                }`}
                style={{
                  backgroundColor: theme === t.value
                    ? 'rgba(22, 163, 74, 0.08)'
                    : 'var(--bg-hover)',
                }}
              >
                {t.preview ? (
                  <ThemePreview theme={t.preview} />
                ) : (
                  <span className="mb-[4px] text-[22px]">{t.icon}</span>
                )}
                <span className={`text-xs font-semibold ${theme === t.value ? 'text-primary' : ''}`}
                  style={theme !== t.value ? { color: 'var(--text-primary)' } : undefined}>{t.label}</span>
                <span className="text-[10px] leading-tight" style={{ color: 'var(--text-tertiary)' }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="sticky bottom-0 border-t py-[16px]" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-app)' }}>
          <button type="submit" disabled={saving}
            className="w-full rounded-xl bg-primary py-[14px] text-sm font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </form>
    </main>
  )
}
