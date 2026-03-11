interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

export default function Button({ variant = 'primary', loading, children, className = '', ...props }: ButtonProps) {
  const base = 'px-4 py-2 font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer rounded-md'
  const variants = {
    primary:   'bg-accent text-white hover:bg-accent-hover active:opacity-90',
    secondary: 'bg-surface-raised text-text border border-border hover:border-border-strong',
    danger:    'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? 'Loading...' : children}
    </button>
  )
}
