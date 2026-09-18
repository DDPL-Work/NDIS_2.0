import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { TASK_STATUSES, TASK_TYPES } from './constants'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const TYPE_DOT_COLORS = {
  [TASK_TYPES.INTERVENTION]: 'bg-sky-500',
  [TASK_TYPES.PROPOSAL]: 'bg-sky-500',
  [TASK_TYPES.INSPECTION]: 'bg-violet-500',
  [TASK_TYPES.ESCALATION]: 'bg-alert-500',
  [TASK_TYPES.WORK_ORDER]: 'bg-leaf-500',
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function TaskCalendar({ tasks, onSelectTask }) {
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const todayKey = toDateKey(now)

  // Group tasks by due date
  const tasksByDate = useMemo(() => {
    const map = {}
    tasks.forEach((task) => {
      if (!task.dueDate) return
      const key = task.dueDate.split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(task)
    })
    return map
  }, [tasks])

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const cells = []
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="min-h-[90px]" />)
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const key = toDateKey(new Date(currentYear, currentMonth, day))
    const dayTasks = tasksByDate[key] || []
    const isToday = key === todayKey
    const hasOverdue = dayTasks.some((t) => t.status === TASK_STATUSES.OVERDUE)

    cells.push(
      <div
        key={key}
        className={`min-h-[90px] rounded-lg border p-2 transition-colors ${
          isToday
            ? 'border-saffron-300 bg-saffron-50/60 dark:border-saffron-600 dark:bg-saffron-900/20'
            : hasOverdue
              ? 'border-alert-200/60 bg-alert-50/20 dark:border-alert-800/40 dark:bg-alert-900/5'
              : 'border-ink-200/60 bg-white dark:border-ink-700/60 dark:bg-ink-900'
        }`}
      >
        <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-saffron-700 dark:text-saffron-300' : 'text-ink-500 dark:text-ink-400'}`}>
          {day}
        </div>
        <div className="space-y-0.5">
          {dayTasks.slice(0, 3).map((task) => (
            <button
              key={task.id}
              onClick={() => onSelectTask?.(task)}
              className="flex items-center gap-1 w-full truncate rounded px-1 py-0.5 text-left transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
              title={`${task.title} — ${task.typeLabel}`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_DOT_COLORS[task.type] || 'bg-ink-400'}`} />
              <span className="text-[10.5px] font-medium text-ink-700 dark:text-ink-300 truncate">
                {task.title}
              </span>
            </button>
          ))}
          {dayTasks.length > 3 && (
            <div className="text-[10px] text-ink-400 pl-0.5">+{dayTasks.length - 3} more</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} onClick={prevMonth} />
        <h3 className="text-[13px] font-semibold text-ink-800 dark:text-ink-100">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h3>
        <Button variant="ghost" size="sm" icon={<ChevronRight size={16} />} onClick={nextMonth} />
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-[11px] font-semibold text-ink-400 uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  )
}
