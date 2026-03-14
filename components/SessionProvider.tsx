'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'
import { ReactNode } from 'react'

export default function SessionProvider({
  children,
  session,
}: {
  children: ReactNode
  session?: Session | null
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  )
}
