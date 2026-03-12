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
      className={`group relative flex w-full items-start gap-[10px] rounded-xl border-[1.5px] px-[12px] py-[10px] text-left transition-all duration-150 active:scale-[0.98] sm:flex-col sm:items-stretch sm:gap-0 sm:px-[14px] sm:py-[12px] ${
        selected
          ? 'border-primary bg-primary/[0.04] shadow-[0_0_0_1px_rgba(22,163,74,0.15)]'
          : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-sm'
      } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
    >
      {selected && (
        <span className="absolute right-[8px] top-[8px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[10px] text-white">
          ✓
        </span>
      )}
      <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg bg-gray-50 text-[18px] leading-none group-hover:bg-gray-100 sm:mb-[8px]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-snug text-gray-900">{title}</span>
        <span className="mt-[2px] block text-[11px] leading-snug text-gray-400">
          {description}
        </span>
      </span>
    </button>
  )
}
