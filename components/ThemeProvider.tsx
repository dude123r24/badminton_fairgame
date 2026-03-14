'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

const THEME_CLASSES = ['dark', 'google-glass', 'apple-glass'] as const

export function applyTheme(theme: string) {
  const html = document.documentElement
  THEME_CLASSES.forEach((cls) => html.classList.remove(cls))

  switch (theme) {
    case 'dark':
      html.classList.add('dark')
      break
    case 'google-glass':
      html.classList.add('google-glass')
      break
    case 'apple-glass':
      html.classList.add('apple-glass')
      break
    case 'system':
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.classList.add('dark')
      }
      break
    // 'light' = default (no class needed)
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    async function loadTheme() {
      try {
        const res = await fetch('/api/user')
        if (!res.ok) return
        const data = await res.json()
        applyTheme(data.theme ?? 'system')
      } catch {
        // silently fail
      }
    }
    loadTheme()
  }, [session?.user])

  return <>{children}</>
}
