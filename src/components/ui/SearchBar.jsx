import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <label className="search-bar">
      <Search size={18} aria-hidden="true" />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
