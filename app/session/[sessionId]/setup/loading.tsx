import Skeleton from '@/components/ui/Skeleton'

export default function SetupLoading() {
  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[140px] pt-[16px] sm:px-[24px]">
      <Skeleton className="mb-[12px] h-[14px] w-[60px]" />

      <div className="mb-[20px]">
        <Skeleton className="mb-[6px] h-[24px] w-[140px]" />
        <Skeleton className="h-[14px] w-[200px]" />
      </div>

      <div className="mb-[20px]">
        <Skeleton className="mb-[8px] h-[14px] w-[100px]" />
        <div className="card overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex items-center gap-[12px] px-[14px] py-[14px] ${i < 5 ? 'border-b' : ''}`} style={{ borderColor: 'var(--border-subtle)' }}>
              <Skeleton variant="rect" className="h-[28px] w-[52px] rounded-full" />
              <div className="flex-1 space-y-[6px]">
                <Skeleton className="h-[14px] w-3/4" />
                <Skeleton className="h-[12px] w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="mb-[8px] h-[14px] w-[60px]" />
        <Skeleton variant="rect" className="h-[48px] rounded-xl" />
      </div>
    </main>
  )
}
