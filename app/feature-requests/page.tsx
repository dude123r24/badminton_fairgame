import { getSession } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export default async function FeatureRequestsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Feature Requests</h1>
      <p className="text-neutral">
        Submit and vote on feature requests coming soon...
      </p>
    </main>
  )
}
