import { useTestStore } from '../stores/useTestStore.js'

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useTestStore()

  return (
    <div className="relative">
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="h-10 w-80 rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none ring-0 focus:border-slate-300 focus:ring-1 focus:ring-slate-300"
        placeholder="Search by name"
      />
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
      >
        <path
          fillRule="evenodd"
          d="M8.5 3a5.5 5.5 0 104.387 8.9l3.606 3.607a1 1 0 001.414-1.414l-3.607-3.606A5.5 5.5 0 008.5 3zm-3.5 5.5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  )
}
