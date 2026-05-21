export function toDateTimeInputValue(value) {
  const date = new Date(value)
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

export function toDateInputValue(value) {
  return value.slice(0, 10)
}

export function toTimeInputValue(value) {
  return value.slice(11, 16)
}

export function getCurrentDateTimeParts() {
  const nowValue = toDateTimeInputValue(new Date().toISOString())

  return {
    date: toDateInputValue(nowValue),
    time: toTimeInputValue(nowValue),
  }
}

export function combineDateAndTime(date, time) {
  return `${date}T${time || '00:00'}`
}

export function toStoredDateTime(value) {
  return new Date(value).toISOString()
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}
