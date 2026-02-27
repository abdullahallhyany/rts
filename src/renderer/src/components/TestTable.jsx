import PropTypes from 'prop-types'
import { Badge } from './Badge.jsx'
import { IconButton } from './IconButton.jsx'
import { useTestTableStore } from '../stores/useTestTableStore.js'

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'startedAt', label: 'Started At' },
  { key: 'completedAt', label: 'Completed At' },
  { key: '', label: '' }
]

/**
 * @param {Object} props
 * @param {Array} props.tests
 * @param {function(string): void} props.onDownload
 * @param {function(string): void} props.onDelete
 */
export function TestTable({ tests, onDownload, onDelete }) {
  const { sortBy, sortOrder, setSort } = useTestTableStore()

  function SortIcon({ columnKey }) {
    if (!columnKey || columnKey === 'status') return null
    const active = sortBy === columnKey
    return (
      <span className={active ? 'text-slate-600' : 'text-slate-400'}>
        {active && sortOrder === 'asc' ? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M7 8l3 3 3-3H7z" />
          </svg>
        ) : active && sortOrder === 'desc' ? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M7 12l3-3 3 3H7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M7 8l3-3 3 3H7zm0 4l3 3 3-3H7z" />
          </svg>
        )}
      </span>
    )
  }

  // propTypes for SortIcon (defined inside so the identifier is in scope)
  SortIcon.propTypes = {
    columnKey: PropTypes.string
  }

  function KebabMenu() {
    return (
      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-50">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {COLUMNS.map(({ key, label }) => (
              <th
                key={key || label}
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                <div className="inline-flex items-center gap-1">
                  {key ? (
                    <button
                      type="button"
                      onClick={() => setSort(key)}
                      className="inline-flex items-center gap-1 rounded hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300"
                    >
                      <span>{label}</span>
                      <SortIcon columnKey={key} />
                    </button>
                  ) : (
                    <span>{label}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {tests.map((test) => (
            <tr key={test.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                {test.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {test.type ?? '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge>{test.status}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {test.startedAt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {test.completedAt || ''}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  {(test.status === 'Passed' || test.status === 'Failed') && (
                    <IconButton title="Download" onClick={() => onDownload(test.id)}>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M10 12l3-3H11V3H9v6H7l3 3zm-5 2h10v2H5v-2z" />
                      </svg>
                    </IconButton>
                  )}
                  <IconButton title="Delete" onClick={() => onDelete(test.id)}>
                    {/* use kebab icon for delete as requested */}
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
                    </svg>
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

TestTable.propTypes = {
  tests: PropTypes.array.isRequired,
  onDownload: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
}
