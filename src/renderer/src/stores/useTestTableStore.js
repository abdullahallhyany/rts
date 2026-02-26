import { create } from 'zustand'
import { useMemo } from 'react'
import { useFilteredTests } from './useTestStore.js'

/**
 * Sortable column keys for the tests table.
 * @type {'name' | 'type' | 'status' | 'startedAt' | 'completedAt'}
 */

/**
 * @typedef {'asc' | 'desc'} SortOrder
 */

/**
 * @typedef {Object} TestTableState
 * @property {string} sortBy - Column key to sort by
 * @property {SortOrder} sortOrder
 * @property {Set<string>} selectedIds - Selected test row ids
 * @property {function(string, SortOrder?): void} setSort
 * @property {function(string): void} toggleSelection
 * @property {function(): void} clearSelection
 * @property {function(string): boolean} isSelected
 */

const DEFAULT_SORT = 'startedAt'
const DEFAULT_ORDER = 'desc'

const compare = (a, b, key, order) => {
  const va = a[key] ?? ''
  const vb = b[key] ?? ''
  const mult = order === 'asc' ? 1 : -1
  if (typeof va === 'string' && typeof vb === 'string') {
    return mult * va.localeCompare(vb, undefined, { sensitivity: 'base' })
  }
  return mult * (va < vb ? -1 : va > vb ? 1 : 0)
}

export const useTestTableStore = create((set, get) => ({
  sortBy: DEFAULT_SORT,
  sortOrder: DEFAULT_ORDER,
  selectedIds: new Set(),

  setSort: (sortBy, sortOrder) => {
    set((state) => ({
      sortBy,
      sortOrder:
        sortOrder ?? (state.sortBy === sortBy && state.sortOrder === 'asc' ? 'desc' : 'asc')
    }))
  },

  toggleSelection: (id) => {
    set((state) => {
      const next = new Set(state.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedIds: next }
    })
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  isSelected: (id) => get().selectedIds.has(id)
}))

/**
 * Returns filtered tests from useTestStore, sorted by useTestTableStore sort state.
 */
export function useSortedFilteredTests() {
  const tests = useFilteredTests()
  const { sortBy, sortOrder } = useTestTableStore()
  return useMemo(
    () => [...tests].sort((a, b) => compare(a, b, sortBy, sortOrder)),
    [tests, sortBy, sortOrder]
  )
}
