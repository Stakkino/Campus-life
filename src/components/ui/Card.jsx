// Conteneur blanc, coins arrondis, ombre discrète. Base de tous les blocs de l'interface.
export default function Card({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`card ${className}`.trim()} {...props}>
      {children}
    </Tag>
  )
}
