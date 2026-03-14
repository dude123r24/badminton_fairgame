'use client'

interface OptionCardProps {
  selected: boolean
  onClick: () => void
  icon: string
  title: string
  description: string
  disabled?: boolean
}

export default function OptionCard({
  selected,
  onClick,
  icon,
  title,
  description,
  disabled = false,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex w-full items-start gap-[12px] rounded-2xl border-[1.5px] px-[14px] py-[14px] text-left transition-all duration-150 active:scale-[0.98] sm:flex-col sm:items-stretch sm:gap-0 sm:px-[16px] sm:py-[14px] ${
        selected
          ? 'border-primary bg-primary/[0.04] shadow-[0_0_0_1px_rgba(22,163,74,0.15)]'
          : 'hover:shadow-sm'
      } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
      style={{
        borderColor: selected ? undefined : 'var(--border-default)',
        backgroundColor: selected ? undefined : 'var(--bg-card)',
      }}
    >
      {selected && (
        <span className="absolute right-[10px] top-[10px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-primary text-xs text-white">
          ✓
        </span>
      )}
      <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-xl text-[20px] leading-none sm:mb-[8px]" style={{ backgroundColor: 'var(--bg-hover)' }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <span className="mt-[3px] block text-xs leading-snug" style={{ color: 'var(--text-tertiary)' }}>
          {description}
        </span>
      </span>
    </button>
  )
}
