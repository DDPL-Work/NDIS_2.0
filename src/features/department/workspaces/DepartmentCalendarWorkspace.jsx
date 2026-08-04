import { useState, useMemo } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, Info, Bell } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'

export default function DepartmentCalendarWorkspace() {
  const { dept, inspections, workOrders } = useDepartment()
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear] = useState(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  // Compile calendar events from inspections and work orders
  const events = useMemo(() => {
    const list = []
    inspections.forEach(ins => {
      if (ins.date) {
        const parts = ins.date.split('-')
        list.push({
          day: Number(parts[2]),
          month: Number(parts[1]) - 1,
          type: 'inspection',
          title: `Audit: ${ins.title}`,
          status: ins.status,
          meta: ins
        })
      }
    })
    workOrders.forEach(wo => {
      if (wo.deadline) {
        const parts = wo.deadline.split('-')
        list.push({
          day: Number(parts[2]),
          month: Number(parts[1]) - 1,
          type: 'deadline',
          title: `Deadline: ${wo.title}`,
          status: wo.state,
          meta: wo
        })
      }
    })
    return list
  }, [inspections, workOrders])

  // Get active day events
  const selectedDayEvents = useMemo(() => {
    return events.filter(e => e.day === selectedDay && e.month === currentMonth)
  }, [events, selectedDay, currentMonth])

  // Generate calendar days grid (standard month grid)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()

  const calendarGrid = useMemo(() => {
    const cells = []
    // Add empty padding cells for starting offset
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ pad: true })
    }
    // Add day numbers
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEvents = events.filter(e => e.day === d && e.month === currentMonth)
      cells.push({
        dayNum: d,
        events: dayEvents,
        isToday: d === new Date().getDate() && currentMonth === new Date().getMonth()
      })
    }
    return cells
  }, [daysInMonth, firstDayIndex, events, currentMonth, currentYear])

  function handleMonthChange(dir) {
    if (dir === 'prev') {
      setCurrentMonth(prev => (prev === 0 ? 11 : prev - 1))
    } else {
      setCurrentMonth(prev => (prev === 11 ? 0 : prev + 1))
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow={`Operational Schedule · ${dept.code}`}
        title={`${dept.label} Calendar`}
        description="Plan field audits, track construction milestones, monitor work order deadlines, and coordinate schedules."
      />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title={`${months[currentMonth]} ${currentYear}`}
              icon={Calendar}
              action={
                <div className="flex gap-1">
                  <Button size="xs" variant="outline" onClick={() => handleMonthChange('prev')} icon={ChevronLeft} />
                  <Button size="xs" variant="outline" onClick={() => handleMonthChange('next')} icon={ChevronRight} />
                </div>
              }
            />
            <CardBody className="p-3">
              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-ink-400 mb-2">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => <span key={day} className="py-1">{day}</span>)}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-[12.5px]">
                {calendarGrid.map((cell, idx) => {
                  if (cell.pad) return <div key={`pad-${idx}`} className="h-16 bg-ink-50/20 rounded-lg" />
                  
                  const isSelected = cell.dayNum === selectedDay
                  return (
                    <button
                      key={`day-${cell.dayNum}`}
                      onClick={() => setSelectedDay(cell.dayNum)}
                      className={`h-16 p-1.5 rounded-lg border text-left flex flex-col justify-between transition-colors ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/30'
                          : cell.isToday
                          ? 'border-leaf-500 bg-leaf-50/30 font-bold'
                          : 'border-ink-100 hover:bg-ink-50/50'
                      }`}
                    >
                      <span className="font-semibold text-ink-800">{cell.dayNum}</span>
                      {cell.events.length > 0 && (
                        <div className="flex gap-0.5 mt-1 overflow-hidden">
                          {cell.events.map((e, eIdx) => (
                            <span
                              key={eIdx}
                              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                e.type === 'inspection' ? 'bg-sky-500' : 'bg-saffron-500'
                              }`}
                              title={e.title}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title={`Schedule: Day ${selectedDay} ${months[currentMonth]}`} icon={Clock} />
            <CardBody className="space-y-3 max-h-[350px] overflow-y-auto">
              {selectedDayEvents.length === 0 ? (
                <p className="text-[12px] text-ink-400 text-center py-6">No scheduled operations or deadlines for this date.</p>
              ) : (
                selectedDayEvents.map((e, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-ink-100 space-y-2 text-[12px]">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-ink-950">{e.title}</span>
                      <Badge tone={e.type === 'inspection' ? 'info' : 'warning'}>{e.type.toUpperCase()}</Badge>
                    </div>
                    {e.type === 'inspection' && (
                      <p className="text-ink-600">Assigned inspector: <span className="font-semibold">{e.meta.inspector}</span></p>
                    )}
                    {e.type === 'deadline' && (
                      <p className="text-ink-600">Task assignee: <span className="font-semibold">{e.meta.assignedEngineer?.name}</span></p>
                    )}
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Calendar Legend & Guide" icon={Info} />
            <CardBody className="text-[11.5px] space-y-2.5 text-ink-600">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0" />
                <span>Scheduled Quality Inspection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-saffron-500 shrink-0" />
                <span>Work Order Completion Deadline</span>
              </div>
              <p className="leading-snug mt-2">
                To reschedule, navigate to the respective Work Order or Inspection queue panel and update deadline properties.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
