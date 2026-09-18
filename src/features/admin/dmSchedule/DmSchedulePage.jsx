import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Tabs from '../../../components/ui/Tabs'
import Button from '../../../components/ui/Button'
import { useScheduleTasks, useFilteredTasks } from './hooks/useScheduleTasks'
import { useAuthStore } from '../../../app/store/authStore'
import ScheduleHeader from './ScheduleHeader'
import TaskFilters from './TaskFilters'
import TaskList from './TaskList'
import TaskCalendar from './TaskCalendar'
import TaskDetailPanel from './TaskDetailPanel'
import EditTaskModal from './EditTaskModal'
import { KpiSkeleton, TaskCardSkeleton } from './components/SkeletonLoaders'
import { VIEW_MODES, FILTER_PRESETS } from './constants'

export default function DmSchedulePage() {
  const districtName = useAuthStore((s) => s.user?.districtName)
  const [searchParams, setSearchParams] = useSearchParams()

  const { tasks: allTasks, kpis, loading, isFetching, error, refetch } = useScheduleTasks()

  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST)
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)

  // Filters
  const [filterPreset, setFilterPreset] = useState(FILTER_PRESETS.ALL)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const tasks = useFilteredTasks(allTasks, { filterPreset, typeFilter, statusFilter, priorityFilter, searchQuery })

  // Deep linking — open task from query param
  useEffect(() => {
    const taskParam = searchParams.get('task')
    if (taskParam && allTasks.length > 0) {
      const match = allTasks.find((t) => t.taskIdentity === taskParam)
      if (match) setSelectedTask(match)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, allTasks, setSearchParams])

  const handleSelectTask = useCallback((task) => setSelectedTask(task), [])
  const handleEditTask = useCallback((task) => { setEditingTask(task); setSelectedTask(null) }, [])
  const handleSaveTask = useCallback(() => setEditingTask(null), [])
  const handleOpenFacility = useCallback((task) => {
    if (task.facilityName) {
      window.location.href = `/admin/facilities/${task.facilityName}`
    }
  }, [])

  const resetFilters = useCallback(() => {
    setFilterPreset(FILTER_PRESETS.ALL)
    setTypeFilter('all')
    setStatusFilter('all')
    setPriorityFilter('all')
    setSearchQuery('')
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ScheduleHeader kpis={kpis} onRefresh={refetch} loading={isFetching} districtName={districtName} />

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Tabs
            tabs={[
              { value: VIEW_MODES.LIST, label: 'List' },
              { value: VIEW_MODES.CALENDAR, label: 'Calendar' },
            ]}
            active={viewMode}
            onChange={setViewMode}
          />
          {isFetching && !loading && (
            <div className="flex items-center gap-2 text-[12.5px] text-ink-500">
              <Loader2 size={13} className="animate-spin" />
              Refreshing...
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-[12.5px] text-ink-500">
              <Loader2 size={13} className="animate-spin" />
              Loading...
            </div>
          )}
        </div>

        <TaskFilters
          filterPreset={filterPreset}
          setFilterPreset={setFilterPreset}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onReset={resetFilters}
        />

        <div className="text-[12.5px] text-ink-500">
          {tasks.length === allTasks.length
            ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`
            : `${tasks.length} of ${allTasks.length} task${allTasks.length !== 1 ? 's' : ''}`}
        </div>

        {error && (
          <div className="rounded-lg border border-alert-200 bg-alert-50 p-4 text-[13px] text-alert-700">
            Unable to load your schedule: {error.message || 'An error occurred'}
            <Button variant="ghost" size="sm" onClick={refetch} className="ml-2">Try again</Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <KpiSkeleton />
            {Array.from({ length: 4 }).map((_, i) => <TaskCardSkeleton key={i} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-lg border border-ink-100 bg-white p-12 text-center">
            <p className="text-[14px] font-medium text-ink-600">
              {allTasks.length === 0
                ? 'No tasks have been created yet.'
                : 'No tasks match your filters.'}
            </p>
            {allTasks.length > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="mt-2">Clear filters</Button>
            )}
          </div>
        ) : viewMode === VIEW_MODES.LIST ? (
          <TaskList
            tasks={tasks}
            onSelectTask={handleSelectTask}
            onEdit={handleEditTask}
            onOpenFacility={handleOpenFacility}
          />
        ) : (
          <TaskCalendar tasks={tasks} onSelectTask={handleSelectTask} />
        )}
      </div>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={handleEditTask}
          onOpenFacility={handleOpenFacility}
          onRefresh={refetch}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
        />
      )}
    </div>
  )
}
