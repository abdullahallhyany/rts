export function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-lg font-semibold text-slate-700">Randomness Testing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              {/* <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.07 32.91 32.91 0 003.256.508 3.5 3.5 0 006.972 0 32.903 32.903 0 003.256-.508.75.75 0 00.515-1.07A11.717 11.717 0 0116 8a6 6 0 00-6-6zM8.05 14.943a33.54 33.54 0 003.9 0 2 2 0 01-3.9 0z" clipRule="evenodd" />
                </svg>
              </button> */}
              {/* <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></div> */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
