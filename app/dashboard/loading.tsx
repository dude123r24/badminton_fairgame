import Skeleton from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[120px] pt-[24px] sm:px-[24px]">
      <div className="mb-[24px]">
        <Skeleton className="mb-[8px] h-[14px] w-[160px]" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-[28px] w-[120px]" />
          <Skeleton variant="rect" className="h-[44px] w-[110px]" />
        </div>
      </div>
      <div className="space-y-[12px]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-[16px]">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-[8px]">
                <div className="flex items-center gap-[8px]">
                  <Skeleton className="h-[18px] w-[140px]" />
                  <Skeleton variant="rect" className="h-[20px] w-[50px] rounded-full" />
                </div>
                <div className="flex items-center gap-[12px]">
                  <Skeleton className="h-[14px] w-[80px]" />
                  <Skeleton className="h-[14px] w-[60px]" />
                </div>
              </div>
              <Skeleton variant="rect" className="h-[16px] w-[16px]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
