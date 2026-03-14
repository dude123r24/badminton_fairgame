import Skeleton from '@/components/ui/Skeleton'

export default function SessionLoading() {
  return (
    <main className="mx-auto max-w-[960px] px-[16px] pb-[120px] pt-[16px] sm:px-[24px]">
      <Skeleton className="mb-[12px] h-[14px] w-[100px]" />

      <div className="card mb-[16px] flex flex-wrap items-center gap-x-[16px] gap-y-[8px] px-[16px] py-[14px]">
        <div className="flex flex-1 items-center gap-[10px]">
          <Skeleton className="h-[22px] w-[180px]" />
          <Skeleton variant="rect" className="h-[24px] w-[50px] rounded-full" />
        </div>
        <div className="flex gap-[12px]">
          <Skeleton variant="rect" className="h-[14px] w-[40px]" />
          <Skeleton variant="rect" className="h-[14px] w-[40px]" />
          <Skeleton variant="rect" className="h-[14px] w-[40px]" />
        </div>
        <div className="flex gap-[6px]">
          <Skeleton variant="rect" className="h-[44px] w-[44px] rounded-xl" />
          <Skeleton variant="rect" className="h-[44px] w-[44px] rounded-xl" />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-[24px]">
        <div>
          <Skeleton className="mb-[8px] h-[14px] w-[80px]" />
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="card p-[14px]">
                <div className="mb-[8px] flex items-center justify-between">
                  <Skeleton className="h-[14px] w-[40px]" />
                  <Skeleton variant="rect" className="h-[36px] w-[70px] rounded-xl" />
                </div>
                <Skeleton className="h-[16px] w-full" />
              </div>
            ))}
          </div>

          <div className="mt-[20px]">
            <Skeleton className="mb-[8px] h-[14px] w-[60px]" />
            <div className="space-y-[4px]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-[10px] rounded-xl px-[12px] py-[10px]" style={{ backgroundColor: 'var(--bg-card)' }}>
                  <Skeleton variant="circle" className="h-[7px] w-[7px]" />
                  <Skeleton className="h-[14px] flex-1" />
                  <Skeleton className="h-[12px] w-[20px]" />
                  <Skeleton className="h-[12px] w-[24px]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="hidden lg:block">
          <Skeleton className="mb-[8px] h-[14px] w-[60px]" />
          <div className="space-y-[4px]">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rect" className="h-[40px] rounded-xl" />
            ))}
          </div>
        </aside>
      </div>
    </main>
  )
}
