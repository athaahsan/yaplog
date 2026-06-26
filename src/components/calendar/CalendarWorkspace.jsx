import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  NotebookPen,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const compactWeekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const hourOptions = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0'),
)
const minuteOptions = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, '0'),
)

const emptyEventDraft = {
  allDay: true,
  date: '',
  description: '',
  id: '',
  time: '',
  title: '',
}

function CalendarWorkspace({ entries, events, onEventsChange, taskItems }) {
  const todayKey = getTodayDateKey()
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)
  const [displayDate, setDisplayDate] = useState(() => new Date())
  const [eventEditor, setEventEditor] = useState(null)
  const monthLabel = formatMonthLabel(displayDate)
  const monthDays = useMemo(() => getCalendarMonthDays(displayDate), [displayDate])
  const journalEntriesByDate = useMemo(() => groupEntriesByDate(entries), [entries])
  const tasksByDate = useMemo(() => groupTasksByDueDate(taskItems), [taskItems])
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events])
  const selectedDateState = {
    dateKey: selectedDateKey,
    events: eventsByDate.get(selectedDateKey) || [],
    journals: journalEntriesByDate.get(selectedDateKey) || [],
    tasks: tasksByDate.get(selectedDateKey) || [],
  }

  function goToPreviousMonth() {
    setDisplayDate(
      (currentDate) =>
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    )
  }

  function goToNextMonth() {
    setDisplayDate(
      (currentDate) =>
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    )
  }

  function goToToday() {
    const today = new Date()
    setDisplayDate(today)
    setSelectedDateKey(todayKey)
  }

  function selectDate(dateKey) {
    setSelectedDateKey(dateKey)
  }

  function openNewEvent(dateKey = selectedDateKey || todayKey) {
    setEventEditor({
      draft: {
        ...emptyEventDraft,
        date: dateKey,
      },
      mode: 'new',
    })
  }

  function openExistingEvent(event) {
    setEventEditor({
      draft: {
        allDay: Boolean(event.allDay),
        date: event.date || selectedDateKey || todayKey,
        description: event.description || '',
        id: event.id,
        time: event.time || '',
        title: event.title || '',
      },
      mode: 'edit',
    })
  }

  function updateEventDraft(updates) {
    setEventEditor((currentState) =>
      currentState
        ? {
            ...currentState,
            draft: { ...currentState.draft, ...updates },
          }
        : currentState,
    )
  }

  function saveEventDraft() {
    if (!eventEditor) {
      return
    }

    const now = new Date().toISOString()
    const draft = {
      allDay: eventEditor.draft.allDay,
      date: eventEditor.draft.date || selectedDateKey || todayKey,
      description: eventEditor.draft.description,
      time: eventEditor.draft.allDay ? '' : eventEditor.draft.time,
      title: eventEditor.draft.title,
    }

    if (eventEditor.mode === 'new') {
      const event = {
        ...draft,
        createdAt: now,
        id: createEventId(),
        updatedAt: now,
      }

      onEventsChange((currentEvents) => [event, ...currentEvents])
      setSelectedDateKey(event.date)
      setDisplayDate(new Date(`${event.date}T00:00:00`))
    } else {
      onEventsChange((currentEvents) =>
        currentEvents.map((event) =>
          event.id === eventEditor.draft.id
            ? { ...event, ...draft, updatedAt: now }
            : event,
        ),
      )
      setSelectedDateKey(draft.date)
      setDisplayDate(new Date(`${draft.date}T00:00:00`))
    }

    setEventEditor(null)
  }

  function deleteEvent(eventId) {
    onEventsChange((currentEvents) =>
      currentEvents.filter((event) => event.id !== eventId),
    )
    setEventEditor(null)
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
      <header className="mb-4 flex flex-none items-baseline justify-between gap-4">
        <h1 className="m-0 min-w-0 text-[30px] font-semibold leading-[1.1] tracking-normal text-foreground max-[720px]:text-[25px]">
          Calendar
        </h1>
        <p className="m-0 shrink-0 text-sm font-semibold text-muted-foreground">
          {monthLabel}
        </p>
      </header>

      <div className="mb-3 flex flex-none items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            className="size-9 rounded-lg"
            variant="outline"
            size="icon"
            type="button"
            aria-label="Previous month"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            className="size-9 rounded-lg"
            variant="outline"
            size="icon"
            type="button"
            aria-label="Next month"
            onClick={goToNextMonth}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            className="h-9 rounded-lg px-3"
            variant="outline"
            type="button"
            onClick={goToToday}
          >
            Today
          </Button>
        </div>
        <Button
          className="rounded-lg"
          type="button"
          aria-label="New event"
          onClick={() => openNewEvent()}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New event</span>
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1 max-[720px]:gap-5 lg:grid-cols-[minmax(0,1fr)_320px] [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent">
        <section className="min-w-0" aria-label={`${monthLabel} calendar`}>
          <div className="grid grid-cols-7 border-b border-border pb-2 text-center text-xs font-semibold text-muted-foreground">
            {weekdayLabels.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day) => (
              <CalendarDayButton
                currentMonth={day.currentMonth}
                dateKey={day.dateKey}
                dayNumber={day.date.getDate()}
                hasEvents={Boolean(eventsByDate.get(day.dateKey)?.length)}
                hasJournals={Boolean(journalEntriesByDate.get(day.dateKey)?.length)}
                hasTasks={Boolean(tasksByDate.get(day.dateKey)?.length)}
                key={day.dateKey}
                selected={day.dateKey === selectedDateKey}
                today={day.dateKey === todayKey}
                onSelect={selectDate}
              />
            ))}
          </div>
        </section>

        <DayDetailsPanel
          dayState={selectedDateState}
          onNewEvent={openNewEvent}
          onOpenEvent={openExistingEvent}
        />
      </div>

      <EventEditorDialog
        editorState={eventEditor}
        onClose={() => setEventEditor(null)}
        onDelete={deleteEvent}
        onSave={saveEventDraft}
        onUpdateDraft={updateEventDraft}
      />
    </div>
  )
}

