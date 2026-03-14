'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Home, BarChart3, Settings } from 'lucide-react'

const tabs = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/standings', label: 'Standings', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomTabBar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session || pathname === '/') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t md:hidden glass-surface" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--glass-nav-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="safe-bottom-bar flex items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-[2px] transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-[var(--text-tertiary)]'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
