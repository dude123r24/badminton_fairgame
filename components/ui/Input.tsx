import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-[6px] block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border px-[16px] py-[12px] text-[16px] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] ${
            error ? 'border-red-500' : ''
          } ${className}`}
          style={{
            borderColor: error ? undefined : 'var(--border-default)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
          }}
          {...props}
        />
        {error && <p className="mt-[6px] text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
