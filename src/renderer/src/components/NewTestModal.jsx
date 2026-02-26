import { useState } from 'react'
import { createPortal } from 'react-dom'
import uploadIcon from '../assets/upload.svg'

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function(): void} props.onClose
 * @param {function(Object): void | Promise<void>} props.onSubmit
 */
const TEST_OPTIONS = [
  { name: 'Pract Rand', minSize: '1 GB', recommended: '1 TB' },
  { name: 'NIST STS', minSize: '1 GB', recommended: '1 TB' },
  { name: 'Die Harder', minSize: '1 GB', recommended: '1 TB' },
  { name: 'Ent', minSize: '1 GB', recommended: '1 TB' },
  { name: 'Rabbit', minSize: '1 GB', recommended: '1 TB' },
  { name: 'Alpha', minSize: '1 GB', recommended: '1 TB' },
  { name: 'Big Crush', minSize: '1 GB', recommended: '1 TB' },
  { name: 'Crush', minSize: '1 GB', recommended: '1 TB' },
  { name: 'Small Crush', minSize: '1 GB', recommended: '1 TB' }
]

function fileNameFromPath(path) {
  if (!path) return ''
  const sep = path.includes('\\') ? '\\' : '/'
  return path.split(sep).pop() ?? path
}

export function NewTestModal({ isOpen, onClose, onSubmit }) {
  const [selectedTest, setSelectedTest] = useState('Pract Rand')
  const [selectedFilePath, setSelectedFilePath] = useState(/** @type {string | null} */ (null))
  const [selectedFileName, setSelectedFileName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBrowse = async () => {
    const path = await window.electron?.ipcRenderer?.invoke?.('dialog-open-file')
    if (path) {
      setSelectedFilePath(path)
      setSelectedFileName(fileNameFromPath(path))
    }
  }

  const handleSubmit = async () => {
    if (!selectedFilePath) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        fileName: selectedFileName,
        filePath: selectedFilePath,
        selectedTest
      })
      setSelectedFilePath(null)
      setSelectedFileName('')
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedFilePath(null)
    setSelectedFileName('')
    onClose()
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed select-none inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - Semi-transparent grey overlay */}
      <div
        className="absolute inset-0 bg-gray-950 opacity-15"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create a new test job</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* File selection via OS dialog (path only, no read in JS) */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center border-slate-300">
            <div className="flex items-center justify-center space-x-4">
              <img
                src={uploadIcon}
                alt="Upload"
                className="w-16 h-20 text-blue-500"
              />
              <div className="text-left">
                {selectedFilePath ? (
                  <p className="text-slate-700 font-medium">
                    <span className="text-green-600">{selectedFileName}</span>
                  </p>
                ) : (
                  <p className="text-slate-700 font-medium">Select a file (path is used, file is not read)</p>
                )}
                <button
                  type="button"
                  onClick={handleBrowse}
                  className="text-blue-600 underline hover:text-blue-700 mt-1"
                >
                  {selectedFilePath ? 'Choose a different file' : 'Browse Files'}
                </button>
              </div>
            </div>
          </div>

          {/* Test Selection - single choice */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Choose test type</h3>
            <div className="space-y-3" role="radiogroup" aria-label="Test type">
              {TEST_OPTIONS.map((test) => (
                <label
                  key={test.name}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedTest === test.name
                      ? 'border-green-200 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="test-type"
                      value={test.name}
                      checked={selectedTest === test.name}
                      onChange={() => setSelectedTest(test.name)}
                      className="h-4 w-4 border-slate-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="font-medium text-slate-900">{test.name}</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    <span>Min - {test.minSize}</span>
                    <span className="mx-2">•</span>
                    <span>Recommended {test.recommended}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFilePath || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting…' : 'Submit File'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