function CalendarDayButton({
  currentMonth,
  dateKey,
  dayNumber,
  hasEvents,
  hasJournals,
  hasTasks,
  selected,
  today,
  onSelect,
}) {
  return (
    <button
      className={cn(
        'group min-h-[92px] border-b border-border px-2 py-2 text-left transition-colors hover:bg-accent/40 max-[720px]:min-h-12 max-[720px]:px-1 max-[720px]:py-1.5',
        !currentMonth && 'text-muted-foreground/45',
        selected && 'bg-accent/60',
      )}
      type="button"
      aria-label={formatFullDate(dateKey)}
      aria-pressed={selected}
      onClick={() => onSelect(dateKey)}
    >
      <span
        className={cn(
          'grid size-7 place-items-center rounded-full text-sm font-semibold',
          today && 'bg-primary text-primary-foreground',
          selected && !today && 'bg-muted text-foreground',
        )}
      >
        {dayNumber}
      </span>
      <span className="mt-2 flex min-h-4 flex-wrap items-center gap-1 text-muted-foreground max-[720px]:mt-1 max-[720px]:min-h-3">
        {hasEvents && (
          <CalendarDays
            className="size-3.5 text-foreground/80"
            aria-label="Has events"
          />
        )}
        {hasJournals && (
          <NotebookPen
            className="size-3.5 text-foreground/80"
            aria-label="Has journal entries"
          />
        )}
        {hasTasks && (
          <CheckSquare
            className="size-3.5 text-foreground/80"
            aria-label="Has due tasks"
          />
        )}
      </span>
    </button>
  )
}

