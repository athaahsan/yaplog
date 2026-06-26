import {
  ArrowRight,
  CalendarDays,
  CheckSquare,
  FileText,
  NotebookPen,
  PenLine,
  Star,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

function DashboardWorkspace({ entries, memoItems, taskItems }) {
  const latestEntry = getLatestByDate(entries, 'createdAt')
  const recentEntries = [...entries]
    .sort((first, second) => getDateTime(second.createdAt) - getDateTime(first.createdAt))
    .slice(0, 4)
  const activeTasks = taskItems.filter((item) => !item.completed)
  const dueSoonTasks = activeTasks.filter(isDueSoon)
  const starredNotes = memoItems.filter((item) => item.favorite)
  const lastJournalState = getLastJournalState(latestEntry)

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
      <header className="mb-6 flex items-start justify-between gap-4 max-[720px]:mb-[18px]">
        <div className="min-w-0">
          <h1 className="m-0 text-[30px] font-semibold leading-[1.1] tracking-normal text-foreground max-[720px]:text-[25px]">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {lastJournalState.message}
          </p>
        </div>
        <Button
          className="h-10 shrink-0 rounded-lg px-3 max-sm:size-10 max-sm:px-0"
          type="button"
          asChild
        >
          <Link to="/journal/new">
            <PenLine size={16} />
            <span className="max-sm:hidden">New entry</span>
          </Link>
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent">
        <section
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Workspace summary"
        >
          <SummaryCard
            icon={NotebookPen}
            label="Journal entries"
            value={entries.length}
            detail={latestEntry ? `Last made ${formatRelativeDate(latestEntry.createdAt)}` : 'No entries yet'}
            to="/journal"
          />
          <SummaryCard
            icon={CheckSquare}
            label="Active tasks"
            value={activeTasks.length}
            detail={dueSoonTasks.length ? `${dueSoonTasks.length} due soon` : 'Nothing urgent'}
            to="/tasks"
          />
          <SummaryCard
            icon={FileText}
            label="Notes"
            value={memoItems.length}
            detail={starredNotes.length ? `${starredNotes.length} starred` : 'No starred notes'}
            to="/notes"
          />
          <SummaryCard
            icon={CalendarDays}
            label="Calendar"
            value="Soon"
            detail="Waiting for events"
            to="/calendar"
          />
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <section
            className="rounded-[8px] border border-border bg-card text-card-foreground"
            aria-labelledby="recent-journals-title"
          >
            <SectionHeader
              title="Recent journals"
              actionLabel="Open journal"
              to="/journal"
            />

            {recentEntries.length > 0 ? (
              <div className="divide-y divide-border">
                {recentEntries.map((entry) => (
                  <Link
                    className="grid gap-1 px-4 py-3.5 transition-colors hover:bg-accent hover:text-accent-foreground"
                    key={entry.id}
                    to={`/journal/${encodeURIComponent(entry.id)}`}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <h3 className="truncate text-sm font-semibold">
                        {entry.title?.trim() || 'Untitled entry'}
                      </h3>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatShortDate(entry.createdAt)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {entry.body?.trim() || 'No body yet.'}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyPanel
                icon={NotebookPen}
                text="No journal entries yet."
                actionLabel="Write one"
                to="/journal/new"
              />
            )}
          </section>

          <div className="grid gap-5">
            <section
              className="rounded-[8px] border border-border bg-card text-card-foreground"
              aria-labelledby="focus-title"
            >
              <SectionHeader title="Focus" actionLabel="Open tasks" to="/tasks" />
              {dueSoonTasks.length > 0 ? (
                <div className="divide-y divide-border">
                  {dueSoonTasks.slice(0, 4).map((task) => (
                    <div
                      className="grid gap-1 px-4 py-3"
                      key={task.id}
                    >
                      <p className="truncate text-sm font-semibold">
                        {task.title?.trim() || 'Untitled task'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTaskDueDate(task.dueDate)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={CheckSquare}
                  text="No tasks need attention."
                  actionLabel="See tasks"
                  to="/tasks"
                />
              )}
            </section>

            <section
              className="rounded-[8px] border border-border bg-card text-card-foreground"
              aria-labelledby="starred-notes-title"
            >
              <SectionHeader title="Starred notes" actionLabel="Open notes" to="/notes" />
              {starredNotes.length > 0 ? (
                <div className="divide-y divide-border">
                  {starredNotes.slice(0, 3).map((note) => (
                    <div
                      className="grid gap-1 px-4 py-3"
                      key={note.id}
                    >
                      <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                        <Star className="size-3.5 shrink-0 fill-current text-amber-500" />
                        <span className="truncate">
                          {note.title?.trim() || 'Untitled note'}
                        </span>
                      </p>
                      <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {note.body?.trim() || 'No body yet.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={FileText}
                  text="No starred notes yet."
                  actionLabel="See notes"
                  to="/notes"
                />
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ detail, icon: Icon, label, to, value }) {
  return (
    <Link
      className="grid min-h-[118px] rounded-[8px] border border-border bg-card p-4 text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      to={to}
    >
      <div className="flex items-center justify-between gap-3">
        <Icon className="size-4 text-muted-foreground" />
        <ArrowRight className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-5">
        <p className="text-2xl font-semibold leading-none">{value}</p>
        <p className="mt-2 text-sm font-medium">{label}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
      </div>
    </Link>
  )
}

function SectionHeader({ actionLabel, title, to }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <h2 className="text-sm font-semibold" id={`${title.toLowerCase().replaceAll(' ', '-')}-title`}>
        {title}
      </h2>
      {to && (
        <Link
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          to={to}
        >
          {actionLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </header>
  )
}

function EmptyPanel({ actionLabel, icon: Icon, text, to }) {
  return (
    <div className="grid min-h-36 place-items-center px-4 py-6 text-center">
      <div>
        <Icon className="mx-auto mb-3 size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{text}</p>
        {to && (
          <Button
            className="mt-3 h-8 rounded-lg px-3"
            variant="secondary"
            type="button"
            asChild
          >
            <Link to={to}>{actionLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

function getLatestByDate(items, key) {
  return items.reduce((latest, item) => {
    if (!latest) {
      return item
    }

    return getDateTime(item[key]) > getDateTime(latest[key]) ? item : latest
  }, null)
}

function getLastJournalState(entry) {
  if (!entry) {
    return {
      message: 'No journals yet. One small entry is enough to start the record.',
    }
  }

  const days = getDaysSince(entry.createdAt)

  if (days <= 0) {
    return { message: 'You journaled today. The record is warm.' }
  }

  if (days === 1) {
    return { message: 'Last journal was yesterday. Still close enough to catch the thread.' }
  }

  if (days <= 4) {
    return { message: `Last journal was ${days} days ago. A quick check-in would keep it alive.` }
  }

  if (days <= 7) {
    return { message: `Last journal was ${days} days ago. Maybe leave a small trace before the week gets blurry.` }
  }

  return { message: `Last journal was ${days} days ago. You do not need a full recap, just start with what feels loud today.` }
}

function getDaysSince(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 0
  }

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  return Math.max(
    0,
    Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86400000),
  )
}

function isDueSoon(task) {
  if (!task.dueDate) {
    return false
  }

  const today = getTodayDateKey()
  const dueDate = new Date(`${task.dueDate}T00:00:00`)
  const soonDate = new Date(`${today}T00:00:00`)
  soonDate.setDate(soonDate.getDate() + 2)

  return task.dueDate <= toDateKey(soonDate)
}

function formatRelativeDate(value) {
  const days = getDaysSince(value)

  if (days <= 0) {
    return 'today'
  }

  if (days === 1) {
    return 'yesterday'
  }

  return `${days} days ago`
}

function formatShortDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'No date'
  }

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

function formatTaskDueDate(value) {
  if (!value) {
    return 'No due date'
  }

  const today = getTodayDateKey()

  if (value < today) {
    return 'Overdue'
  }

  if (value === today) {
    return 'Due today'
  }

  return `Due ${formatShortDate(`${value}T00:00:00`)}`
}

function getDateTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function getTodayDateKey() {
  const now = new Date()
  const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
}

function toDateKey(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
}

export default DashboardWorkspace
