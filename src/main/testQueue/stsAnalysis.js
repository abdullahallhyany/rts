/**
 * Analyze NIST STS finalAnalysisReport.txt to determine pass/fail.
 *
 * Rules:
 * 1. Skip lines until we find a line containing "Frequency".
 * 2. From that line and the next 4 lines (5 lines total): if any "*" occurs → fail.
 * 3. Otherwise, continue reading the rest of the file and count "*" characters.
 *    If total star count reaches 5 → fail.
 *
 * @param {string} content - Full file content
 * @returns {{ failed: boolean, reason?: string }}
 */
export function analyzeStsReport(content) {
  const lines = content.split(/\r?\n/)

  const frequencyIdx = lines.findIndex((line) => line.includes('Frequency'))
  if (frequencyIdx === -1) {
    return { failed: false }
  }

  // Block 1: line with "Frequency" and the next 4 lines
  const block1End = Math.min(frequencyIdx + 5, lines.length)
  for (let i = frequencyIdx; i < block1End; i++) {
    if (lines[i].includes('*')) {
      return { failed: true, reason: 'Star (*) in Frequency block (first 5 lines)' }
    }
  }

  // Block 2: rest of file, count stars
  const STAR_FAIL_THRESHOLD = 5
  let starCount = 0
  for (let i = block1End; i < lines.length; i++) {
    for (const char of lines[i]) {
      if (char === '*') {
        starCount++
        if (starCount >= STAR_FAIL_THRESHOLD) {
          return { failed: true, reason: `Five or more stars (*) in report (count: ${starCount})` }
        }
      }
    }
  }

  return { failed: false }
}
