import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    const baseStyles = 'tap-target rounded-lg font-medium transition-colors'

    const variantStyles = {
      primary: 'bg-primary text-white hover:bg-primary-dark',
      secondary: 'bg-neutral-light text-neutral hover:bg-gray-200',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    }

    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-6 py-3',
      lg: 'px-8 py-4 text-lg',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export default Button
