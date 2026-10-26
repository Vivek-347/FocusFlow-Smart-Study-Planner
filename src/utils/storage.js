const PREFIX = 'focusflow_v1_'

export function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(PREFIX + key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.error('Unable to save FocusFlow data:', error)
  }
}

export function clearFocusFlowStorage() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(PREFIX))
    .forEach((key) => localStorage.removeItem(key))
}