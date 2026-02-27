import { create } from 'zustand'

/**
 * @typedef {Object} TestResult
 * @property {string} id
 * @property {string} name
 * @property {string} type - Test type chosen from modal (e.g. 'Pract Rand', 'NIST STS')
 * @property {string} status - 'In Progress', 'Passed', 'Failed', 'Queued'
 * @property {string} startedAt
 * @property {string} [completedAt]
 */

/**
 * @typedef {Object} AppState
 * @property {TestResult[]} tests
 * @property {string} searchQuery
 * @property {boolean} isLoading
 */

/**
 * @typedef {Object} TestStore
 * @property {TestResult[]} tests
 * @property {string} searchQuery
 * @property {boolean} isLoading
 * @property {function(string): void} setSearchQuery
 * @property {function(Partial<TestResult>): void} addTest
 * @property {function(string, Partial<TestResult>): void} updateTest
 * @property {function(string): void} deleteTest
 * @property {function(boolean): void} setLoading
 */

function formatStartedAt(date) {
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const useTestStore = create((set) => ({
  // Initial state
  tests: [],
  searchQuery: '',
  isLoading: false,

  // Actions
  setSearchQuery: (query) => set({ searchQuery: query }),

  addTest: (test) => {
    const id = test.id ?? Date.now().toString()
    const newTest = {
      ...test,
      id,
      startedAt: test.startedAt ?? formatStartedAt(new Date())
    }
    set((state) => ({ tests: [...state.tests, newTest] }))
  },

  updateTest: (id, updates) => {
    set((state) => ({
      tests: state.tests.map((test) => (test.id === id ? { ...test, ...updates } : test))
    }))
  },

  deleteTest: (id) => {
    set((state) => ({
      tests: state.tests.filter((test) => test.id !== id)
    }))
  },

  setLoading: (loading) => set({ isLoading: loading }),

  /** Hydrate from persisted data (e.g. on app load) */
  setTests: (tests) => set({ tests: Array.isArray(tests) ? tests : [] })
}))

// Selectors
export const useFilteredTests = () => {
  const { tests, searchQuery } = useTestStore()
  return tests.filter(
    (test) =>
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.type && test.type.toLowerCase().includes(searchQuery.toLowerCase()))
  )
}
