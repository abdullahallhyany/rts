/**
 * @param {Object} props
 * @param {string} props.children - The status/result value
 */
export function Badge({ children }) {
  // Color mapping based on the value
  const getColorClass = (value) => {
    const lowerValue = value.toLowerCase()
    
    if (lowerValue === 'in progress') {
      return 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
    }
    if (lowerValue === 'passed') {
      return 'bg-green-100 text-green-700 ring-1 ring-green-200'
    }
    if (lowerValue === 'failed') {
      return 'bg-red-100 text-red-700 ring-1 ring-red-200'
    }
    if (lowerValue === 'queued') {
      return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
    }
    // Default for other values
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
  }
  
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${getColorClass(children)}`}>
      {children}
    </span>
  )
}
