/**
 * Determine pass/fail from crushing test stdout (Small Crush summary at the end).
 *
 * Passed: contains "All tests were passed" in the summary.
 * Failed: contains "The following tests gave p-values outside [0.001, 0.9990]:" and the p-value table.
 *
 * @param {string} output - Full stdout from the crushing test
 * @returns {boolean} true = passed, false = failed (or unable to determine)
 */
export function smallCrushPassFail(output) {
  if (!output || typeof output !== 'string') return false
  const text = output
  if (text.includes('All tests were passed')) return true
  if (text.includes('The following tests gave p-values outside [0.001, 0.9990]:')) return false
  return false
}
