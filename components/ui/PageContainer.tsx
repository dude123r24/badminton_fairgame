interface PageContainerProps {
  children: React.ReactNode
  size?: 'narrow' | 'default' | 'wide'
  className?: string
}

const maxWidths = {
  narrow: 'max-w-[640px]',
  default: 'max-w-[768px]',
  wide: 'max-w-[960px]',
}

export default function PageContainer({ children, size = 'default', className = '' }: PageContainerProps) {
  return (
    <main className={`mx-auto ${maxWidths[size]} px-[16px] pb-[120px] pt-[16px] sm:px-[24px] sm:pt-[24px] ${className}`}>
      {children}
    </main>
  )
}
