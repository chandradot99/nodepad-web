interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function Input({ label, ...props }: InputProps) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1.5">{label}</label>
      <input className="input w-full px-3 py-2 text-sm" {...props} />
    </div>
  )
}