function DayDetailsPanel({
  dayState,
  onNewEvent,
  onOpenEvent,
}) {
  const { dateKey, events, journals, tasks } = dayState

  return (
    <aside
      className="min-h-0 text-card-foreground lg:sticky lg:top-0 lg:max-h-full lg:overflow-y-auto"
      aria-label={`${formatFullDate(dateKey)} details`}
    >
      <div className="rounded-[8px] border border-border bg-card p-3 max-[720px]:border-0">
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-semibold leading-tight">
              {formatSelectedDate(dateKey)}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatFullDate(dateKey)}
            </p>
          </div>
          <Button
            className="size-8 shrink-0 rounded-lg"
            variant="outline"
            size="icon"
            type="button"
            aria-label="New event on selected day"
            onClick={() => onNewEvent(dateKey)}
          >
            <Plus className="size-4" />
          </Button>
        </header>

        <div className="grid gap-4">
          <DetailSection
            emptyText="No events."
            icon={CalendarDays}
            title="Events"
          >
            {events.map((event) => (
              <button
                className="grid w-full gap-1 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/55"
                key={event.id}
                type="button"
                onClick={() => onOpenEvent(event)}
              >
                <span className="text-sm font-semibold">
                  {event.title.trim() || 'Untitled event'}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {event.allDay || !event.time ? 'All day' : event.time}
                </span>
                {event.description && (
                  <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {event.description}
                  </span>
                )}
              </button>
            ))}
          </DetailSection>

          <DetailSection emptyText="No journals." icon={NotebookPen} title="Journals">
            {journals.map((entry) => (
              <div className="grid gap-1 px-2 py-1.5" key={entry.id}>
                <p className="truncate text-sm font-semibold">
                  {entry.title?.trim() || 'Untitled entry'}
                </p>
                <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {entry.body?.trim() || 'No body yet.'}
                </p>
              </div>
            ))}
          </DetailSection>

          <DetailSection emptyText="No due tasks." icon={CheckSquare} title="Tasks">
            {tasks.map((task) => (
              <div className="grid gap-1 px-2 py-1.5" key={task.key}>
                <p
                  className={cn(
                    'truncate text-sm font-semibold',
                    task.completed && 'text-muted-foreground line-through',
                  )}
                >
                  {task.title?.trim() || 'Untitled task'}
                </p>
                {task.parentTitle && (
                  <p className="truncate text-xs text-muted-foreground">
                    From {task.parentTitle}
                  </p>
                )}
              </div>
            ))}
          </DetailSection>
        </div>
      </div>
    </aside>
  )
}

function DetailSection({ children, emptyText, icon: Icon, title }) {
  const visibleChildren = Array.isArray(children)
    ? children.flat().filter(Boolean)
    : children
      ? [children]
      : []
  const hasChildren = visibleChildren.length > 0

  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </h3>
      <div className="grid gap-1">
        {hasChildren ? (
          visibleChildren
        ) : (
          <p className="px-2 py-1 text-sm text-muted-foreground">{emptyText}</p>
        )}
      </div>
    </section>
  )
}

function EventDatePicker({ value, onChange }) {
  const todayKey = getTodayDateKey()
  const wrapperRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [displayDate, setDisplayDate] = useState(() =>
    value ? new Date(`${value}T00:00:00`) : new Date(),
  )
  const monthDays = useMemo(() => getCalendarMonthDays(displayDate), [displayDate])

  useCloseOnOutsidePointer(wrapperRef, () => setOpen(false))

  useEffect(() => {
    if (value) {
      setDisplayDate(new Date(`${value}T00:00:00`))
    }
  }, [value])

  function moveMonth(offset) {
    setDisplayDate(
      (currentDate) =>
        new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1),
    )
  }

  function selectDate(dateKey) {
    onChange(dateKey)
    setOpen(false)
  }

  function selectToday() {
    const today = new Date()
    setDisplayDate(today)
    selectDate(toDateKey(today))
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 text-left text-sm font-medium text-foreground shadow-none outline-none transition-[color,box-shadow] hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
      >
        <span className="truncate">
          {value ? formatEventDateLabel(value) : 'Pick date'}
        </span>
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+0.375rem)] z-[70] w-[min(18rem,calc(100vw-3rem))] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-[0_18px_40px_oklch(0_0_0/28%)]">
          <header className="mb-3 flex items-center justify-between gap-2">
            <p className="m-0 text-sm font-semibold">{formatMonthLabel(displayDate)}</p>
            <div className="flex items-center gap-1">
              <Button
                className="size-8 rounded-md"
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Previous month"
                onClick={() => moveMonth(-1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                className="size-8 rounded-md"
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Next month"
                onClick={() => moveMonth(1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </header>

          <div className="mb-1 grid grid-cols-7 text-center text-[0.7rem] font-semibold text-muted-foreground">
            {compactWeekdayLabels.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const selected = day.dateKey === value
              const today = day.dateKey === todayKey

              return (
                <button
                  className={cn(
                    'grid aspect-square place-items-center rounded-md text-sm transition-colors hover:bg-accent',
                    !day.currentMonth && 'text-muted-foreground/45',
                    today && 'text-foreground ring-1 ring-border',
                    selected && 'bg-primary text-primary-foreground hover:bg-primary',
                  )}
                  key={day.dateKey}
                  type="button"
                  aria-label={formatFullDate(day.dateKey)}
                  aria-pressed={selected}
                  onClick={() => selectDate(day.dateKey)}
                >
                  {day.date.getDate()}
                </button>
              )
            })}
          </div>

          <footer className="mt-3 flex justify-end">
            <Button
              className="h-8 rounded-md px-2 text-xs"
              variant="ghost"
              type="button"
              onClick={selectToday}
            >
              Today
            </Button>
          </footer>
        </div>
      )}
    </div>
  )
}

