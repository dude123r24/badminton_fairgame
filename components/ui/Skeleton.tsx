interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circle' | 'rect' | 'card'
}

export default function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  const base = 'skeleton'

  const variants = {
    text: `${base} h-[14px] w-full rounded-md ${className}`,
    circle: `${base} rounded-full ${className}`,
    rect: `${base} rounded-xl ${className}`,
    card: `${base} rounded-2xl ${className}`,
  }

  return <div className={variants[variant]} />
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-[16px] sm:p-[20px] ${className}`}>
      <div className="flex items-center gap-[12px]">
        <Skeleton variant="circle" className="h-[40px] w-[40px]" />
        <div className="flex-1 space-y-[8px]">
          <Skeleton className="h-[16px] w-3/4" />
          <Skeleton className="h-[12px] w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-[12px] ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
