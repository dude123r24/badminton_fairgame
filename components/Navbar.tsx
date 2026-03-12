'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/standings', label: 'Standings' },
  { href: '/feature-requests', label: 'Requests' },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!session || pathname === '/') return null

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-[16px]">
        <div className="flex h-[52px] items-center justify-between md:h-[56px]">
          <div className="flex items-center gap-[24px] md:gap-[32px]">
            <Link href="/dashboard" className="text-[17px] font-bold tracking-tight text-primary md:text-[18px]">
              FairGame
            </Link>
            {/* Desktop nav */}
            <div className="hidden gap-[4px] md:flex">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link key={href} href={href}
                    className={`rounded-lg px-[12px] py-[6px] text-[13px] font-medium transition-colors ${
                      isActive ? 'bg-primary/[0.08] text-primary' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >{label}</Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-[8px]">
            <span className="hidden text-[12px] text-gray-400 lg:block">{session.user.email}</span>
            <Link href="/settings"
              className="hidden rounded-lg px-[10px] py-[6px] text-[12px] font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 md:block"
            >
              Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="hidden rounded-lg px-[10px] py-[6px] text-[12px] font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 md:block"
            >
              Sign out
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-[40px] w-[40px] items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-50 md:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-[16px] py-[8px] md:hidden">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-[12px] py-[10px] text-[14px] font-medium transition-colors ${
                  isActive ? 'bg-primary/[0.08] text-primary' : 'text-gray-600'
                }`}
              >{label}</Link>
            )
          })}
          <div className="mt-[4px] border-t border-gray-100 pt-[8px]">
            <p className="px-[12px] py-[4px] text-[12px] text-gray-400">{session.user.email}</p>
            <Link href="/settings" onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-[12px] py-[10px] text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Settings
            </Link>
            <button onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full rounded-lg px-[12px] py-[10px] text-left text-[14px] font-medium text-gray-500 transition-colors hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
