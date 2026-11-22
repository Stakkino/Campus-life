// Rangée de boutons-filtres. options : [{ value: 'all', label: 'Toutes' }, ...]
export default function FilterTabs({ options, value, onChange }) {
  return (
    <div className="filter-tabs" role="group" aria-label="Filtres">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`filter-tab${option.value === value ? ' is-active' : ''}`}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
