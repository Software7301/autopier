'use client'

interface FilterOption {
  value: string
  label: string
}

interface FilterPillsProps {
  options: FilterOption[]
  selected: string
  onChange: (value: string) => void
}

export default function FilterPills({ options, selected, onChange }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`filter-pill ${
            selected === option.value
              ? 'filter-pill-active'
              : 'filter-pill-inactive'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

