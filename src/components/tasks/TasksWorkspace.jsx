import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Inbox,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar as RangeCalendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const taskFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Done' },
]

const taskSortOptions = [
  { value: 'dueDate', label: 'Due date' },
  { value: 'createdAt', label: 'Created' },
]

const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function TasksWorkspace({ items, onItemsChange }) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [focusedTaskId, setFocusedTaskId] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('dueDate')
  const [sortDirection, setSortDirection] = useState('asc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dueDateRange, setDueDateRange] = useState()
  const filterRef = useRef(null)
  const taskRefs = useRef(new Map())
  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (hasDateRange(dueDateRange) ? 1 : 0) +
    (sortBy !== 'dueDate' || sortDirection !== 'asc' ? 1 : 0)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleItems = useMemo(
    () =>
      items
        .filter((item) => {
          const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'done' && item.completed) ||
            (statusFilter === 'active' && !item.completed)
          const matchesSearch =
            !normalizedQuery || getTaskSearchText(item).includes(normalizedQuery)
          const matchesDueDate = isTaskDueDateInRange(item.dueDate, dueDateRange)

          return matchesStatus && matchesSearch && matchesDueDate
        })
        .sort((firstTask, secondTask) =>
          compareTasks(firstTask, secondTask, sortBy, sortDirection),
        ),
    [dueDateRange, items, normalizedQuery, sortBy, sortDirection, statusFilter],
  )
  const activeCount = items.filter((item) => !item.completed).length
  const stateLabel =
    activeFilterCount > 0 || normalizedQuery
      ? `${visibleItems.length} results`
      : activeCount === 1
        ? '1 active'
        : `${activeCount} active`

  useEffect(() => {
    function handleOutsideClick(event) {
      const clickedFilterPopover = event.target.closest(
        '[data-radix-popper-content-wrapper]',
      )

      if (!filterRef.current?.contains(event.target) && !clickedFilterPopover) {
        setFilterOpen(false)
      }

      if (!focusedTaskId || event.target.closest('[data-delete-confirmation]')) {
        return
      }

      if (!taskRefs.current.get(focusedTaskId)?.contains(event.target)) {
        setFocusedTaskId('')
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [focusedTaskId])

  function createTask() {
    const task = createEmptyTask()

    onItemsChange((currentItems) => [...currentItems, task])
    setFocusedTaskId(task.id)
    setSearchQuery('')
    setStatusFilter('all')
  }

  function clearFilters() {
    setDueDateRange(undefined)
    setSortBy('dueDate')
    setSortDirection('asc')
    setStatusFilter('all')
  }

  useEffect(() => {
    if (!focusedTaskId) {
      return
    }

    taskRefs.current.get(focusedTaskId)?.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    })
  }, [focusedTaskId, visibleItems.length])

  function updateTask(taskId, updates) {
    onItemsChange((currentItems) =>
      currentItems.map((item) =>
        item.id === taskId
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  }

  function deleteTask(taskId) {
    onItemsChange((currentItems) => currentItems.filter((item) => item.id !== taskId))
  }

  function requestDeleteTask(task) {
    setPendingDelete({
      taskId: task.id,
      title: task.title.trim() || 'Untitled task',
      type: 'task',
      withSubtasks: Array.isArray(task.subtasks) && task.subtasks.length > 0,
    })
  }

  function addSubtask(taskId) {
    const task = items.find((item) => item.id === taskId)
    const subtasks = Array.isArray(task?.subtasks) ? task.subtasks : []

    updateTask(taskId, { subtasks: [...subtasks, createEmptySubtask()] })
    setFocusedTaskId(taskId)
  }

  function updateSubtask(taskId, subtaskId, updates) {
    const task = items.find((item) => item.id === taskId)
    const subtasks = Array.isArray(task?.subtasks) ? task.subtasks : []

    updateTask(taskId, {
      subtasks: subtasks.map((subtask) =>
        subtask.id === subtaskId
          ? { ...subtask, ...updates, updatedAt: new Date().toISOString() }
          : subtask,
      ),
    })
  }

  function deleteSubtask(taskId, subtaskId) {
    const task = items.find((item) => item.id === taskId)
    const subtasks = Array.isArray(task?.subtasks) ? task.subtasks : []

    updateTask(taskId, {
      subtasks: subtasks.filter((subtask) => subtask.id !== subtaskId),
    })
  }

  function requestDeleteSubtask(taskId, subtask) {
    setPendingDelete({
      subtaskId: subtask.id,
      taskId,
      title: subtask.title.trim() || 'Untitled subtask',
      type: 'subtask',
    })
  }

  function confirmDelete() {
    if (!pendingDelete) {
      return
    }

    if (pendingDelete.type === 'task') {
      deleteTask(pendingDelete.taskId)
      setFocusedTaskId((currentId) =>
        currentId === pendingDelete.taskId ? '' : currentId,
      )
    } else {
      deleteSubtask(pendingDelete.taskId, pendingDelete.subtaskId)
    }

    setPendingDelete(null)
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
      <header className="mb-5 flex flex-none items-baseline justify-between gap-4 max-[720px]:mb-4">
        <h1 className="m-0 min-w-0 text-[30px] font-semibold leading-[1.1] tracking-normal text-foreground max-[720px]:text-[25px]">
          Tasks
        </h1>
        <p className="m-0 shrink-0 text-sm font-semibold text-muted-foreground">
          {stateLabel}
        </p>
      </header>

      <TasksToolbar
        activeFilterCount={activeFilterCount}
        dueDateRange={dueDateRange}
        filterOpen={filterOpen}
        filterRef={filterRef}
        onClearFilters={clearFilters}
        onDueDateRangeChange={setDueDateRange}
        onNewTask={createTask}
        onSearchChange={setSearchQuery}
        onSortByChange={setSortBy}
        onSortDirectionChange={setSortDirection}
        onStatusFilterChange={setStatusFilter}
        onToggleFilter={() => setFilterOpen((open) => !open)}
        searchQuery={searchQuery}
        sortBy={sortBy}
        sortDirection={sortDirection}
        statusFilter={statusFilter}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent">
        {visibleItems.length > 0 ? (
          <div className="divide-y divide-border">
            {visibleItems.map((task) => (
              <div
                key={task.id}
                ref={(element) => {
                  if (element) {
                    taskRefs.current.set(task.id, element)
                  } else {
                    taskRefs.current.delete(task.id)
                  }
                }}
              >
                <EditableTaskRow
                  focused={focusedTaskId === task.id}
                  onAddSubtask={() => addSubtask(task.id)}
                  onDeleteSubtask={(subtask) => requestDeleteSubtask(task.id, subtask)}
                  onDeleteTask={() => requestDeleteTask(task)}
                  onFocusTask={() => setFocusedTaskId(task.id)}
                  onToggleSubtask={(subtask) =>
                    updateSubtask(task.id, subtask.id, {
                      completed: !subtask.completed,
                    })
                  }
                  onToggleTask={() =>
                    updateTask(task.id, { completed: !task.completed })
                  }
                  onUpdateSubtask={(subtaskId, updates) =>
                    updateSubtask(task.id, subtaskId, updates)
                  }
                  onUpdateTask={(updates) => updateTask(task.id, updates)}
                  task={task}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyTasksState hasAnyTasks={items.length > 0} searchQuery={searchQuery} />
        )}
      </div>

      <DeleteTaskConfirmationDialog
        pendingDelete={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function TasksToolbar({
  activeFilterCount,
  dueDateRange,
  filterOpen,
  filterRef,
  onClearFilters,
  onDueDateRangeChange,
  onNewTask,
  onSearchChange,
  onSortByChange,
  onSortDirectionChange,
  onStatusFilterChange,
  onToggleFilter,
  searchQuery,
  sortBy,
  sortDirection,
  statusFilter,
}) {
  return (
    <div className="relative mb-3 grid flex-none grid-cols-[auto_1fr_auto] items-center gap-2 sm:flex">
      <div className="relative" ref={filterRef}>
        <Button
          variant="outline"
          type="button"
          className={cn(
            'relative rounded-lg',
            activeFilterCount > 0 && 'bg-accent text-accent-foreground',
          )}
          aria-haspopup="menu"
          aria-expanded={filterOpen}
          aria-label="Open task filters"
          onClick={onToggleFilter}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[11px] font-bold leading-none text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {filterOpen && (
          <TasksFilterPopover
            dueDateRange={dueDateRange}
            onClearFilters={onClearFilters}
            onDueDateRangeChange={onDueDateRangeChange}
            onSortByChange={onSortByChange}
            onSortDirectionChange={onSortDirectionChange}
            onStatusFilterChange={onStatusFilterChange}
            sortBy={sortBy}
            sortDirection={sortDirection}
            statusFilter={statusFilter}
          />
        )}
      </div>

      <label className="relative flex min-w-0 flex-1 items-center sm:min-w-[220px] sm:max-w-[360px]">
        <Search
          className="pointer-events-none absolute left-3 text-muted-foreground"
          size={16}
        />
        <Input
          type="text"
          placeholder="Search tasks..."
          className="h-9 rounded-lg bg-card pl-9 pr-9 shadow-none"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {searchQuery && (
          <Button
            className="absolute right-1.5 size-7 rounded-md p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Clear search"
            onClick={() => onSearchChange('')}
          >
            <X size={15} />
          </Button>
        )}
      </label>

      <Button
        className="ml-auto rounded-lg"
        type="button"
        aria-label="New task"
        onClick={onNewTask}
      >
        <Plus size={16} />
        <span className="hidden sm:inline">New</span>
      </Button>
    </div>
  )
}

function TasksFilterPopover({
  dueDateRange,
  onClearFilters,
  onDueDateRangeChange,
  onSortByChange,
  onSortDirectionChange,
  onStatusFilterChange,
  sortBy,
  sortDirection,
  statusFilter,
}) {
  function toggleSort(optionValue) {
    if (sortBy === optionValue) {
      onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')
      return
    }

    onSortByChange(optionValue)
    onSortDirectionChange(optionValue === 'createdAt' ? 'desc' : 'asc')
  }

  return (
    <div
      className="absolute left-0 top-[calc(100%+8px)] z-20 max-h-[min(620px,calc(100dvh-140px))] w-[min(320px,calc(100vw-24px))] overflow-auto rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-[0_18px_48px_oklch(0_0_0/18%)] [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent"
      role="dialog"
      aria-label="Task filters"
    >
      <div className="mb-3 flex items-center justify-between border-b border-border pb-3 text-sm font-semibold">
        <span>Filters</span>
        <Button
          variant="ghost"
          size="xs"
          type="button"
          className="h-auto px-0 text-xs font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={onClearFilters}
        >
          Clear
        </Button>
      </div>

      <section className="grid gap-2 py-2" aria-labelledby="task-status-heading">
        <h2
          className="m-0 text-xs font-semibold text-muted-foreground"
          id="task-status-heading"
        >
          Status
        </h2>
        <div className="grid grid-cols-3 gap-1.5">
          {taskFilterOptions.map((option) => (
            <Button
              className={cn(
                'h-8 rounded-lg border border-border bg-transparent px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground',
                statusFilter === option.value &&
                  'border-muted-foreground/60 bg-muted/35 text-foreground',
              )}
              variant="ghost"
              type="button"
              aria-pressed={statusFilter === option.value}
              key={option.value}
              onClick={() => onStatusFilterChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="grid gap-2 py-2" aria-labelledby="task-due-heading">
        <h2
          className="m-0 text-xs font-semibold text-muted-foreground"
          id="task-due-heading"
        >
          Due date
        </h2>
        <DateRangeControl
          label="due date"
          range={dueDateRange}
          onRangeChange={onDueDateRangeChange}
        />
      </section>

      <section className="grid gap-2 py-2" aria-labelledby="task-sort-heading">
        <h2
          className="m-0 text-xs font-semibold text-muted-foreground"
          id="task-sort-heading"
        >
          Sort
        </h2>
        <div className="grid grid-cols-2 gap-1.5">
          {taskSortOptions.map((option) => {
            const active = sortBy === option.value
            const DirectionIcon = sortDirection === 'asc' ? ArrowDown : ArrowUp

            return (
              <Button
                className={cn(
                  'h-8 justify-center rounded-lg border border-border bg-transparent px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground',
                  active &&
                    'border-muted-foreground/60 bg-muted/35 text-foreground',
                )}
                variant="ghost"
                type="button"
                aria-pressed={active}
                key={option.value}
                onClick={() => toggleSort(option.value)}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {active && <DirectionIcon className="size-3.5" />}
              </Button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function DateRangeControl({ label, range, onRangeChange }) {
  const hasRange = hasDateRange(range)

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className={cn(
              'min-w-0 flex-1 justify-start rounded-lg px-2.5 text-left font-normal',
              !hasRange && 'text-muted-foreground',
            )}
          >
            <CalendarIcon size={15} />
            <span className="truncate">{formatDateRange(range)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0" sideOffset={8}>
          <RangeCalendar
            mode="range"
            selected={range}
            onSelect={onRangeChange}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>

      {hasRange && (
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          aria-label={`Clear ${label} range`}
          className="rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => onRangeChange(undefined)}
        >
          <X size={15} />
        </Button>
      )}
    </div>
  )
}

function formatDateRange(range) {
  if (!range?.from && !range?.to) {
    return 'Pick date range'
  }

  if (range.from && range.to) {
    return `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d')}`
  }

  if (range.from) {
    return `From ${format(range.from, 'MMM d')}`
  }

  return `Until ${format(range.to, 'MMM d')}`
}

function DeleteTaskConfirmationDialog({ onCancel, onConfirm, pendingDelete }) {
  if (!pendingDelete) {
    return null
  }

  const isTask = pendingDelete.type === 'task'
  const title = isTask ? 'Delete task?' : 'Delete subtask?'
  const description = isTask
    ? pendingDelete.withSubtasks
      ? 'This will also delete its subtasks.'
      : 'This cannot be undone.'
    : 'This cannot be undone.'

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm"
      data-delete-confirmation
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel()
        }
      }}
    >
      <section
        className="w-full max-w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-[0_18px_48px_oklch(0_0_0/22%)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-task-dialog-title"
        aria-describedby="delete-task-dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2
          className="m-0 text-base font-semibold text-foreground"
          id="delete-task-dialog-title"
        >
          {title}
        </h2>
        <p
          className="mt-2 text-sm leading-6 text-muted-foreground"
          id="delete-task-dialog-description"
        >
          {description}
        </p>
        <p className="mt-2 break-words text-sm font-medium text-foreground">
          {pendingDelete.title}
        </p>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            className="rounded-lg max-[420px]:flex-1"
            variant="outline"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="rounded-lg max-[420px]:flex-1"
            variant="destructive"
            type="button"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </section>
    </div>
  )
}

function EditableTaskRow({
  focused,
  onAddSubtask,
  onDeleteSubtask,
  onDeleteTask,
  onFocusTask,
  onToggleSubtask,
  onToggleTask,
  onUpdateSubtask,
  onUpdateTask,
  task,
}) {
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : []

  return (
    <article
      className={cn(
        'group cursor-pointer px-2.5 py-3 transition-colors hover:bg-accent/45',
        focused && 'bg-accent/45',
      )}
      role="button"
      tabIndex={0}
      onClick={onFocusTask}
      onFocus={(event) => {
        if (event.target === event.currentTarget) {
          onFocusTask()
        }
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onFocusTask()
        }
      }}
    >
      <div
        className={cn(
          'grid gap-2',
          'grid-cols-[auto_minmax(0,1fr)]',
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <CheckButton
            checked={task.completed}
            label={task.completed ? 'Mark task active' : 'Complete task'}
            onToggle={onToggleTask}
          />
          {focused && (
            <Button
              className="size-8 rounded-md text-muted-foreground hover:bg-transparent hover:text-destructive"
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Delete task"
              onClick={(event) => {
                event.stopPropagation()
                onDeleteTask()
              }}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>

        <div className="min-w-0">
          {focused ? (
            <div className="grid gap-1">
              <textarea
                className={cn(
                  'block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-sm font-semibold leading-5 text-foreground outline-none [field-sizing:content] placeholder:text-muted-foreground/70 focus-visible:ring-0',
                  task.completed && 'text-muted-foreground line-through',
                )}
                value={task.title}
                placeholder="Some task"
                rows={1}
                onChange={(event) => onUpdateTask({ title: event.target.value })}
              />

              <textarea
                className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-sm leading-6 text-muted-foreground outline-none [field-sizing:content] placeholder:text-muted-foreground/60 focus-visible:ring-0"
                value={task.notes}
                placeholder="Some task description"
                rows={getInlineTextareaRows(task.notes)}
                onChange={(event) => onUpdateTask({ notes: event.target.value })}
              />

              <DatePicker
                value={task.dueDate}
                placeholder="Task date / deadline"
                onChange={(dueDate) => onUpdateTask({ dueDate })}
              />

              {subtasks.length > 0 && (
                <div className="mt-2 grid gap-2">
                  {subtasks.map((subtask) => (
                    <EditableSubtaskRow
                      key={subtask.id}
                      onDelete={() => onDeleteSubtask(subtask)}
                      onToggle={() => onToggleSubtask(subtask)}
                      onUpdate={(updates) => onUpdateSubtask(subtask.id, updates)}
                      subtask={subtask}
                    />
                  ))}
                </div>
              )}

              <Button
                className="h-7 w-fit rounded-md px-0 text-xs font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground"
                variant="ghost"
                type="button"
                onClick={onAddSubtask}
              >
                <Plus size={14} />
                <span>Add subtask</span>
              </Button>
            </div>
          ) : (
            <TaskViewContent
              onToggleSubtask={onToggleSubtask}
              task={task}
            />
          )}
        </div>
      </div>
    </article>
  )
}

function TaskViewContent({ onToggleSubtask, task }) {
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : []

  return (
    <div className="grid gap-1">
      <p
        className={cn(
          'text-sm font-semibold text-foreground',
          task.completed && 'text-muted-foreground line-through',
        )}
      >
        {task.title.trim() || 'Untitled task'}
      </p>
      {task.notes && (
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {task.notes}
        </p>
      )}
      {task.dueDate && (
        <TaskDateLine value={task.dueDate} />
      )}
      {subtasks.length > 0 && (
        <div className="mt-2 grid gap-2">
          {subtasks.map((subtask) => (
            <SubtaskViewContent
              key={subtask.id}
              onToggle={() => onToggleSubtask(subtask)}
              subtask={subtask}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SubtaskViewContent({ onToggle, subtask }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
      <CheckButton
        checked={subtask.completed}
        label={subtask.completed ? 'Mark subtask active' : 'Complete subtask'}
        onToggle={onToggle}
        small
      />
      <div className="min-w-0">
        <p
          className={cn(
            'text-sm font-medium text-foreground',
            subtask.completed && 'text-muted-foreground line-through',
          )}
        >
          {subtask.title || 'Untitled subtask'}
        </p>
        {subtask.notes && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {subtask.notes}
          </p>
        )}
        {subtask.dueDate && (
          <TaskDateLine className="mt-1" value={subtask.dueDate} />
        )}
      </div>
    </div>
  )
}

function EditableSubtaskRow({ onDelete, onToggle, onUpdate, subtask }) {
  return (
    <div className="group/subtask grid grid-cols-[auto_minmax(0,1fr)] gap-2">
      <div className="flex flex-col items-center gap-1">
        <CheckButton
          checked={subtask.completed}
          label={subtask.completed ? 'Mark subtask active' : 'Complete subtask'}
          onToggle={onToggle}
          small
        />
        <Button
          className="size-7 rounded-md text-muted-foreground hover:bg-transparent hover:text-destructive"
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Delete subtask"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 size={14} />
        </Button>
      </div>

      <div className="min-w-0">
        <textarea
          className={cn(
            'block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-sm font-medium leading-5 text-foreground outline-none [field-sizing:content] placeholder:text-muted-foreground/70 focus-visible:ring-0',
            subtask.completed && 'text-muted-foreground line-through',
          )}
          value={subtask.title}
          placeholder="Subtask"
          rows={1}
          onChange={(event) => onUpdate({ title: event.target.value })}
        />
        <textarea
          className="mt-1 block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-xs leading-5 text-muted-foreground outline-none [field-sizing:content] placeholder:text-muted-foreground/60 focus-visible:ring-0"
          value={subtask.notes}
          placeholder="Some subtask description"
          rows={getInlineTextareaRows(subtask.notes)}
          onChange={(event) => onUpdate({ notes: event.target.value })}
        />
        <DatePicker
          value={subtask.dueDate}
          placeholder="Subtask date"
          compact
          onChange={(dueDate) => onUpdate({ dueDate })}
        />
      </div>
    </div>
  )
}

function CheckButton({ checked, label, onToggle, small = false }) {
  return (
    <Button
      className={cn(
        'rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground',
        small ? 'size-7' : 'size-8',
        checked && 'text-foreground',
      )}
      variant="ghost"
      size="icon"
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onMouseDown={(event) => {
        event.stopPropagation()
      }}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
    >
      {checked ? (
        <Check className={small ? 'size-[17px]' : 'size-[19px]'} />
      ) : (
        <Circle className={small ? 'size-[17px]' : 'size-[19px]'} />
      )}
    </Button>
  )
}

function DatePicker({ compact = false, onChange, placeholder, value }) {
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => getDateFromValue(value))
  const pickerRef = useRef(null)
  const selectedDate = value ? new Date(`${value}T00:00:00`) : null
  const days = getCalendarDays(visibleMonth)

  useEffect(() => {
    if (value) {
      setVisibleMonth(getDateFromValue(value))
    }
  }, [value])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function moveMonth(offset) {
    setVisibleMonth((current) => {
      const next = new Date(current)
      next.setMonth(next.getMonth() + offset)
      return next
    })
  }

  return (
    <div className="relative inline-flex w-fit" ref={pickerRef}>
      <button
        className={cn(
          'inline-flex border-0 bg-transparent p-0 text-left [font:inherit] text-muted-foreground outline-none hover:text-foreground',
          compact && 'mt-1',
        )}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <TaskDateLine placeholder={placeholder} value={value} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-64 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-[0_12px_32px_oklch(0_0_0/16%)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button
              className="size-8 rounded-md"
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Previous month"
              onClick={() => moveMonth(-1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <p className="text-sm font-semibold">
              {formatMonthLabel(visibleMonth)}
            </p>
            <Button
              className="size-8 rounded-md"
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Next month"
              onClick={() => moveMonth(1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold text-muted-foreground">
            {weekdays.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dateKey = toDateKey(day.date)
              const selected = value === dateKey
              const today = dateKey === getTodayDateKey()

              return (
                <Button
                  className={cn(
                    'size-8 rounded-md p-0 text-xs text-muted-foreground hover:bg-muted hover:text-foreground',
                    day.currentMonth && 'text-foreground',
                    today && 'border border-border',
                    selected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                  )}
                  variant="ghost"
                  type="button"
                  key={dateKey}
                  onClick={() => {
                    onChange(dateKey)
                    setOpen(false)
                  }}
                >
                  {day.date.getDate()}
                </Button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <Button
              className="h-8 rounded-md px-2 text-xs"
              variant="ghost"
              type="button"
              onClick={() => {
                const today = new Date()

                onChange(toDateKey(today))
                setVisibleMonth(today)
                setOpen(false)
              }}
            >
              Today
            </Button>
            {selectedDate && (
              <Button
                className="h-8 rounded-md px-2 text-xs text-muted-foreground"
                variant="ghost"
                type="button"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TaskDateLine({ className, placeholder, value }) {
  const dueDate = value ? getTaskDueDateDisplay(value) : null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium leading-5 text-muted-foreground',
        dueDate?.status === 'future' && 'text-emerald-500',
        dueDate?.status === 'today' && 'text-yellow-500',
        dueDate?.status === 'overdue' && 'text-destructive',
        className,
      )}
    >
      <Calendar className="size-3.5" />
      <span>{dueDate ? dueDate.label : placeholder}</span>
    </span>
  )
}

function EmptyTasksState({ hasAnyTasks, searchQuery }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-[8px] border border-dashed border-border bg-card/45 p-6 text-center text-sm text-muted-foreground">
      <div>
        <Inbox className="mx-auto mb-3 size-6" />
        <p>
          {hasAnyTasks || searchQuery
            ? 'No tasks match this view.'
            : 'No tasks yet. Add the first one above.'}
        </p>
      </div>
    </div>
  )
}

function createEmptyTask() {
  const now = new Date().toISOString()

  return {
    id: createTaskId(),
    title: '',
    notes: '',
    completed: false,
    dueDate: '',
    priority: 'none',
    subtasks: [],
    createdAt: now,
    updatedAt: now,
  }
}

function createEmptySubtask() {
  const now = new Date().toISOString()

  return {
    id: createTaskId('subtask'),
    title: '',
    notes: '',
    completed: false,
    dueDate: '',
    createdAt: now,
    updatedAt: now,
  }
}

function getTaskSearchText(task) {
  const subtaskText = Array.isArray(task.subtasks)
    ? task.subtasks
        .map((subtask) => `${subtask.title || ''} ${subtask.notes || ''}`)
        .join(' ')
    : ''

  return `${task.title || ''} ${task.notes || ''} ${subtaskText}`.toLowerCase()
}

function getInlineTextareaRows(value) {
  if (!value) {
    return 1
  }

  return Math.min(2, value.split('\n').length)
}

function hasDateRange(range) {
  return Boolean(range?.from || range?.to)
}

function getStartOfDay(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function getEndOfDay(value) {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date
}

function isTaskDueDateInRange(value, range) {
  if (!hasDateRange(range)) {
    return true
  }

  if (!value) {
    return false
  }

  const date = new Date(`${value}T00:00:00`)

  if (range.from && date < getStartOfDay(range.from)) {
    return false
  }

  if (range.to && date > getEndOfDay(range.to)) {
    return false
  }

  return true
}

function compareTasks(firstTask, secondTask, sortBy, sortDirection) {
  const directionModifier = sortDirection === 'asc' ? 1 : -1

  if (sortBy === 'dueDate') {
    const firstHasDueDate = Boolean(firstTask.dueDate)
    const secondHasDueDate = Boolean(secondTask.dueDate)

    if (firstHasDueDate !== secondHasDueDate) {
      return firstHasDueDate ? -1 : 1
    }

    if (!firstHasDueDate && !secondHasDueDate) {
      return compareTaskCreatedAt(firstTask, secondTask, 'desc')
    }

    return firstTask.dueDate.localeCompare(secondTask.dueDate) * directionModifier
  }

  return compareTaskCreatedAt(firstTask, secondTask, sortDirection)
}

function compareTaskCreatedAt(firstTask, secondTask, sortDirection) {
  const directionModifier = sortDirection === 'asc' ? 1 : -1
  const firstTime = new Date(firstTask.createdAt || 0).getTime()
  const secondTime = new Date(secondTask.createdAt || 0).getTime()

  return (firstTime - secondTime) * directionModifier
}

function getTaskDueDateDisplay(value) {
  if (!value) {
    return null
  }

  const today = getTodayDateKey()
  const daysFromToday = getDateDistanceInDays(value, today)
  const dateLabel =
    daysFromToday === 0
      ? 'Today'
      : new Intl.DateTimeFormat(undefined, {
          day: '2-digit',
          month: 'short',
        }).format(new Date(`${value}T00:00:00`))

  if (daysFromToday < 0) {
    const overdueDays = Math.abs(daysFromToday)

    return {
      label: `${dateLabel} - ${overdueDays} ${
        overdueDays === 1 ? 'day' : 'days'
      } overdue`,
      status: 'overdue',
    }
  }

  if (daysFromToday === 0) {
    return {
      label: `${dateLabel} - due today`,
      status: 'today',
    }
  }

  return {
    label: `${dateLabel} - ${daysFromToday} ${
      daysFromToday === 1 ? 'day' : 'days'
    } left`,
    status: 'future',
  }
}

function formatTaskDueDate(value) {
  if (!value) {
    return ''
  }

  const today = getTodayDateKey()
  const daysFromToday = getDateDistanceInDays(value, today)
  const dateLabel =
    daysFromToday === 0
      ? 'Today'
      : new Intl.DateTimeFormat(undefined, {
          day: '2-digit',
          month: 'short',
        }).format(new Date(`${value}T00:00:00`))

  if (daysFromToday < 0) {
    const overdueDays = Math.abs(daysFromToday)
    return `${dateLabel} · ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`
  }

  if (daysFromToday === 0) {
    return `${dateLabel} · due today`
  }

  return `${dateLabel} · ${daysFromToday} ${daysFromToday === 1 ? 'day' : 'days'} left`
}

function getDateDistanceInDays(value, baseValue) {
  const date = new Date(`${value}T00:00:00`)
  const baseDate = new Date(`${baseValue}T00:00:00`)

  return Math.round((date.getTime() - baseDate.getTime()) / 86400000)
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getCalendarDays(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const firstVisible = new Date(firstOfMonth)

  firstVisible.setDate(firstVisible.getDate() - firstOfMonth.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisible)
    date.setDate(firstVisible.getDate() + index)

    return {
      currentMonth: date.getMonth() === month,
      date,
    }
  })
}

function getDateFromValue(value) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date()
  return Number.isNaN(date.getTime()) ? new Date() : date
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

function createTaskId(prefix = 'task') {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default TasksWorkspace
