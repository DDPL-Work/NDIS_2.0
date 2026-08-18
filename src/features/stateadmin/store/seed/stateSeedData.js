// ═══════════════════════════════════════════════════════════════════════════
// STATE ADMIN PANEL — SEED DATA RESIDUE (REMOVED IN BACKEND INTEGRATION)
// ═══════════════════════════════════════════════════════════════════════════
// All fabricated government records (budgets, sanctions, officers, orders,
// projects, users, financial profiles) have been REMOVED — they were demo
// placeholders, not actual records, and are forbidden by the backend
// integration (backend_next_guide §21–§22, §29–§31).
//
// The state stores now hydrate exclusively from the live backend APIs
// (state-budgets, department-budgets, district-allocations, schemes,
// financial-ledger, users, departments, proposals, projects).
//
// This module keeps only configuration-derived values that other modules
// import — nothing here is data.
import { DEFAULT_AUTHORITY_MATRIX, BUDGET_HEADS } from '../../../../config/stateConstants'
import { DEFAULT_WORKFLOWS } from '../../services/approvalService'

export const cr = (n) => Math.round(n * 10000000)
export const lac = (n) => Math.round(n * 100000)

// Districts structural master — id/code/name/division are geographic
// configuration (no backend district endpoint is documented). Officer names
// were fabricated and are removed.
export const SEED_DISTRICTS = [
  { id: 'nalanda', code: 'NAL', name: 'Nalanda', division: 'Patna Division', status: 'active', gisBoundary: 'boundary-nalanda.geojson', center: [85.4434, 25.1372] },
  { id: 'patna', code: 'PAT', name: 'Patna', division: 'Patna Division', status: 'active', gisBoundary: 'boundary-patna.geojson', center: [85.0984, 25.6042] },
  { id: 'gaya', code: 'GYA', name: 'Gaya', division: 'Magadh Division', status: 'active', gisBoundary: 'boundary-gaya.geojson', center: [84.9981, 24.7955] },
  { id: 'muzaffarpur', code: 'MFP', name: 'Muzaffarpur', division: 'Tirhut Division', status: 'active', gisBoundary: 'boundary-muzaffarpur.geojson', center: [85.4133, 26.1225] },
  { id: 'bhagalpur', code: 'BGP', name: 'Bhagalpur', division: 'Bhagalpur Division', status: 'active', gisBoundary: 'boundary-bhagalpur.geojson', center: [86.9770, 25.2510] },
  { id: 'darbhanga', code: 'DBG', name: 'Darbhanga', division: 'Darbhanga Division', status: 'active', gisBoundary: 'boundary-darbhanga.geojson', center: [85.8973, 26.1542] },
  { id: 'begusarai', code: 'BGS', name: 'Begusarai', division: 'Munger Division', status: 'active', gisBoundary: 'boundary-begusarai.geojson', center: [86.1380, 25.4135] },
  { id: 'sitamarhi', code: 'STM', name: 'Sitamarhi', division: 'Tirhut Division', status: 'active', gisBoundary: 'boundary-sitamarhi.geojson', center: [85.4840, 26.6050] },
  { id: 'madhubani', code: 'MDB', name: 'Madhubani', division: 'Darbhanga Division', status: 'active', gisBoundary: 'boundary-madhubani.geojson', center: [86.0644, 26.3529] },
  { id: 'vaishali', code: 'VSL', name: 'Vaishali', division: 'Tirhut Division', status: 'active', gisBoundary: 'boundary-vaishali.geojson', center: [85.3370, 26.9875] },
]

export const SEED_DISTRICTS_BY_ID = Object.fromEntries(SEED_DISTRICTS.map((d) => [d.id, d]))

// Backend-hydrated collections — empty until the stores load the live APIs.
export const SEED_DEPARTMENTS = []
export const SEED_DEPARTMENTS_BY_ID = {}
export const SEED_SCHEMES = []
export const SEED_SCHEMES_BY_ID = {}
export const SEED_SCHEME_CATEGORIES = []
export const SEED_USERS = []
export const SEED_PROJECTS = []
export const SEED_PROPOSALS = []
export const SEED_GOVERNMENT_ORDERS = []
export const SEED_DOLOCS = []
export const SEED_FINANCIAL_PROFILE = {}
export const SEED_DISTRICT_ALLOCATIONS = {}

export function buildStateBudget() { throw new Error('Seed budgets are no longer generated — the state finance store hydrates from the backend.') }
export function buildDepartmentBudgets() { throw new Error('Seed budgets are no longer generated — the state finance store hydrates from the backend.') }
export function buildAllocations() { throw new Error('Seed allocations are no longer generated — the state finance store hydrates from the backend.') }
export function buildFinancialChains() { throw new Error('Seed financial chains are no longer generated — the state finance store hydrates from the backend.') }
export function buildLedger() { throw new Error('Seed ledger entries are no longer generated — the state finance store hydrates from the backend.') }
export function buildAuditTrail() { throw new Error('Seed audit entries are no longer generated — the state finance store hydrates from the backend.') }
export function buildReappropriationSeed() { throw new Error('Seed re-appropriations are no longer generated — the state finance store hydrates from the backend.') }
export function buildPendingApprovals() { throw new Error('Seed approvals are no longer generated — the state finance store hydrates from the backend.') }

export const SEED_AUTHORITY_MATRIX = DEFAULT_AUTHORITY_MATRIX
export const SEED_WORKFLOWS = DEFAULT_WORKFLOWS
export const SEED_BUDGET_HEADS = BUDGET_HEADS

// FY 2025-26 comparison dataset — no previous-year API is documented, so the
// year-over-year chart renders from zero until the backend exposes the data.
export const PREVIOUS_YEAR = {
  fy: '2025-26',
  authorizedByDept: {},
  sanctionedByDept: {},
  releasedByDept: {},
  utilizedByDept: {},
}