function EventTimePicker({ disabled, value, onChange }) {
  const wrapperRef = useRef(null)
  const [open, setOpen] = useState(false)
  const selectedTime = parseEventTime(value)

  useCloseOnOutsidePointer(wrapperRef, () => setOpen(false))

  function updateTime(nextPart) {
    const nextTime = {
      hour: selectedTime.hour,
      minute: selectedTime.minute,
      ...nextPart,
    }

    onChange(`${nextTime.hour}:${nextTime.minute}`)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        className={cn(
          'flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 text-left text-sm font-medium text-foreground shadow-none outline-none transition-[color,box-shadow] hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-36',
          disabled && 'cursor-not-allowed opacity-55 hover:bg-background',
        )}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
      >
        <span className="truncate">
          {disabled ? 'All day' : value ? formatEventTimeLabel(value) : 'Pick time'}
        </span>
        <Clock className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-[calc(100%+0.375rem)] z-[70] w-40 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-[0_18px_40px_oklch(0_0_0/28%)]">
          <div className="grid grid-cols-2 gap-2">
            <TimeColumn
              label="Hour"
              options={hourOptions}
              value={selectedTime.hour}
              onSelect={(hour) => updateTime({ hour })}
            />
            <TimeColumn
              label="Minute"
              options={minuteOptions}
              value={selectedTime.minute}
              onSelect={(minute) => updateTime({ minute })}
            />
          </div>
          <footer className="mt-2 flex justify-between">
            <Button
              className="h-8 rounded-md px-2 text-xs"
              variant="ghost"
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              Clear
            </Button>
            <Button
              className="h-8 rounded-md px-2 text-xs"
              variant="ghost"
              type="button"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </footer>
        </div>
      )}
    </div>
  )
}

