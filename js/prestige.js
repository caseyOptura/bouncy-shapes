export function checkPrestige(score) {
  if (score === 0 || score % 5 !== 0) return null
  return Math.min(Math.floor(score / 5), 5)
}
