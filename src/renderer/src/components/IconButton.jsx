/**
 * @param {Object} props
 * @param {string} props.title
 * @param {React.ReactNode} props.children
 * @param {function(): void} [props.onClick]
 * @param {string} [props.className='']
 */
export function IconButton({ title, children, onClick, className = '' }) {
  return (
    <button 
      title={title} 
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 ${className}`}
    >
      {children}
    </button>
  )
}
