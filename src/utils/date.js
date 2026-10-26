export function todayISO() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export function daysUntil(dateString) {
  if (!dateString) return null
  const target = new Date(`${dateString}T00:00:00`)
  const today = new Date(`${todayISO()}T00:00:00`)
  return Math.ceil((target - today) / 86400000)
}

export function formatDate(dateString) {
  if (!dateString) return 'No date'
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}