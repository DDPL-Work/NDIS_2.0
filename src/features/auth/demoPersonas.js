// Demo personas — offline entry for the mock-data build (no backend required).
// The real production flow remains username/password via the government SSO
// bound backend; demo access is a developer/showcase convenience only.
import { ROLES } from '../../config/constants'
import { STATE_PERMISSIONS, STATE_ROLE_PERMISSIONS } from '../../config/stateConstants'

const allStatePermissions = Object.keys(STATE_PERMISSIONS)

export const DEMO_PERSONAS = [
  {
    id: 'demo-state-finance',
    label: 'State Finance Admin',
    portal: 'state',
    icon: 'Landmark',
    user: {
      id: 'DEMO-U-001',
      username: 'demo.statefinance',
      name: 'State Finance Administrator (Demo)',
      role: ROLES.STATE_FINANCE_ADMIN,
      roleCode: ROLES.STATE_FINANCE_ADMIN,
      roleName: 'State Finance Admin',
      designation: 'Finance (Budget & Accounts) — Demo',
      departmentId: null,
      permissions: STATE_ROLE_PERMISSIONS[ROLES.STATE_FINANCE_ADMIN],
    },
  },
  {
    id: 'demo-state-admin',
    label: 'State Admin',
    portal: 'state',
    icon: 'Scale',
    user: {
      id: 'DEMO-U-002',
      username: 'demo.stateadmin',
      name: 'State Administrator (Demo)',
      role: ROLES.STATE_ADMIN,
      roleCode: ROLES.STATE_ADMIN,
      roleName: 'State Admin',
      designation: 'State Administration — Demo',
      departmentId: null,
      permissions: allStatePermissions,
    },
  },
  {
    id: 'demo-state-dept',
    label: 'Dept Admin (Health)',
    portal: 'state',
    icon: 'Building2',
    user: {
      id: 'DEMO-U-003',
      username: 'demo.deptadmin',
      name: 'Health Department Administrator (Demo)',
      role: ROLES.STATE_DEPT_ADMIN,
      roleCode: ROLES.STATE_DEPT_ADMIN,
      roleName: 'State Department Admin',
      designation: 'Department Admin — HFW (Demo)',
      departmentId: 'health',
      permissions: STATE_ROLE_PERMISSIONS[ROLES.STATE_DEPT_ADMIN],
    },
  },
  {
    id: 'demo-state-monitor',
    label: 'Monitoring Officer',
    portal: 'state',
    icon: 'Activity',
    user: {
      id: 'DEMO-U-004',
      username: 'demo.monitoring',
      name: 'State Monitoring Officer (Demo)',
      role: ROLES.STATE_MONITORING_OFFICER,
      roleCode: ROLES.STATE_MONITORING_OFFICER,
      roleName: 'State Monitoring Officer',
      designation: 'Monitoring & Evaluation — Demo',
      departmentId: null,
      permissions: STATE_ROLE_PERMISSIONS[ROLES.STATE_MONITORING_OFFICER],
    },
  },
  {
    id: 'demo-dm',
    label: 'DM (Nalanda)',
    portal: 'dm',
    icon: 'Gavel',
    user: {
      id: 'DEMO-U-005',
      username: 'demo.dm',
      name: 'District Magistrate, Nalanda (Demo)',
      role: ROLES.DM,
      roleCode: ROLES.DM,
      roleName: 'District Magistrate (DM)',
      designation: 'District Magistrate — Nalanda (Demo)',
      departmentId: null,
      districtId: 'nalanda',
      permissions: ['ALL_READ', 'ALL_WRITE'],
    },
  },
  {
    id: 'demo-dept-head',
    label: 'Dept Head (Health)',
    portal: 'linedept',
    icon: 'HeartPulse',
    user: {
      id: 'DEMO-U-006',
      username: 'demo.depthead',
      name: 'Department Head, Health (Demo)',
      role: ROLES.DEPT_HEAD,
      roleCode: ROLES.DEPT_HEAD,
      roleName: 'Department Head',
      designation: 'Head of Department — HFW (Demo)',
      departmentId: 'health',
      departmentName: 'Health & Family Welfare',
      permissions: ['ALL_READ', 'ALL_WRITE'],
    },
  },
]

export const DEMO_PERSONAS_BY_ID = Object.fromEntries(DEMO_PERSONAS.map((p) => [p.id, p]))