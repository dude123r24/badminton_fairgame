'use client'

import { signIn } from 'next-auth/react'

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
      className="tap-target rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary-dark"
    >
      Sign in with Google
    </button>
  )
}
