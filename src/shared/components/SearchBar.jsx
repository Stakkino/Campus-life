import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Rechercher…' }) {
  return (
    <div className="search">
      <Search size={16} aria-hidden="true" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  )
}
