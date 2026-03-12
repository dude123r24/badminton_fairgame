'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

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
