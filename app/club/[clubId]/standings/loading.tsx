import Skeleton from '@/components/ui/Skeleton'

export default function StandingsLoading() {
  return (
    <main className="mx-auto max-w-[768px] px-[16px] pb-[120px] pt-[16px] sm:px-[24px]">
      <Skeleton className="mb-[12px] h-[14px] w-[80px]" />
      <Skeleton className="mb-[24px] h-[28px] w-[160px]" />

      {/* Podium skeleton */}
      <div className="mb-[24px] flex items-end justify-center gap-[12px]">
        <div className="flex flex-col items-center">
          <Skeleton variant="circle" className="mb-[8px] h-[48px] w-[48px]" />
          <Skeleton variant="rect" className="h-[60px] w-[80px] rounded-xl" />
        </div>
        <div className="flex flex-col items-center">
          <Skeleton variant="circle" className="mb-[8px] h-[56px] w-[56px]" />
          <Skeleton variant="rect" className="h-[80px] w-[80px] rounded-xl" />
        </div>
        <div className="flex flex-col items-center">
          <Skeleton variant="circle" className="mb-[8px] h-[44px] w-[44px]" />
          <Skeleton variant="rect" className="h-[48px] w-[80px] rounded-xl" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="card overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`flex items-center gap-[12px] px-[16px] py-[14px] ${i < 6 ? 'border-b' : ''}`} style={{ borderColor: 'var(--border-subtle)' }}>
            <Skeleton className="h-[16px] w-[24px]" />
            <Skeleton variant="circle" className="h-[32px] w-[32px]" />
            <Skeleton className="h-[16px] flex-1" />
            <Skeleton className="h-[14px] w-[40px]" />
            <Skeleton className="h-[14px] w-[40px]" />
          </div>
        ))}
      </div>
    </main>
  )
}
