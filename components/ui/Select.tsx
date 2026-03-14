import { forwardRef, SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-[6px] block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full rounded-xl border px-[16px] py-[12px] text-[16px] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] ${
            error
              ? 'border-red-500 focus:ring-red-500/20'
              : ''
          } ${className}`}
          style={{
            borderColor: error ? undefined : 'var(--border-default)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-[6px] text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
