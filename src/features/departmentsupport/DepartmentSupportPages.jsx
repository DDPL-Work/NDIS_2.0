// Route wrappers for the shared Department Decision Support workspace.
//  - Admin:  /admin/department/:departmentId — district-wide view with
//    department switcher (DM / ADM / Collector / State Admin).
//  - Linedept: /linedept/decision-support — the session's OWN department.
// Both render the SAME component; only the data scope differs.
import { useParams, useNavigate } from 'react-router-dom'
import { useDepartment } from '../department/framework/DepartmentContext'
import DepartmentDecisionWorkspace from './DepartmentDecisionWorkspace'

export function AdminDepartmentSupport() {
  const { departmentId } = useParams()
  const navigate = useNavigate()
  return (
    <DepartmentDecisionWorkspace
      departmentId={departmentId || 'general'}
      adminView
      onOpenWorkflow={(action, entity, config) => navigate(`/admin/department/${departmentId || 'general'}?action=${action}&entity=${encodeURIComponent(entity?.id || '')}`)}
      onOpenSpatial={() => navigate(`/admin/spatial-analysis?department=${encodeURIComponent(departmentId || 'general')}`)}
    />
  )
}

export function LinedeptDepartmentSupport() {
  const { dept } = useDepartment()
  const navigate = useNavigate()
  return (
    <DepartmentDecisionWorkspace
      departmentId={dept || 'general'}
      onOpenWorkflow={() => navigate('/linedept/planning/new')}
    />
  )
}