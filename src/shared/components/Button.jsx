// variant : "primary" (vert, défaut) | "outline" | "ghost" | "dark"
export default function Button({ variant = 'primary', size, icon: Icon, children, className = '', type = 'button', ...rest }) {
  const cls = ['btn', variant !== 'primary' && `btn-${variant}`, size && `btn-${size}`, className].filter(Boolean).join(' ')
  return (
    <button type={type} className={cls} {...rest}>
      {Icon && <Icon size={16} aria-hidden="true" />}
      {children}
    </button>
  )
}
