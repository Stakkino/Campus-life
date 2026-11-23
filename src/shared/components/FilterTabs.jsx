// options : [{ value, label, count? }]
export default function FilterTabs({ value, onChange, options }) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={`tab ${value === o.value ? 'active' : ''}`} onClick={() => onChange(o.value)}>
          {o.label}{o.count !== undefined && <span className="count">· {o.count}</span>}
        </button>
      ))}
    </div>
  )
}
