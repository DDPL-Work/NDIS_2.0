import { Inbox, AlertTriangle, Sunrise, Calendar, Clock, ArrowRight } from 'lucide-react'
import { EmptyState } from '../../../components/ui/PageStates'
import TaskCard from './components/TaskCard'

function SectionHeader({ icon: Icon, title, count, color = 'text-ink-700' }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} className={color} />
      <h3 className={`text-[12.5px] font-semibold uppercase tracking-wide ${color}`}>{title}</h3>
      {count > 0 && (
        <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">{count}</span>
      )}
    </div>
  )
}

export default function TaskList({ tasks, groups, onSelectTask, onEdit, onOpenFacility }) {
  if (!tasks.length) {
    return (
      <EmptyState
        icon={Inbox}
        title="No tasks require your attention"
        description="You have no overdue or high-priority actions. Check back later or adjust your filters."
      />
    )
  }

  // If groups are not provided, render flat list
  if (!groups) {
    return (
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={onSelectTask}
            onEdit={onEdit}
            onOpenFacility={onOpenFacility}
          />
        ))}
      </div>
    )
  }

  const { attention, todayTasks, tomorrow, thisWeek, later, noDate } = groups

  return (
    <div className="space-y-6">
      {/* Needs Your Attention */}
      {attention.length > 0 && (
        <div>
          <SectionHeader icon={AlertTriangle} title="Needs Your Attention" count={attention.length} color="text-alert-600" />
          <div className="space-y-2">
            {attention.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onSelectTask}
                onEdit={onEdit}
                onOpenFacility={onOpenFacility}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today */}
      {todayTasks.length > 0 && (
        <div>
          <SectionHeader icon={Sunrise} title="Today" count={todayTasks.length} color="text-saffron-600" />
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onSelectTask}
                onEdit={onEdit}
                onOpenFacility={onOpenFacility}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tomorrow */}
      {tomorrow.length > 0 && (
        <div>
          <SectionHeader icon={Calendar} title="Tomorrow" count={tomorrow.length} color="text-sky-600" />
          <div className="space-y-2">
            {tomorrow.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onSelectTask}
                onEdit={onEdit}
                onOpenFacility={onOpenFacility}
              />
            ))}
          </div>
        </div>
      )}

      {/* This Week */}
      {thisWeek.length > 0 && (
        <div>
          <SectionHeader icon={Clock} title="This Week" count={thisWeek.length} color="text-ink-600" />
          <div className="space-y-2">
            {thisWeek.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onSelectTask}
                onEdit={onEdit}
                onOpenFacility={onOpenFacility}
              />
            ))}
          </div>
        </div>
      )}

      {/* Later */}
      {later.length > 0 && (
        <div>
          <SectionHeader icon={ArrowRight} title="Later" count={later.length} color="text-ink-500" />
          <div className="space-y-2">
            {later.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onSelectTask}
                onEdit={onEdit}
                onOpenFacility={onOpenFacility}
              />
            ))}
          </div>
        </div>
      )}

      {/* No due date */}
      {noDate.length > 0 && (
        <div>
          <SectionHeader icon={Calendar} title="No Due Date" count={noDate.length} color="text-ink-400" />
          <div className="space-y-2">
            {noDate.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onSelectTask}
                onEdit={onEdit}
                onOpenFacility={onOpenFacility}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
