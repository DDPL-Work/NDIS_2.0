import PageHeader from '../../../components/ui/PageHeader'
import DepartmentDashboardBuilder from '../framework/DepartmentDashboardBuilder'
import { useDepartment } from '../framework/DepartmentContext'

export default function DepartmentDashboardWorkspace() {
  const { dept } = useDepartment()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Enterprise Framework · ${dept.code}`}
        title={`${dept.label} Operations Workspace`}
        description={dept.tagline}
      />
      <div className="px-6">
        <DepartmentDashboardBuilder />
      </div>
    </div>
  )
}
