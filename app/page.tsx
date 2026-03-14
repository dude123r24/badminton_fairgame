import { getSession } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import SignInButton from '@/components/SignInButton'

export default async function LandingPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-[24px] py-[32px]" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm text-center">
        <div className="mb-[8px] text-[56px]">🏸</div>
        <h1 className="mb-[8px] text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          FairGame
        </h1>
        <p className="mb-[32px] text-base" style={{ color: 'var(--text-secondary)' }}>
          Smart badminton club management.<br />Fair courts. Fair games.
        </p>

        <SignInButton />

        <ul className="mt-[32px] space-y-[12px] text-left">
          {[
            ['⚖️', 'Smart pairing', 'Balance skill levels automatically across every court'],
            ['🏆', 'Live sessions', 'Run games, enter scores, track ratings in real time'],
            ['📊', 'Fair play', 'ELO ratings ensure every player gets competitive games'],
          ].map(([icon, title, desc]) => (
            <li key={title} className="card flex items-start gap-[12px] p-[14px]">
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
