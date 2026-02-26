import { useState, useEffect, useRef } from 'react'
import { useTestStore } from './stores/useTestStore.js'
import { useSortedFilteredTests } from './stores/useTestTableStore.js'
import {
  Navigation,
  SearchBar,
  NewTestButton,
  TestTable,
  NewTestModal
} from './components/index.js'

const PERSIST_DEBOUNCE_MS = 500

function App() {
  const addTest = useTestStore((s) => s.addTest)
  const updateTest = useTestStore((s) => s.updateTest)
  const tests = useSortedFilteredTests()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const persistTimerRef = useRef(null)

  // Load persisted tests on mount
  useEffect(() => {
    const ipc = window.electron?.ipcRenderer
    if (!ipc?.invoke) return
    ipc.invoke('get-persisted-tests').then((saved) => {
      if (Array.isArray(saved) && saved.length > 0) {
        useTestStore.getState().setTests(saved)
      }
    })
  }, [])

  // Persist tests when they change (debounced)
  useEffect(() => {
    const ipc = window.electron?.ipcRenderer
    if (!ipc?.invoke) return
    const unsub = useTestStore.subscribe((state) => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
      persistTimerRef.current = setTimeout(() => {
        ipc.invoke('save-tests', state.tests)
        persistTimerRef.current = null
      }, PERSIST_DEBOUNCE_MS)
    })
    return () => {
      unsub()
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const ipc = window.electron?.ipcRenderer
    if (!ipc) {
      console.warn('[App] ipcRenderer not available')
      return
    }
    const onStarted = (_event, { id }) => {
      console.log('[App] test-started', id)
      updateTest(id, { status: 'In Progress' })
    }
    const onFinished = (_event, { id, status, completedAt }) => {
      console.log('[App] test-finished', id, status)
      updateTest(id, { status, completedAt })
    }
    ipc.on('test-started', onStarted)
    ipc.on('test-finished', onFinished)
    return () => {
      ipc.removeListener('test-started', onStarted)
      ipc.removeListener('test-finished', onFinished)
    }
  }, [updateTest])

  const handleNewTest = () => {
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleModalSubmit = async (data) => {
    const id = Date.now().toString()
    const name = data.fileName ?? 'Unnamed'
    const type = data.selectedTest ?? '—'
    const filePath = data.filePath
    addTest({
      id,
      name,
      type,
      status: 'Queued',
      startedAt: undefined,
      completedAt: undefined
    })
    if (filePath && window.electron?.ipcRenderer?.invoke) {
      console.log('[App] enqueue', { id, type, filePath })
      await window.electron.ipcRenderer.invoke('test-queue-enqueue', { id, type, filePath })
    } else {
      console.warn('[App] No file path; test will stay Queued')
    }
  }

  const handleDownload = (testId) => {
    console.log('Download clicked for test:', testId)
  }

  const handleRunLs = () => {
    if (!window.electron || !window.electron.ipcRenderer) {
      console.warn('ipcRenderer not available')
      return
    }

    // Listen once for the result
    window.electron.ipcRenderer.once('ls-result', (_event, output) => {
      console.log('ls output:', output)
      alert(output)
    })

    // Send command to main process; '.' means current working directory of the app
    window.electron.ipcRenderer.send('run-ls', '.')
  }

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <Navigation />

      <div className="px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <SearchBar />
              <div className="flex items-center gap-2">
                
                <NewTestButton onClick={handleNewTest} />
              </div>
            </div>
          </div>

          {/* Table */}
          <TestTable tests={tests} onDownload={handleDownload} />
        </div>
      </div>

      {/* Modal */}
      <NewTestModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    </div>
  )
}

export default App
