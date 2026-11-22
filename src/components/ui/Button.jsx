// Bouton réutilisable. variant : 'primary' | 'secondary' | 'danger' | 'ghost'
// icon : un composant Lucide (ex. icon={Plus})
export default function Button({ variant = 'primary', icon: Icon, type = 'button', className = '', children, ...props }) {
  return (
    <button type={type} className={`btn btn-${variant} ${className}`.trim()} {...props}>
      {Icon && <Icon size={18} aria-hidden="true" />}
      {children}
    </button>
  )
}
