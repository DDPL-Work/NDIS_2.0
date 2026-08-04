import { makeRng, randInt } from '../../utils/random'
import { DEPARTMENTS } from '../../config/constants'

const FIRST = ['Anil', 'Sunita', 'Ravi', 'Priya', 'Manoj', 'Neha', 'Sanjay', 'Kavita', 'Deepak', 'Ritu', 'Ashok', 'Meera']
const LAST = ['Kumar', 'Singh', 'Sharma', 'Verma', 'Prasad', 'Choudhary', 'Jha', 'Mishra']

function buildName(rng) {
  return `${FIRST[randInt(rng, 0, FIRST.length - 1)]} ${LAST[randInt(rng, 0, LAST.length - 1)]}`
}

let _cache = null

export function getUserDirectory() {
  if (_cache) return _cache
  const rng = makeRng('user-directory')
  const users = [
    { id: 'u-dm', name: 'Dr. Ashok Kumar Sinha', role: 'dm', title: 'District Collector & Magistrate, Nalanda' },
    { id: 'u-adm', name: buildName(rng), role: 'adm', title: 'Additional District Magistrate, Nalanda' },
    { id: 'u-state', name: buildName(rng), role: 'state_admin', title: 'State Admin, Bihar' },
  ]
  DEPARTMENTS.forEach((dept) => {
    users.push({ id: `u-officer-${dept.id}`, name: buildName(rng), role: 'dept_officer', departmentId: dept.id, title: `${dept.label} Officer` })
    for (let i = 0; i < 4; i++) {
      users.push({ id: `u-fe-${dept.id}-${i}`, name: buildName(rng), role: 'field_engineer', departmentId: dept.id, title: `Field Engineer, ${dept.label}` })
    }
  })
  _cache = users
  return users
}

export function getFieldEngineers(departmentId) {
  return getUserDirectory().filter((u) => u.role === 'field_engineer' && u.departmentId === departmentId)
}

export function getOfficerFor(departmentId) {
  return getUserDirectory().find((u) => u.role === 'dept_officer' && u.departmentId === departmentId)
}
