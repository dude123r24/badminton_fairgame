import { getSession } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export default async function StandingsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Standings</h1>
      <p className="text-neutral">Player and pair leaderboards coming soon...</p>
    </main>
  )
}
