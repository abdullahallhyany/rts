/**
 * @param {Object} props
 * @param {function(): void} props.onClick
 */
import PropTypes from 'prop-types'

export function NewTestButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10 3a1 1 0 011 1v5h5a1 1 0 010 2h-5v5a1 1 0 01-2 0v-5H4a1 1 0 010-2h5V4a1 1 0 011-1z" />
      </svg>
      New Test
    </button>
  )
}

NewTestButton.propTypes = {
  onClick: PropTypes.func.isRequired
}