function TimeColumn({ label, onSelect, options, value }) {
  return (
    <div>
      <p className="mb-1 px-1 text-[0.65rem] font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <div className="max-h-44 overflow-y-auto pr-1 [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent">
        {options.map((option) => (
          <button
            className={cn(
              'mb-1 grid h-8 w-full place-items-center rounded-md text-sm transition-colors hover:bg-accent',
              option === value && 'bg-primary text-primary-foreground hover:bg-primary',
            )}
            key={option}
            type="button"
            aria-pressed={option === value}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function EventEditorDialog({
  editorState,
  onClose,
  onDelete,
  onSave,
  onUpdateDraft,
}) {
  if (!editorState) {
    return null
  }

  const draft = editorState.draft
  const existingEvent = editorState.mode === 'edit'
  const canSave = Boolean(draft.title.trim())

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="flex max-h-[min(680px,calc(100dvh-2rem))] w-full max-w-lg flex-col rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-[0_18px_48px_oklch(0_0_0/22%)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-editor-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-semibold" id="event-editor-title">
            {existingEvent ? 'Edit event' : 'New event'}
          </h2>
          <Button
            className="size-8 rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground"
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Close event editor"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </header>

        <div className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Title
            </span>
            <Input
              className="h-10 rounded-lg bg-background shadow-none"
              value={draft.title}
              placeholder="Event title"
              onChange={(event) => onUpdateDraft({ title: event.target.value })}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Date
              </span>
              <EventDatePicker
                value={draft.date}
                onChange={(date) => onUpdateDraft({ date })}
              />
            </div>

            <div className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Time
              </span>
              <EventTimePicker
                disabled={draft.allDay}
                value={draft.time}
                onChange={(time) => onUpdateDraft({ time })}
              />
            </div>
          </div>

          <button
            className="flex w-fit items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
            type="button"
            role="checkbox"
            aria-checked={draft.allDay}
            onClick={() => {
              const nextAllDay = !draft.allDay

              onUpdateDraft({
                allDay: nextAllDay,
                time: nextAllDay ? '' : draft.time,
              })
            }}
          >
            <span
              className={cn(
                'grid size-4 place-items-center rounded border border-input bg-background text-background transition-colors',
                draft.allDay && 'border-primary bg-primary text-primary-foreground',
              )}
              aria-hidden="true"
            >
              <Check className="size-3" />
            </span>
            All day
          </button>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Description
            </span>
            <textarea
              className="min-h-28 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground shadow-none outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={draft.description}
              placeholder="Event description"
              onChange={(event) =>
                onUpdateDraft({ description: event.target.value })
              }
            />
          </label>
        </div>

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            {existingEvent && (
              <Button
                className="rounded-lg text-destructive hover:text-destructive"
                variant="ghost"
                type="button"
                onClick={() => onDelete(draft.id)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              className="rounded-lg"
              variant="outline"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="rounded-lg"
              type="button"
              disabled={!canSave}
              onClick={onSave}
            >
              Save
            </Button>
          </div>
        </footer>
      </section>
    </div>
  )
}

function groupEntriesByDate(entries) {
  const grouped = new Map()

  entries.forEach((entry) => {
    const dateKey = toDateKey(new Date(entry.createdAt))

    if (!dateKey) {
      return
    }

    appendToDateGroup(grouped, dateKey, entry)
  })

  return grouped
}

function groupEventsByDate(events) {
  const grouped = new Map()

  events
    .slice()
    .sort(sortEvents)
    .forEach((event) => {
      appendToDateGroup(grouped, event.date, event)
    })

  return grouped
}

function groupTasksByDueDate(taskItems) {
  const grouped = new Map()

  taskItems.forEach((task) => {
    if (task.dueDate) {
      appendToDateGroup(grouped, task.dueDate, {
        completed: task.completed,
        key: task.id,
        title: task.title,
      })
    }

    ;(task.subtasks || []).forEach((subtask) => {
      if (subtask.dueDate) {
        appendToDateGroup(grouped, subtask.dueDate, {
          completed: subtask.completed,
          key: `${task.id}-${subtask.id}`,
          parentTitle: task.title?.trim() || 'Untitled task',
          title: subtask.title,
        })
      }
    })
  })

  return grouped
}

function appendToDateGroup(grouped, dateKey, item) {
  if (!dateKey) {
    return
  }

  const currentItems = grouped.get(dateKey) || []
  currentItems.push(item)
  grouped.set(dateKey, currentItems)
}

function getCalendarMonthDays(displayDate) {
  const year = displayDate.getFullYear()
  const month = displayDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const firstVisibleDay = new Date(firstDay)
  firstVisibleDay.setDate(firstVisibleDay.getDate() - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay)
    date.setDate(firstVisibleDay.getDate() + index)

    return {
      currentMonth: date.getMonth() === month,
      date,
      dateKey: toDateKey(date),
    }
  })
}

function sortEvents(first, second) {
  if (first.date !== second.date) {
    return first.date.localeCompare(second.date)
  }

  if (first.allDay !== second.allDay) {
    return first.allDay ? -1 : 1
  }

  return (first.time || '').localeCompare(second.time || '')
}

function formatMonthLabel(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(value)
}

function formatSelectedDate(dateKey) {
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${dateKey}T00:00:00`))
}

function formatFullDate(dateKey) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
  }).format(new Date(`${dateKey}T00:00:00`))
}

function formatEventDateLabel(dateKey) {
  if (!dateKey) {
    return 'Pick date'
  }

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00`))
}

function formatEventTimeLabel(value) {
  const time = parseEventTime(value)
  return `${time.hour}:${time.minute}`
}

function parseEventTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || '')

  if (!match) {
    return { hour: '09', minute: '00' }
  }

  return {
    hour: match[1],
    minute: match[2],
  }
}

function getTodayDateKey() {
  return toDateKey(new Date())
}

function toDateKey(date) {
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
}

function createEventId() {
  if (globalThis.crypto?.randomUUID) {
    return `event-${globalThis.crypto.randomUUID()}`
  }

  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function useCloseOnOutsidePointer(ref, onClose) {
  useEffect(() => {
    function handlePointerDown(event) {
      if (!ref.current || ref.current.contains(event.target)) {
        return
      }

      onClose()
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, ref])
}

export default CalendarWorkspace
