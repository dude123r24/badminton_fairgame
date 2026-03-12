import { getSession } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import SignInButton from '@/components/SignInButton'

export default async function LandingPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-light px-4 py-8">
      <div className="w-full max-w-sm text-center">
        <div className="mb-2 text-5xl">🏸</div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">
          FairGame
        </h1>
        <p className="mb-8 text-base text-neutral">
          Smart badminton club management.<br />Fair courts. Fair games.
        </p>

        <SignInButton />

        <ul className="mt-8 space-y-3 text-left">
          {[
            ['⚖️', 'Smart pairing', 'Balance skill levels automatically across every court'],
            ['🏆', 'Live sessions', 'Run games, enter scores, track ratings in real time'],
            ['📊', 'Fair play', 'ELO ratings ensure every player gets competitive games'],
          ].map(([icon, title, desc]) => (
            <li key={title} className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm">
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-neutral">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
