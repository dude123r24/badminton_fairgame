'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, MessageSquarePlus, Settings, LogOut } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/standings', label: 'Standings', icon: BarChart3 },
  { href: '/feature-requests', label: 'Requests', icon: MessageSquarePlus },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session || pathname === '/') return null

  return (
    <nav className="sticky top-0 z-40 hidden border-b md:block glass-surface" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--glass-nav-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="mx-auto max-w-7xl px-[16px] sm:px-[24px]">
        <div className="flex h-[56px] items-center justify-between">
          <div className="flex items-center gap-[32px]">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight text-primary">
              FairGame
            </Link>
            <div className="flex gap-[4px]">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-[6px] rounded-xl px-[14px] py-[8px] text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/[0.08] text-primary'
                        : 'hover:bg-[var(--bg-hover)]'
                    }`}
                    style={{ color: isActive ? undefined : 'var(--text-secondary)' }}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-[8px]">
            <span className="hidden text-xs lg:block" style={{ color: 'var(--text-tertiary)' }}>{session.user.email}</span>
            <Link href="/settings"
              className="flex items-center gap-[4px] rounded-xl px-[12px] py-[8px] text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <Settings size={14} />
              Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-[4px] rounded-xl px-[12px] py-[8px] text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
