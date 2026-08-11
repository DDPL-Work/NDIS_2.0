// ═══════════════════════════════════════════════════════════════════════════
// STATE ADMIN PANEL — DEMO / SEED DATA (FY 2026-27)
// ═══════════════════════════════════════════════════════════════════════════
// EVERYTHING in this file is TEST/SEED data for UI demonstration only.
// - Department structures, officer names, order numbers and amounts are
//   fictional placeholders — NOT actual government records, people or limits.
// - Amounts are internally consistent: released ≤ sanctioned ≤ authorized
//   ≤ provision, committed ≤ released, utilized ≤ committed.
// ═══════════════════════════════════════════════════════════════════════════
import { DEFAULT_AUTHORITY_MATRIX, BUDGET_HEADS, DEFAULT_FINANCIAL_YEAR } from '../../../../config/stateConstants'
import { DEFAULT_WORKFLOWS } from '../../services/approvalService'
import { sha } from '../../services/hashUtil'

export const cr = (n) => Math.round(n * 10000000)
export const lac = (n) => Math.round(n * 100000)

// ── Districts (fictional names; codes follow Bihar division conventions) ────
export const SEED_DISTRICTS = [
  { id: 'nalanda', code: 'NAL', name: 'Nalanda', division: 'Patna Division', dm: 'Dr. R. S. Pandey (IAS)', adm: 'Smt. Meera Sinha (IAS)', dfo: 'Sri Anant Jha', dpo: 'Sri Prakash Ranjan', status: 'active', gisBoundary: 'boundary-nalanda.geojson', center: [85.4434, 25.1372] },
  { id: 'patna', code: 'PAT', name: 'Patna', division: 'Patna Division', dm: 'Sri Shailesh Verma (IAS)', adm: 'Smt. Ritu Kumari (IAS)', dfo: 'Sri Chandan Das', dpo: 'Sri Arun Kumar', status: 'active', gisBoundary: 'boundary-patna.geojson', center: [85.0984, 25.6042] },
  { id: 'gaya', code: 'GYA', name: 'Gaya', division: 'Magadh Division', dm: 'Smt. Preeti Choudhary (IAS)', adm: 'Sri Vikas Tiwary (IAS)', dfo: 'Sri Rajendra Prasad', dpo: 'Sri Mohan Lal', status: 'active', gisBoundary: 'boundary-gaya.geojson', center: [84.9981, 24.7955] },
  { id: 'muzaffarpur', code: 'MFP', name: 'Muzaffarpur', division: 'Tirhut Division', dm: 'Sri Manoj Ranjan (IAS)', adm: 'Sri K. K. Verma', dfo: 'Sri S. P. Singh', dpo: 'Sri Umesh Chandra', status: 'active', gisBoundary: 'boundary-muzaffarpur.geojson', center: [85.4133, 26.1225] },
  { id: 'bhagalpur', code: 'BGP', name: 'Bhagalpur', division: 'Bhagalpur Division', dm: 'Smt. Kavita Devi (IAS)', adm: 'Sri B. N. Jha', dfo: 'Sri P. K. Ghosh', dpo: 'Sri D. N. Yadav', status: 'active', gisBoundary: 'boundary-bhagalpur.geojson', center: [86.9770, 25.2510] },
  { id: 'darbhanga', code: 'DBG', name: 'Darbhanga', division: 'Darbhanga Division', dm: 'Sri Surya Prakash (IAS)', adm: 'Sri A. K. Mandal', dfo: 'Sri G. M. Khan', dpo: 'Sri R. K. Sinha', status: 'active', gisBoundary: 'boundary-darbhanga.geojson', center: [85.8973, 26.1542] },
  { id: 'begusarai', code: 'BGS', name: 'Begusarai', division: 'Munger Division', dm: 'Sri Rameshwar Prasad (IAS)', adm: 'Smt. S. Kumari', dfo: 'Sri A. N. Thakur', dpo: 'Sri K. P. Sharma', status: 'active', gisBoundary: 'boundary-begusarai.geojson', center: [86.1380, 25.4135] },
  { id: 'sitamarhi', code: 'STM', name: 'Sitamarhi', division: 'Tirhut Division', dm: 'Smt. Archana Singh (IAS)', adm: 'Sri M. K. Ranjan', dfo: 'Sri R. P. Gupta', dpo: 'Sri S. N. Mishra', status: 'active', gisBoundary: 'boundary-sitamarhi.geojson', center: [85.4840, 26.6050] },
  { id: 'madhubani', code: 'MDB', name: 'Madhubani', division: 'Darbhanga Division', dm: 'Sri Devendra Nath (IAS)', adm: 'Sri B. K. Singh', dfo: 'Sri L. N. Jha', dpo: 'Sri S. K. Rai', status: 'active', gisBoundary: 'boundary-madhubani.geojson', center: [86.0644, 26.3529] },
  { id: 'vaishali', code: 'VSL', name: 'Vaishali', division: 'Tirhut Division', dm: 'Sri Binod Kumar (IAS)', adm: 'Sri A. K. Singh', dfo: 'Sri V. N. Sharma', dpo: 'Sri R. K. Prasad', status: 'active', gisBoundary: 'boundary-vaishali.geojson', center: [85.3370, 25.9875] },
]

export const SEED_DISTRICTS_BY_ID = Object.fromEntries(SEED_DISTRICTS.map((d) => [d.id, d]))

// ── Departments master (extends src/config/constants.js DEPARTMENTS) ───────
export const SEED_DEPARTMENTS = [
  { id: 'health', code: 'HFW', name: 'Health & Family Welfare', type: 'major', parentId: null, head: 'Dr. N. K. Roy (Director Health Services)', contact: 'director@hfw.bihar.gov.in', phone: '+91-612-2200001', status: 'active', logo: null, address: 'Vikas Bhawan, Patna', hierarchy: ['Directorate', 'District Civil Surgeon Office', 'Block PHC', 'Sub-Centre'] },
  { id: 'education', code: 'EDU', name: 'School Education', type: 'major', parentId: null, head: 'Smt. S. K. Jha (Director Secondary Education)', contact: 'dir-secy@edu.bihar.gov.in', phone: '+91-612-2200002', status: 'active', logo: null, address: 'Vikas Bhawan, Patna', hierarchy: ['Directorate', 'District Education Office', 'Block Education Office', 'School'] },
  { id: 'pwd', code: 'PWD', name: 'Public Works Department', type: 'major', parentId: null, head: 'Sri A. K. Sinha (Engineer-in-Chief)', contact: 'eic@pwd.bihar.gov.in', phone: '+91-612-2200003', status: 'active', logo: null, address: 'Vikas Bhawan, Patna', hierarchy: ['Engineer-in-Chief Office', 'Circle Office', 'Division Office', 'Sub-Division'] },
  { id: 'electricity', code: 'BSEB', name: 'Electricity Board', type: 'corporation', parentId: null, head: 'Sri R. N. Verma (CMD, BSEB)', contact: 'cmd@bseb.bihar.gov.in', phone: '+91-612-2200004', status: 'active', logo: null, address: 'Vidyut Bhawan, Patna', hierarchy: ['Head Office', 'Zonal Office', 'Circle', 'Operation Division'] },
  { id: 'urban', code: 'ULB', name: 'Urban Local Body / Sanitation', type: 'department', parentId: null, head: 'Sri M. P. Sharma (Director UDD)', contact: 'dir-udd@bihar.gov.in', phone: '+91-612-2200005', status: 'active', logo: null, address: 'Vikas Bhawan, Patna', hierarchy: ['Directorate', 'Municipal Commissioner', 'Ward Office'] },
  { id: 'solar', code: 'BREDA', name: 'Solar & Renewable Energy', type: 'agency', parentId: null, head: 'Sri H. K. Sharan (Director BREDA)', contact: 'dir@breda.bihar.gov.in', phone: '+91-612-2200006', status: 'active', logo: null, address: 'Energy Bhawan, Patna', hierarchy: ['Directorate', 'Regional Office', 'District Cell'] },
  { id: 'tourism', code: 'TOU', name: 'Tourism & Heritage Development', type: 'department', parentId: null, head: 'Smt. P. K. Das (Director Tourism)', contact: 'dir@tourism.bihar.gov.in', phone: '+91-612-2200007', status: 'active', logo: null, address: 'Government Tourist Complex, Patna', hierarchy: ['Directorate', 'Regional Tourism Office', 'Circuit Office'] },
  { id: 'water', code: 'PHED', name: 'Water & Sanitation (Jal Jeevan Mission)', type: 'major', parentId: null, head: 'Sri D. K. Mishra (CE PHED)', contact: 'ce@phed.bihar.gov.in', phone: '+91-612-2200008', status: 'active', logo: null, address: 'Vikas Bhawan, Patna', hierarchy: ['Engineer-in-Chief Office', 'Circle Office', 'PHED Division', 'Public Health Sub-Division'] },
]

export const SEED_DEPARTMENTS_BY_ID = Object.fromEntries(SEED_DEPARTMENTS.map((d) => [d.id, d]))

// ── Schemes ─────────────────────────────────────────────────────────────────
export const SEED_SCHEMES = [
  { id: 'SCH-AYUSH', code: 'AYU-2026', name: 'Ayushman Bharat (PM-JAY) State Continuation', departmentId: 'health', type: 'centrally_sponsored', fundingSource: 'centrally_sponsored', budgetHeadId: 'bh-continuing', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'Guidelines as per NHPM 2023 and state continuation order.', eligibility: 'All resident families as per SECC database.', targetDistrictIds: null },
  { id: 'SCH-NHM', code: 'NHM-2026', name: 'National Health Mission (State Share)', departmentId: 'health', type: 'centrally_sponsored', fundingSource: 'centrally_sponsored', budgetHeadId: 'bh-continuing', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'NHM implementation framework 2024-27.', eligibility: 'Public health facilities in all districts.', targetDistrictIds: null },
  { id: 'SCH-AROGYA', code: 'ARG-2026', name: 'Mukhyamantri Arogya Scheme', departmentId: 'health', type: 'state_scheme', fundingSource: 'state_budget', budgetHeadId: 'bh-new-schemes', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'State cabinet approval dated 20-01-2026.', eligibility: 'Below-poverty-line families.', targetDistrictIds: null },
  { id: 'SCH-SS', code: 'SS-2026', name: 'Samagra Shiksha Abhiyan', departmentId: 'education', type: 'centrally_sponsored', fundingSource: 'centrally_sponsored', budgetHeadId: 'bh-continuing', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'SSA framework 2021-26 extended.', eligibility: 'Government schools.', targetDistrictIds: null },
  { id: 'SCH-BVM', code: 'BVM-2026', name: 'Bihar Vikas Mission (Education)', departmentId: 'education', type: 'flagship', fundingSource: 'state_budget', budgetHeadId: 'bh-new-schemes', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'BVM charter.', eligibility: 'All districts.', targetDistrictIds: null },
  { id: 'SCH-PMGSY', code: 'PMGSY-2026', name: 'PMGSY Road Connectivity', departmentId: 'pwd', type: 'centrally_sponsored', fundingSource: 'centrally_sponsored', budgetHeadId: 'bh-infrastructure', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'PMGSY-III guidelines.', eligibility: 'Unconnected habitations > 500 population.', targetDistrictIds: null },
  { id: 'SCH-PWDHS', code: 'PWD-2026', name: 'State Highways Development Programme', departmentId: 'pwd', type: 'state_scheme', fundingSource: 'state_budget', budgetHeadId: 'bh-infrastructure', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'As per state roads policy 2022.', eligibility: 'State highway corridors.', targetDistrictIds: null },
  { id: 'SCH-FEEDER', code: 'RSE-2026', name: 'Rural Feeder Strengthening Scheme', departmentId: 'electricity', type: 'state_scheme', fundingSource: 'state_budget', budgetHeadId: 'bh-equipment', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'BSEB capital expenditure board approval.', eligibility: 'High-loss rural feeders.', targetDistrictIds: null },
  { id: 'SCH-SBM', code: 'SBM-2026', name: 'Swachh Bharat Mission 2.0 (Urban)', departmentId: 'urban', type: 'centrally_sponsored', fundingSource: 'centrally_sponsored', budgetHeadId: 'bh-grants', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'SBM-U 2.0 guidelines.', eligibility: 'Statutory towns and ULBs.', targetDistrictIds: null },
  { id: 'SCH-AMRUT', code: 'AMRUT-2026', name: 'AMRUT 2.0 (Urban Infrastructure)', departmentId: 'urban', type: 'centrally_sponsored', fundingSource: 'centrally_sponsored', budgetHeadId: 'bh-continuing', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'AMRUT 2.0 mission guidelines.', eligibility: 'Eligible ULBs.', targetDistrictIds: null },
  { id: 'SCH-SURYAGHAR', code: 'PSG-2026', name: 'PM Surya Ghar Muft Bijli Yojana', departmentId: 'solar', type: 'centrally_sponsored', fundingSource: 'centrally_sponsored', budgetHeadId: 'bh-solar', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'PM Surya Ghar scheme guidelines.', eligibility: 'Residential consumers.', targetDistrictIds: null },
  { id: 'SCH-BSOLAR', code: 'BRS-2026', name: 'Bihar Rooftop Solar Programme', departmentId: 'solar', type: 'state_scheme', fundingSource: 'state_budget', budgetHeadId: 'bh-solar', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'BREDA programme charter.', eligibility: 'Govt buildings, institutions, households.', targetDistrictIds: null },
  { id: 'SCH-SD', code: 'SD-2026', name: 'Swadesh Darshan (Circuit Development)', departmentId: 'tourism', type: 'centrally_sponsored', fundingSource: 'centrally_sponsored', budgetHeadId: 'bh-infrastructure', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'Swadesh Darshan 2.0 guidelines.', eligibility: 'Designated tourist circuits.', targetDistrictIds: ['nalanda', 'gaya', 'rajgir'] },
  { id: 'SCH-JJM', code: 'JJM-2026', name: 'Jal Jeevan Mission (Functionality)', departmentId: 'water', type: 'centrally_sponsored', fundingSource: 'centrally_sponsored', budgetHeadId: 'bh-infrastructure', fy: DEFAULT_FINANCIAL_YEAR, status: 'active', guidelines: 'JJM implementation guidelines 2026.', eligibility: 'Rural households (FHTC).', targetDistrictIds: null },
]

export const SEED_SCHEMES_BY_ID = Object.fromEntries(SEED_SCHEMES.map((s) => [s.id, s]))

// Scheme categories (for Scheme Categories screen)
export const SEED_SCHEME_CATEGORIES = [
  { id: 'cat-health', label: 'Health & Nutrition', departments: ['health'], schemes: ['SCH-AYUSH', 'SCH-NHM', 'SCH-AROGYA'] },
  { id: 'cat-education', label: 'Education & Literacy', departments: ['education'], schemes: ['SCH-SS', 'SCH-BVM'] },
  { id: 'cat-infrastructure', label: 'Infrastructure & Roads', departments: ['pwd'], schemes: ['SCH-PMGSY', 'SCH-PWDHS'] },
  { id: 'cat-energy', label: 'Energy & Power', departments: ['electricity', 'solar'], schemes: ['SCH-FEEDER', 'SCH-SURYAGHAR', 'SCH-BSOLAR'] },
  { id: 'cat-urban', label: 'Urban Development & Sanitation', departments: ['urban'], schemes: ['SCH-SBM', 'SCH-AMRUT'] },
  { id: 'cat-tourism', label: 'Tourism & Culture', departments: ['tourism'], schemes: ['SCH-SD'] },
  { id: 'cat-water', label: 'Water Supply & Sanitation', departments: ['water'], schemes: ['SCH-JJM'] },
]

// ── FY 2026-27 financial profile per department (crores) ────────────────────
// provisionOriginal: state budget provision before revision
// revision: +delta applied via supplementary budget (GO backed)
// authorized: final authorized amount (department budget)
// sanctioned / released / committed / utilized: recorded during the year
export const SEED_FINANCIAL_PROFILE = {
  health: { provisionOriginal: 460, revision: 120, authorized: 520, sanctioned: 490, released: 450, committed: 370, utilized: 330, headId: 'bh-infrastructure' },
  education: { provisionOriginal: 790, revision: 10, authorized: 780, sanctioned: 740, released: 680, committed: 560, utilized: 500, headId: 'bh-establishment' },
  pwd: { provisionOriginal: 1050, revision: 10, authorized: 1000, sanctioned: 950, released: 860, committed: 700, utilized: 620, headId: 'bh-infrastructure' },
  electricity: { provisionOriginal: 715, revision: 5, authorized: 700, sanctioned: 660, released: 600, committed: 500, utilized: 450, headId: 'bh-equipment' },
  urban: { provisionOriginal: 635, revision: 5, authorized: 620, sanctioned: 590, released: 550, committed: 460, utilized: 410, headId: 'bh-grants' },
  solar: { provisionOriginal: 485, revision: 30, authorized: 500, sanctioned: 470, released: 430, committed: 350, utilized: 310, headId: 'bh-solar' },
  tourism: { provisionOriginal: 355, revision: 20, authorized: 300, sanctioned: 280, released: 250, committed: 200, utilized: 180, headId: 'bh-infrastructure' },
  water: { provisionOriginal: 310, revision: 0, authorized: 180, sanctioned: 120, released: 80, committed: 60, utilized: 50, headId: 'bh-infrastructure' },
}

// District allocation split per department (crores) — sums ≤ authorized.
export const SEED_DISTRICT_ALLOCATIONS = {
  health: [['nalanda', 18], ['patna', 32], ['gaya', 22], ['muzaffarpur', 25], ['bhagalpur', 14], ['darbhanga', 16], ['begusarai', 12], ['sitamarhi', 10]],
  education: [['nalanda', 28], ['patna', 45], ['gaya', 30], ['muzaffarpur', 35], ['bhagalpur', 18], ['darbhanga', 20], ['begusarai', 15], ['sitamarhi', 12], ['madhubani', 14], ['vaishali', 10]],
  pwd: [['nalanda', 40], ['patna', 60], ['gaya', 42], ['muzaffarpur', 48], ['bhagalpur', 25], ['darbhanga', 30]],
  electricity: [['nalanda', 25], ['patna', 40], ['gaya', 20], ['muzaffarpur', 30]],
  urban: [['nalanda', 15], ['patna', 22], ['gaya', 14], ['muzaffarpur', 16]],
  solar: [['nalanda', 12], ['patna', 18], ['gaya', 10], ['muzaffarpur', 14]],
  tourism: [['nalanda', 10], ['patna', 12], ['gaya', 8]],
  water: [['nalanda', 5], ['patna', 7]],
}

// Programmatic splits for sanctions/releases/commitments/expenditures.
function splitAmount(total, parts) {
  if (parts <= 1) return [total]
  const base = Math.floor(total / parts)
  return Array.from({ length: parts }, (_, i) => (i === parts - 1 ? total - base * (parts - 1) : base))
}

function buildChain(deptId, profile, fy, schemeIds) {
  const sanctions = splitAmount(profile.sanctioned, 2).map((amount, i) => ({
    id: `SAN-${deptId.toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
    sanctionNo: `FS-${fy.replace('-', '')}-${deptId.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
    fy,
    departmentId: deptId,
    districtId: null,
    schemeId: schemeIds[i % schemeIds.length],
    budgetHeadId: profile.headId,
    projectId: null,
    description: `Financial sanction tranche ${i + 1} — ${SEED_DEPARTMENTS_BY_ID[deptId].name} FY ${fy}`,
    amount,
    authority: 'State Department (Delegated)',
    authorityRef: 'GO-AUTH-002',
    goNumber: `GO-FS-${fy.replace('-', '')}-${deptId.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
    status: 'approved',
    approvedBy: 'State Finance Admin',
    approvedAt: `2026-0${i + 4}-11T10:30:00Z`,
    createdBy: 'State Dept Admin',
    createdAt: `2026-0${i + 4}-10T09:00:00Z`,
    remarks: 'Seed record — part of FY 2026-27 annual sanction cycle.',
  }))

  const releases = []
  let releaseIdx = 0
  sanctions.forEach((sanction, sIdx) => {
    const share = Math.round((sanction.amount / profile.sanctioned) * profile.released)
    const parts = splitAmount(share, sIdx === 0 ? 2 : 1)
    parts.forEach((amount) => {
      releases.push({
        id: `REL-${deptId.toUpperCase()}-${String(releaseIdx + 1).padStart(2, '0')}`,
        releaseNo: `FR-${fy.replace('-', '')}-${deptId.toUpperCase()}-${String(releaseIdx + 1).padStart(3, '0')}`,
        sanctionId: sanction.id,
        fy,
        departmentId: deptId,
        districtId: null,
        schemeId: sanction.schemeId,
        budgetHeadId: sanction.budgetHeadId,
        amount,
        releaseDate: `2026-0${releaseIdx + 2}-15T11:00:00Z`,
        authority: 'State Finance Admin',
        goNumber: `GO-FR-${fy.replace('-', '')}-${deptId.toUpperCase()}-${String(releaseIdx + 1).padStart(3, '0')}`,
        documentId: null,
        status: 'approved',
        approvedBy: 'State Finance Admin',
        approvedAt: `2026-0${releaseIdx + 2}-14T10:00:00Z`,
        createdBy: 'State Dept Admin',
        createdAt: `2026-0${releaseIdx + 2}-13T09:00:00Z`,
        remarks: 'Seed record — tranche release against parent sanction.',
      })
      releaseIdx += 1
    })
  })

  const commitAmts = splitAmount(profile.committed, 2)
  const commitments = commitAmts.map((amount, i) => ({
    id: `COM-${deptId.toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
    releaseId: releases[i % releases.length]?.id || releases[0]?.id || null,
    fy,
    departmentId: deptId,
    districtId: null,
    projectId: null,
    amount,
    description: `Commitment ${i + 1} — works / supplies ordered in FY ${fy}`,
    createdBy: 'Department Officer',
    createdAt: `2026-0${i + 3}-20T12:00:00Z`,
  }))

  const expendAmts = splitAmount(profile.utilized, 2)
  const expenditures = expendAmts.map((amount, i) => ({
    id: `EXP-${deptId.toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
    commitmentId: commitments[i % commitments.length]?.id || null,
    releaseId: releases[i % releases.length]?.id || releases[0]?.id || null,
    fy,
    departmentId: deptId,
    districtId: null,
    projectId: null,
    amount,
    date: `2026-0${i + 5}-25T12:00:00Z`,
    voucherNo: `VCH-${fy.replace('-', '')}-${deptId.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
    description: `Expenditure ${i + 1} — utilisation against committed works`,
    createdBy: 'DDO / Finance User',
    createdAt: `2026-0${i + 5}-25T12:30:00Z`,
  }))

  return { sanctions, releases, commitments, expenditures }
}

// Build department budgets for the current FY with revision history.
export function buildDepartmentBudgets(fy) {
  return Object.entries(SEED_FINANCIAL_PROFILE).map(([deptId, profile]) => {
    const revised = deptId === 'health' || deptId === 'solar' || deptId === 'tourism'
    const goNumber = `GO-DB-${fy.replace('-', '')}-${deptId.toUpperCase()}`
    return {
      id: `DB-${fy.replace('-', '')}-${deptId.toUpperCase()}`,
      stateBudgetId: `SB-${fy.replace('-', '')}`,
      fy,
      departmentId: deptId,
      budgetHeadId: profile.headId,
      schemeId: null,
      provision: cr(profile.provisionOriginal),
      authorized: cr(profile.authorized),
      fundSource: 'state_budget',
      goNumber,
      goDate: '2026-03-28',
      effectiveDate: '2026-04-01',
      documentId: null,
      remarks: 'Seed record — annual department authorization.',
      status: 'active',
      createdBy: 'State Admin',
      createdAt: '2026-03-28T10:00:00Z',
      approvedBy: 'State Finance Admin',
      approvedAt: '2026-03-29T11:00:00Z',
      revisions: revised ? [{
        revisionNo: 'REV-1',
        delta: cr(profile.revision),
        reason: `Supplementary provision (+₹${profile.revision} Cr) — cabinet decision dated 15-06-2026.`,
        goNumber: `GO-SUP-${fy.replace('-', '')}-${deptId.toUpperCase()}`,
        date: '2026-06-18',
        createdBy: 'State Finance Admin',
      }] : [],
    }
  })
}

export function buildStateBudget(fy = DEFAULT_FINANCIAL_YEAR) {
  const original = Object.values(SEED_FINANCIAL_PROFILE).reduce((acc, p) => acc + cr(p.provisionOriginal), 0)
  const revisedDelta = Object.values(SEED_FINANCIAL_PROFILE).reduce((acc, p) => acc + cr(p.revision || 0), 0)
  return {
    id: `SB-${fy.replace('-', '')}`,
    fy,
    provisionOriginal: original,
    provisionCurrent: original + revisedDelta,
    documentId: 'DOC-SB-2026',
    status: 'approved',
    createdBy: 'State Finance Admin',
    createdAt: '2026-02-10T09:00:00Z',
    approvedBy: 'State Admin',
    approvedAt: '2026-02-14T10:00:00Z',
    revisions: [{
      revisionNo: 'RN-1',
      delta: revisedDelta,
      reason: 'Supplementary budget FY 2026-27 (approved 18-06-2026).',
      goNumber: 'GO-SUP-2026001',
      date: '2026-06-18',
      createdBy: 'State Finance Admin',
    }],
  }
}

export function buildAllocations(fy) {
  const allocations = []
  let idx = 0
  Object.entries(SEED_DISTRICT_ALLOCATIONS).forEach(([deptId, rows]) => {
    rows.forEach(([districtId, amountCr]) => {
      idx += 1
      allocations.push({
        id: `DA-${fy.replace('-', '')}-${deptId.toUpperCase()}-${String(idx).padStart(3, '0')}`,
        departmentBudgetId: `DB-${fy.replace('-', '')}-${deptId.toUpperCase()}`,
        fy,
        departmentId: deptId,
        districtId,
        budgetHeadId: SEED_FINANCIAL_PROFILE[deptId].headId,
        schemeId: null,
        amount: cr(amountCr),
        status: 'active',
        createdBy: 'State Admin',
        createdAt: `2026-04-${String((idx % 9) + 1).padStart(2, '0')}T10:00:00Z`,
        approvedBy: 'State Finance Admin',
        approvedAt: `2026-04-${String((idx % 9) + 2).padStart(2, '0')}T11:00:00Z`,
        goNumber: `GO-DA-${fy.replace('-', '')}-${String(idx).padStart(3, '0')}`,
        idempotencyKey: `ALLOC-${fy}-${deptId}-${districtId}`,
      })
    })
  })
  return allocations
}

export function buildFinancialChains(fy) {
  const chains = {}
  const schemeMatrix = {
    health: ['SCH-AYUSH', 'SCH-NHM'],
    education: ['SCH-SS', 'SCH-BVM'],
    pwd: ['SCH-PMGSY', 'SCH-PWDHS'],
    electricity: ['SCH-FEEDER'],
    urban: ['SCH-SBM', 'SCH-AMRUT'],
    solar: ['SCH-SURYAGHAR', 'SCH-BSOLAR'],
    tourism: ['SCH-SD'],
    water: ['SCH-JJM'],
  }
  Object.entries(SEED_FINANCIAL_PROFILE).forEach(([deptId, profile]) => {
    chains[deptId] = buildChain(deptId, profile, fy, schemeMatrix[deptId] || ['SCH-SS'])
  })
  return chains
}

// ── Government orders & documents ───────────────────────────────────────────
export const SEED_GOVERNMENT_ORDERS = [
  { id: 'GO-2026-0001', docId: 'DOC-GO-0001', type: 'state_budget', orderNumber: 'GO-SUP-2026001', orderDate: '2026-06-18', fy: DEFAULT_FINANCIAL_YEAR, departmentId: null, districtId: null, schemeId: null, amount: cr(200), issuedBy: 'Department of Finance, Government', effectiveDate: '2026-06-18', summary: 'Supplementary budget FY 2026-27 — revised state provision ₹5,000 Cr.', file: 'supplementary-budget-2026-27.pdf', verificationStatus: 'verified', digitalSignatureStatus: 'signed', version: 1, status: 'published' },
  { id: 'GO-2026-0002', docId: 'DOC-GO-0002', type: 'financial_sanction', orderNumber: 'GO-FS-2026-HEALTH-001', orderDate: '2026-04-10', fy: DEFAULT_FINANCIAL_YEAR, departmentId: 'health', districtId: null, schemeId: 'SCH-NHM', amount: cr(196), issuedBy: 'Health & Family Welfare Department', effectiveDate: '2026-04-10', summary: 'Financial sanction (tranche 1) — NHM state share ₹196 Cr.', file: 'fs-health-001.pdf', verificationStatus: 'verified', digitalSignatureStatus: 'signed', version: 1, status: 'published' },
  { id: 'GO-2026-0003', docId: 'DOC-GO-0003', type: 'administrative_approval', orderNumber: 'AA-PWD-2026-014', orderDate: '2026-04-05', fy: DEFAULT_FINANCIAL_YEAR, departmentId: 'pwd', districtId: 'nalanda', schemeId: 'SCH-PMGSY', amount: cr(40), issuedBy: 'Public Works Department', effectiveDate: '2026-04-05', summary: 'Administrative approval — Nalanda road connectivity works.', file: 'aa-pwd-014.pdf', verificationStatus: 'verified', digitalSignatureStatus: 'signed', version: 1, status: 'published' },
  { id: 'GO-2026-0004', docId: 'DOC-GO-0004', type: 'fund_release_order', orderNumber: 'GO-FR-2026-HEALTH-001', orderDate: '2026-02-12', fy: DEFAULT_FINANCIAL_YEAR, departmentId: 'health', districtId: null, schemeId: 'SCH-NHM', amount: cr(225), issuedBy: 'Department of Finance', effectiveDate: '2026-02-12', summary: 'Fund release (tranche 1) against FS-2026-HEALTH-001 ₹225 Cr.', file: 'fr-health-001.pdf', verificationStatus: 'verified', digitalSignatureStatus: 'signed', version: 1, status: 'published' },
  { id: 'GO-2026-0005', docId: 'DOC-GO-0005', type: 'reappropriation_order', orderNumber: 'GO-RA-2026-003', orderDate: '2026-07-02', fy: DEFAULT_FINANCIAL_YEAR, departmentId: 'health', districtId: null, schemeId: null, amount: cr(1), issuedBy: 'Department of Finance', effectiveDate: '2026-07-02', summary: 'Re-appropriation — ₹1 Cr from Medical Equipment to Health Infrastructure.', file: 'ra-health-003.pdf', verificationStatus: 'verified', digitalSignatureStatus: 'signed', version: 1, status: 'published' },
  { id: 'GO-2026-0006', docId: 'DOC-GO-0006', type: 'circular', orderNumber: 'CIRC-FIN-2026-09', orderDate: '2026-05-22', fy: DEFAULT_FINANCIAL_YEAR, departmentId: null, districtId: null, schemeId: null, amount: null, issuedBy: 'Department of Finance', effectiveDate: '2026-05-22', summary: 'Guidelines — quarterly expenditure review & scheme-wise utilisation reporting.', file: 'circ-fin-09.pdf', verificationStatus: 'verified', digitalSignatureStatus: 'signed', version: 1, status: 'published' },
  { id: 'GO-2026-0007', docId: 'DOC-GO-0007', type: 'notification', orderNumber: 'NOT-2026-118', orderDate: '2026-03-30', fy: DEFAULT_FINANCIAL_YEAR, departmentId: null, districtId: null, schemeId: null, amount: null, issuedBy: 'General Administration Department', effectiveDate: '2026-04-01', summary: 'Notification — revised delegation of financial powers FY 2026-27 (configurable matrix).', file: 'not-118-dfp.pdf', verificationStatus: 'verified', digitalSignatureStatus: 'signed', version: 1, status: 'published' },
  { id: 'GO-2026-0008', docId: 'DOC-GO-0008', type: 'scheme_guideline', orderNumber: 'GL-SCH-2026-SD', orderDate: '2026-01-15', fy: DEFAULT_FINANCIAL_YEAR, departmentId: 'tourism', districtId: null, schemeId: 'SCH-SD', amount: null, issuedBy: 'Tourism Department', effectiveDate: '2026-01-15', summary: 'Swadesh Darshan circuit development guidelines — Bihar chapter.', file: 'gl-sd-bihar.pdf', verificationStatus: 'verified', digitalSignatureStatus: 'unsigned', version: 2, status: 'published' },
  { id: 'GO-2026-0009', docId: 'DOC-GO-0009', type: 'policy', orderNumber: 'POL-EN-2026-05', orderDate: '2026-04-28', fy: DEFAULT_FINANCIAL_YEAR, departmentId: 'solar', districtId: null, schemeId: null, amount: null, issuedBy: 'Energy Department', effectiveDate: '2026-05-01', summary: 'State renewable energy policy addendum — rooftop solar incentives.', file: 'pol-ren-05.pdf', verificationStatus: 'pending', digitalSignatureStatus: 'unsigned', version: 1, status: 'draft' },
]

export const SEED_DOLOCS = SEED_GOVERNMENT_ORDERS.map((go) => ({
  id: go.id,
  docId: go.docId,
  type: go.type,
  orderNumber: go.orderNumber,
  orderDate: go.orderDate,
  fy: go.fy,
  departmentId: go.departmentId,
  districtId: go.districtId,
  schemeId: go.schemeId,
  amount: go.amount,
  issuedBy: go.issuedBy,
  effectiveDate: go.effectiveDate,
  file: go.file,
  verificationStatus: go.verificationStatus,
  digitalSignatureStatus: go.digitalSignatureStatus,
  version: go.version,
  status: go.status,
  createdBy: 'State Admin',
  createdAt: go.orderDate + 'T10:00:00Z',
}))

// ── Projects (fictional demo registry) ───────────────────────────────────────
export const SEED_PROJECTS = [
  { id: 'PRJ-NAL-001', name: 'Nalanda District Hospital Upgradation (PHC to 100-bed)', departmentId: 'health', districtId: 'nalanda', schemeId: 'SCH-AROGYA', category: 'Health Infrastructure', type: 'civil_works', estimatedCost: cr(72), sanctionedAmount: cr(70), releasedAmount: cr(55), committedAmount: cr(45), utilizedAmount: cr(38), completionPct: 66, startDate: '2026-04-20', expectedCompletion: '2027-03-20', status: 'in_progress', gisLocation: { lat: 25.136, lng: 85.441 }, implementingAgency: 'RCD, Health Dept', beneficiaryCount: 85000, documents: ['DPR-NAL-001.pdf'] },
  { id: 'PRJ-PAT-002', name: 'Patna Medical Equipment Modernisation', departmentId: 'health', districtId: 'patna', schemeId: 'SCH-NHM', category: 'Equipment', type: 'procurement', estimatedCost: cr(32), sanctionedAmount: cr(30), releasedAmount: cr(30), committedAmount: cr(28), utilizedAmount: cr(26), completionPct: 90, startDate: '2026-02-05', expectedCompletion: '2026-12-15', status: 'in_progress', gisLocation: { lat: 25.601, lng: 85.104 }, implementingAgency: 'PMC, Health Dept', beneficiaryCount: 520000, documents: ['DPR-PAT-002.pdf'] },
  { id: 'PRJ-PAT-003', name: 'Patna Smart Classrooms Programme (120 schools)', departmentId: 'education', districtId: 'patna', schemeId: 'SCH-BVM', category: 'Smart Classrooms', type: 'digital_infrastructure', estimatedCost: cr(48), sanctionedAmount: cr(45), releasedAmount: cr(40), committedAmount: cr(32), utilizedAmount: cr(18), completionPct: 45, startDate: '2026-05-10', expectedCompletion: '2027-02-28', status: 'in_progress', gisLocation: { lat: 25.594, lng: 85.116 }, implementingAgency: 'DIET Patna', beneficiaryCount: 42000, documents: ['DPR-PAT-003.pdf'] },
  { id: 'PRJ-NAL-004', name: 'Nalanda–Rajgir Road Strengthening (NH-33 spur)', departmentId: 'pwd', districtId: 'nalanda', schemeId: 'SCH-PWDHS', category: 'Roads', type: 'civil_works', estimatedCost: cr(52), sanctionedAmount: cr(50), releasedAmount: cr(42), committedAmount: cr(38), utilizedAmount: cr(35), completionPct: 72, startDate: '2026-01-12', expectedCompletion: '2026-12-31', status: 'in_progress', gisLocation: { lat: 25.04, lng: 85.42 }, implementingAgency: 'PWD Division Nalanda', beneficiaryCount: 210000, documents: ['DPR-NAL-004.pdf'] },
  { id: 'PRJ-GYA-005', name: 'Gaya Feeder Upgrade & Smart Metering', departmentId: 'electricity', districtId: 'gaya', schemeId: 'SCH-FEEDER', category: 'Power Infrastructure', type: 'electrical_works', estimatedCost: cr(20), sanctionedAmount: cr(18), releasedAmount: cr(15), committedAmount: cr(10), utilizedAmount: cr(6), completionPct: 38, startDate: '2026-06-01', expectedCompletion: '2027-05-31', status: 'in_progress', gisLocation: { lat: 24.795, lng: 84.998 }, implementingAgency: 'BSEB Gaya Circle', beneficiaryCount: 95000, documents: ['DPR-GYA-005.pdf'] },
  { id: 'PRJ-MFP-006', name: 'Muzaffarpur Solid Waste Processing Plant', departmentId: 'urban', districtId: 'muzaffarpur', schemeId: 'SCH-SBM', category: 'Sanitation', type: 'ppp_infrastructure', estimatedCost: cr(66), sanctionedAmount: cr(60), releasedAmount: cr(38), committedAmount: cr(30), utilizedAmount: cr(14), completionPct: 24, startDate: '2026-07-05', expectedCompletion: '2027-11-30', status: 'in_progress', gisLocation: { lat: 26.13, lng: 85.41 }, implementingAgency: 'Muzaffarpur Municipal Corp.', beneficiaryCount: 420000, documents: ['DPR-MFP-006.pdf'] },
  { id: 'PRJ-NAL-007', name: 'Rajgir Rooftop Solar Cluster (Govt Buildings)', departmentId: 'solar', districtId: 'nalanda', schemeId: 'SCH-BSOLAR', category: 'Renewable Energy', type: 'solar_rooftop', estimatedCost: cr(14), sanctionedAmount: cr(13), releasedAmount: cr(10), committedAmount: cr(8), utilizedAmount: cr(7), completionPct: 81, startDate: '2025-12-01', expectedCompletion: '2026-10-31', status: 'in_progress', gisLocation: { lat: 25.03, lng: 85.42 }, implementingAgency: 'BREDA', beneficiaryCount: 12000, documents: ['DPR-NAL-007.pdf'] },
  { id: 'PRJ-GYA-008', name: 'Bodh Gaya Tourist Circuit Facelift', departmentId: 'tourism', districtId: 'gaya', schemeId: 'SCH-SD', category: 'Tourism Infrastructure', type: 'civil_works', estimatedCost: cr(30), sanctionedAmount: cr(28), releasedAmount: cr(20), committedAmount: cr(16), utilizedAmount: cr(9), completionPct: 32, startDate: '2026-08-01', expectedCompletion: '2027-09-30', status: 'in_progress', gisLocation: { lat: 24.696, lng: 84.991 }, implementingAgency: 'Tourism Department', beneficiaryCount: 1500000, documents: ['DPR-GYA-008.pdf'] },
  { id: 'PRJ-JJM-009', name: 'JJM FHTC Household Tap Connections — Darbhanga Cluster', departmentId: 'water', districtId: 'darbhanga', schemeId: 'SCH-JJM', category: 'Water Supply', type: 'civil_works', estimatedCost: cr(12), sanctionedAmount: cr(11), releasedAmount: cr(7), committedAmount: cr(5), utilizedAmount: cr(3), completionPct: 29, startDate: '2026-05-20', expectedCompletion: '2027-08-31', status: 'in_progress', gisLocation: { lat: 26.15, lng: 85.89 }, implementingAgency: 'PHED Division Darbhanga', beneficiaryCount: 64000, documents: ['DPR-JJM-009.pdf'] },
  { id: 'PRJ-NAL-010', name: 'Nalanda Model School Block (Samagra)', departmentId: 'education', districtId: 'nalanda', schemeId: 'SCH-SS', category: 'School Infrastructure', type: 'civil_works', estimatedCost: cr(25), sanctionedAmount: cr(22), releasedAmount: cr(22), committedAmount: cr(21), utilizedAmount: cr(20), completionPct: 100, startDate: '2025-04-10', expectedCompletion: '2026-06-30', status: 'completed', gisLocation: { lat: 25.17, lng: 85.44 }, implementingAgency: 'Education Dept Nalanda', beneficiaryCount: 2800, documents: ['DPR-NAL-010.pdf'] },
  { id: 'PRJ-PAT-011', name: 'Patna State Highway 1 Corridor Maintenance', departmentId: 'pwd', districtId: 'patna', schemeId: 'SCH-PWDHS', category: 'Roads', type: 'civil_works', estimatedCost: cr(85), sanctionedAmount: cr(80), releasedAmount: cr(55), committedAmount: cr(42), utilizedAmount: cr(20), completionPct: 15, startDate: '2026-09-01', expectedCompletion: '2028-03-31', status: 'released', gisLocation: { lat: 25.62, lng: 85.10 }, implementingAgency: 'PWD Circle Patna', beneficiaryCount: 400000, documents: ['DPR-PAT-011.pdf'] },
  { id: 'PRJ-SOL-012', name: 'State Solar Park Pre-Feasibility (Muzaffarpur)', departmentId: 'solar', districtId: 'muzaffarpur', schemeId: 'SCH-SURYAGHAR', category: 'Renewable Energy', type: 'survey_dpr', estimatedCost: cr(8), sanctionedAmount: null, releasedAmount: null, committedAmount: null, utilizedAmount: null, completionPct: 0, startDate: null, expectedCompletion: '2027-06-30', status: 'under_review', gisLocation: { lat: 26.12, lng: 85.40 }, implementingAgency: 'BREDA', beneficiaryCount: 0, documents: ['DPR-SOL-012-draft.pdf'] },
  { id: 'PRJ-TRN-013', name: 'Solar Water Pumps for Schools (Ancillary)', departmentId: 'solar', districtId: 'sitamarhi', schemeId: 'SCH-BSOLAR', category: 'Renewable Energy', type: 'solar_rooftop', estimatedCost: cr(6), sanctionedAmount: null, releasedAmount: null, committedAmount: null, utilizedAmount: null, completionPct: 0, startDate: null, expectedCompletion: null, status: 'draft', gisLocation: { lat: 26.60, lng: 85.48 }, implementingAgency: 'District Cell BREDA', beneficiaryCount: 4800, documents: [] },
  { id: 'PRJ-EDU-014', name: 'Village Library Digitisation Pilot (Gaya)', departmentId: 'education', districtId: 'gaya', schemeId: 'SCH-SS', category: 'Digital Infrastructure', type: 'digital_infrastructure', estimatedCost: cr(5), sanctionedAmount: null, releasedAmount: null, committedAmount: null, utilizedAmount: null, completionPct: 0, startDate: null, expectedCompletion: '2027-03-31', status: 'proposed', gisLocation: { lat: 24.80, lng: 85.00 }, implementingAgency: 'Gaya DEO', beneficiaryCount: 9000, documents: [] },
  { id: 'PRJ-MDB-015', name: 'Mithila Artisan Centre (Madhubani)', departmentId: 'tourism', districtId: 'madhubani', schemeId: 'SCH-SD', category: 'Tourism Infrastructure', type: 'civil_works', estimatedCost: cr(11), sanctionedAmount: null, releasedAmount: null, committedAmount: null, utilizedAmount: null, completionPct: 0, startDate: null, expectedCompletion: null, status: 'rejected', gisLocation: { lat: 26.35, lng: 86.06 }, implementingAgency: 'Tourism Department', beneficiaryCount: 15000, documents: ['DPR-MDB-015.pdf'], rejectionReason: 'Incomplete DPR — land title pending. Returned 12-08-2026.' },
]

// ── Users & roles (state administration staff) ───────────────────────────────
export const SEED_USERS = [
  { id: 'U-STA-001', name: 'State Super Administrator', username: 'state.superadmin', role: 'state_super_admin', designation: 'State Administration (System)', departmentId: null, districtId: null, status: 'active' },
  { id: 'U-STA-002', name: 'State Finance Administrator', username: 'state.finance', role: 'state_finance_admin', designation: 'Finance (Budget & Accounts)', departmentId: null, districtId: null, status: 'active' },
  { id: 'U-STA-003', name: 'State Monitoring Officer', username: 'state.monitoring', role: 'state_monitoring_officer', designation: 'State Monitoring & Evaluation', departmentId: null, districtId: null, status: 'active' },
  { id: 'U-STA-004', name: 'State GIS Administrator', username: 'state.gis', role: 'state_gis_admin', designation: 'GIS & Asset Management', departmentId: null, districtId: null, status: 'active' },
  { id: 'U-HFW-01', name: 'Health Dept Administrator', username: 'hfw.stateadmin', role: 'state_dept_admin', designation: 'Department Admin (HFW)', departmentId: 'health', districtId: null, status: 'active' },
  { id: 'U-EDU-01', name: 'Education Dept Administrator', username: 'edu.stateadmin', role: 'state_dept_admin', designation: 'Department Admin (Education)', departmentId: 'education', districtId: null, status: 'active' },
  { id: 'U-PWD-01', name: 'PWD Dept Administrator', username: 'pwd.stateadmin', role: 'state_dept_admin', designation: 'Department Admin (PWD)', departmentId: 'pwd', districtId: null, status: 'active' },
  { id: 'U-BSEB-01', name: 'Electricity Dept Administrator', username: 'bseb.stateadmin', role: 'state_dept_admin', designation: 'Department Admin (BSEB)', departmentId: 'electricity', districtId: null, status: 'active' },
  { id: 'U-URB-01', name: 'Urban Dept Administrator', username: 'urb.stateadmin', role: 'state_dept_admin', designation: 'Department Admin (ULB)', departmentId: 'urban', districtId: null, status: 'active' },
  { id: 'U-SOL-01', name: 'Solar Dept Administrator', username: 'sol.stateadmin', role: 'state_dept_admin', designation: 'Department Admin (BREDA)', departmentId: 'solar', districtId: null, status: 'active' },
  { id: 'U-TOU-01', name: 'Tourism Dept Administrator', username: 'tou.stateadmin', role: 'state_dept_admin', designation: 'Department Admin (Tourism)', departmentId: 'tourism', districtId: null, status: 'active' },
  { id: 'U-WAT-01', name: 'Water Dept Administrator', username: 'wat.stateadmin', role: 'state_dept_admin', designation: 'Department Admin (PHED)', departmentId: 'water', districtId: null, status: 'active' },
]

// ── Notifications (seed) ─────────────────────────────────────────────────────
export function buildSeedNotifications() {
  const now = Date.now()
  const min = 60 * 1000
  return [
    { id: 'SN-001', type: 'budget_allocated', message: 'Department budget authorized for Health & Family Welfare — ₹520 Cr (FY 2026-27, GO-DB-2026-HEALTH).', channel: 'portal', createdAt: new Date(now - 25 * min).toISOString(), read: false, departmentId: 'health' },
    { id: 'SN-002', type: 'sanction_issued', message: 'Financial Sanction FS-2026017-HEALTH issued for ₹294 Cr against NHM state share.', channel: 'portal', createdAt: new Date(now - 90 * min).toISOString(), read: false, departmentId: 'health' },
    { id: 'SN-003', type: 'fund_released', message: 'Fund Release FR-2026-HEALTH-001 — ₹225 Cr released against FS-2026-HEALTH-001.', channel: 'email', createdAt: new Date(now - 150 * min).toISOString(), read: true, departmentId: 'health' },
    { id: 'SN-004', type: 'approval_pending', message: 'Sanction PRJ-MFP-006 (₹60 Cr) awaiting approval at Finance Authority — amount exceeds delegated limit.', channel: 'portal', createdAt: new Date(now - 200 * min).toISOString(), read: false, departmentId: 'urban' },
    { id: 'SN-005', type: 'approval_escalated', message: 'Proposal PRJ-PAT-011 escalated to State Department (sanction ₹80 Cr).', channel: 'portal', createdAt: new Date(now - 300 * min).toISOString(), read: false, departmentId: 'pwd' },
    { id: 'SN-006', type: 'budget_exhaustion', message: 'Water & Sanitation: 92% of authorized budget sanctioned — further sanctions will require finance clearance.', channel: 'sms', createdAt: new Date(now - 420 * min).toISOString(), read: false, departmentId: 'water' },
    { id: 'SN-007', type: 'low_utilization', message: 'Urban Local Body utilization at 66% of committed funds — quarterly review recommended.', channel: 'portal', createdAt: new Date(now - 600 * min).toISOString(), read: true, departmentId: 'urban' },
    { id: 'SN-008', type: 'project_delayed', message: 'PRJ-GYA-005 (Gaya Feeder Upgrade) is 18 days behind schedule.', channel: 'email', createdAt: new Date(now - 720 * min).toISOString(), read: true, departmentId: 'electricity' },
    { id: 'SN-009', type: 'order_published', message: 'GO-SUP-2026001 published — supplementary budget FY 2026-27 (+₹200 Cr).', channel: 'portal', createdAt: new Date(now - 1400 * min).toISOString(), read: true, departmentId: null },
    { id: 'SN-010', type: 'proposal_submitted', message: 'Proposal PRJ-SOL-012 submitted by BREDA — Solar Park Pre-Feasibility (₹8 Cr).', channel: 'portal', createdAt: new Date(now - 1600 * min).toISOString(), read: false, departmentId: 'solar' },
    { id: 'SN-011', type: 'proposal_returned', message: 'Proposal PRJ-MDB-015 returned to Tourism Department — land title pending.', channel: 'email', createdAt: new Date(now - 2000 * min).toISOString(), read: true, departmentId: 'tourism' },
  ]
}

// ── Immutable ledger derived from the seeded records ─────────────────────────
export function buildLedger(fy, departmentBudgets, allocations, chains) {
  const ledger = []
  const push = (entry) => ledger.push({ ...entry, timestamp: entry.timestamp || new Date().toISOString() })
  departmentBudgets.forEach((db) => {
    push({ id: `LEDGER-DB-${db.id}`, txId: `TX-${db.fy.replace('/', '')}-000001`, type: 'BUDGET_CREATED', fy: db.fy, departmentId: db.departmentId, budgetHeadId: db.budgetHeadId, amount: db.provision, sign: 1, balanceAfter: db.authorized, referenceType: 'department_budget', referenceNo: db.id, createdBy: db.createdBy, remarks: 'Provision created (original + revision retained).', timestamp: db.createdAt })
    if (db.revisions?.length) {
      db.revisions.forEach((rev) => push({ id: `LEDGER-REV-${db.id}-${rev.revisionNo}`, txId: `TX-${db.fy.replace('/', '')}-000002`, type: 'BUDGET_REVISED', fy: db.fy, departmentId: db.departmentId, budgetHeadId: db.budgetHeadId, amount: rev.delta, sign: 1, balanceAfter: db.authorized, referenceType: 'revision', referenceNo: rev.revisionNo, createdBy: rev.createdBy, remarks: rev.reason, timestamp: `${rev.date}T10:00:00Z` }))
    }
  })
  allocations.forEach((all) => push({ id: `LEDGER-DA-${all.id}`, txId: `TX-${all.fy.replace('/', '')}-000003`, type: 'DISTRICT_ALLOCATION', fy: all.fy, departmentId: all.departmentId, districtId: all.districtId, budgetHeadId: all.budgetHeadId, amount: all.amount, sign: 1, balanceAfter: all.amount, referenceType: 'district_allocation', referenceNo: all.id, createdBy: all.createdBy, timestamp: all.createdAt }))
  Object.values(chains).forEach((chain) => {
    chain.sanctions.forEach((s) => push({ id: `LEDGER-SAN-${s.id}`, txId: `TX-${s.fy.replace('/', '')}-000004`, type: 'SANCTION', fy: s.fy, departmentId: s.departmentId, schemeId: s.schemeId, budgetHeadId: s.budgetHeadId, amount: s.amount, sign: -1, balanceAfter: 0, referenceType: 'sanction', referenceNo: s.sanctionNo, createdBy: s.createdBy, remarks: s.description, timestamp: s.approvedAt || s.createdAt }))
    chain.releases.forEach((r) => push({ id: `LEDGER-REL-${r.id}`, txId: `TX-${r.fy.replace('/', '')}-000005`, type: 'FUND_RELEASE', fy: r.fy, departmentId: r.departmentId, schemeId: r.schemeId, budgetHeadId: r.budgetHeadId, amount: r.amount, sign: -1, balanceAfter: 0, referenceType: 'fund_release', referenceNo: r.releaseNo, createdBy: r.createdBy, remarks: `Release against ${r.sanctionId}`, timestamp: r.approvedAt || r.releaseDate }))
    chain.commitments.forEach((c) => push({ id: `LEDGER-COM-${c.id}`, txId: `TX-${c.fy.replace('/', '')}-000006`, type: 'COMMITMENT', fy: c.fy, departmentId: c.departmentId, budgetHeadId: c.budgetHeadId, amount: c.amount, sign: -1, balanceAfter: 0, referenceType: 'commitment', referenceNo: c.id, createdBy: c.createdBy, remarks: c.description, timestamp: c.createdAt }))
    chain.expenditures.forEach((e) => push({ id: `LEDGER-EXP-${e.id}`, txId: `TX-${e.fy.replace('/', '')}-000007`, type: 'EXPENDITURE', fy: e.fy, departmentId: e.departmentId, budgetHeadId: e.budgetHeadId, amount: e.amount, sign: -1, balanceAfter: 0, referenceType: 'expenditure', referenceNo: e.voucherNo, createdBy: e.createdBy, remarks: e.description, timestamp: e.createdAt }))
  })
  return ledger
}

// ── Audit trail (derived from seed activity) ─────────────────────────────────
export function buildAuditTrail(fy, departmentBudgets, allocations, chains) {
  const audit = []
  const push = (entry) => audit.push(entry)
  departmentBudgets.forEach((db) => {
    push({ id: `AUD-SEED-${db.id}-01`, actor: db.createdBy, role: 'state_admin', action: 'DEPARTMENT_AUTHORIZATION', entity: 'department_budget', entityId: db.id, oldValue: null, newValue: `authorized ₹${db.authorized}`, timestamp: db.createdAt, status: 'VERIFIED_IMMUTABLE', hashSignature: sha(db.id + db.authorized).slice(0, 16) })
    push({ id: `AUD-SEED-${db.id}-02`, actor: db.approvedBy, role: 'state_finance_admin', action: 'BUDGET_APPROVED', entity: 'department_budget', entityId: db.id, oldValue: 'pending', newValue: 'approved', timestamp: db.approvedAt, status: 'VERIFIED_IMMUTABLE', hashSignature: sha(db.id + 'approved').slice(0, 16) })
  })
  allocations.forEach((all) => push({ id: `AUD-SEED-${all.id}-01`, actor: all.createdBy, role: 'state_admin', action: 'DISTRICT_ALLOCATION', entity: 'district_allocation', entityId: all.id, oldValue: null, newValue: `${all.districtId} ₹${all.amount}`, timestamp: all.createdAt, status: 'VERIFIED_IMMUTABLE', hashSignature: sha(all.id).slice(0, 16) }))
  Object.values(chains).forEach((chain) => {
    chain.sanctions.forEach((s) => push({ id: `AUD-SEED-${s.id}-01`, actor: s.createdBy, role: 'state_dept_admin', action: 'SANCTION_CREATED', entity: 'sanction', entityId: s.id, oldValue: null, newValue: `₹${s.amount}`, timestamp: s.createdAt, status: 'VERIFIED_IMMUTABLE', hashSignature: sha(s.id).slice(0, 16) }))
    chain.sanctions.forEach((s) => push({ id: `AUD-SEED-${s.id}-02`, actor: s.approvedBy, role: 'state_finance_admin', action: 'SANCTION_APPROVED', entity: 'sanction', entityId: s.id, oldValue: 'drafted', newValue: 'approved', timestamp: s.approvedAt, status: 'VERIFIED_IMMUTABLE', hashSignature: sha(s.id + 'a').slice(0, 16) }))
    chain.releases.forEach((r) => push({ id: `AUD-SEED-${r.id}-01`, actor: r.createdBy, role: 'state_dept_admin', action: 'FUND_RELEASED', entity: 'fund_release', entityId: r.id, oldValue: null, newValue: `₹${r.amount}`, timestamp: r.createdAt, status: 'VERIFIED_IMMUTABLE', hashSignature: sha(r.id).slice(0, 16) }))
    chain.commitments.forEach((c) => push({ id: `AUD-SEED-${c.id}-01`, actor: c.createdBy, role: 'department_officer', action: 'COMMITMENT_RECORDED', entity: 'commitment', entityId: c.id, oldValue: null, newValue: `₹${c.amount}`, timestamp: c.createdAt, status: 'VERIFIED_IMMUTABLE', hashSignature: sha(c.id).slice(0, 16) }))
    chain.expenditures.forEach((e) => push({ id: `AUD-SEED-${e.id}-01`, actor: e.createdBy, role: 'ddo', action: 'EXPENDITURE_RECORDED', entity: 'expenditure', entityId: e.id, oldValue: null, newValue: `₹${e.amount}`, timestamp: e.createdAt, status: 'VERIFIED_IMMUTABLE', hashSignature: sha(e.id).slice(0, 16) }))
  })
  SEED_GOVERNMENT_ORDERS.forEach((go, i) => push({ id: `AUD-SEED-GO-${String(i + 1).padStart(3, '0')}`, actor: 'State Admin', role: 'state_admin', action: 'ORDER_PUBLISHED', entity: 'government_order', entityId: go.id, oldValue: 'draft', newValue: go.status, timestamp: `${go.orderDate}T10:30:00Z`, status: 'VERIFIED_IMMUTABLE', hashSignature: sha(go.id).slice(0, 16) }))
  return audit
}

export function buildReappropriationSeed(fy) {
  return [{
    id: 'RA-2026-003',
    raNo: 'GO-RA-2026-003',
    fy,
    sourceDepartmentId: 'health',
    sourceBudgetHeadId: 'bh-equipment',
    sourceSchemeId: null,
    destinationDepartmentId: 'health',
    destinationBudgetHeadId: 'bh-infrastructure',
    destinationSchemeId: null,
    amount: cr(1),
    reason: 'Equipment procurement deferred; requirement shifted to infrastructure works.',
    supportingOrder: 'GO-RA-2026-003',
    approvingAuthority: 'Finance Authority',
    approvedBy: 'State Finance Admin',
    date: '2026-07-02',
    status: 'approved',
    createdBy: 'Health Dept Administrator',
    createdAt: '2026-06-30T09:00:00Z',
    idempotencyKey: `RA-${fy}-health-equipment-001`,
  }]
}

// ── Pending-approval seed (drafted items for the Approvals inbox) ─────────────
// Amounts stay within the seeded authorized headroom so the finance rules
// are respected when these are approved from the UI.
export function buildPendingApprovals(fy, chains) {
  const urbanSanction = chains.urban.sanctions[0]
  const sanction = {
    id: 'SAN-CREATE-pending-urban',
    sanctionNo: `FS-${fy.replace('-', '')}-URBAN-903`,
    fy,
    departmentId: 'urban',
    districtId: null,
    schemeId: 'SCH-SBM',
    budgetHeadId: 'bh-grants',
    projectId: null,
    description: 'Pending sanction — SBM 2.0 urban solid waste processing capacity (seed demo record).',
    amount: cr(4),
    authority: 'State Department (Delegated)',
    goNumber: 'GO-FS-2026-URBAN-903',
    status: 'drafted',
    approvalHistory: [{ action: 'draft', actor: 'Urban Dept Administrator', timestamp: new Date().toISOString(), remarks: 'Created by department — awaiting finance approval.' }],
    createdBy: 'Urban Dept Administrator',
    createdAt: new Date().toISOString(),
  }
  const release = {
    id: 'REL-CREATE-pending-urban',
    releaseNo: `FR-${fy.replace('-', '')}-URBAN-903`,
    sanctionId: urbanSanction.id,
    fy,
    departmentId: 'urban',
    districtId: null,
    schemeId: urbanSanction.schemeId,
    budgetHeadId: urbanSanction.budgetHeadId,
    amount: cr(2),
    releaseDate: new Date().toISOString().slice(0, 10),
    status: 'drafted',
    authority: null,
    goNumber: '',
    documentId: null,
    remarks: 'Pending release — tranche against approved urban sanitation sanction (seed demo record).',
    createdBy: 'Urban Dept Administrator',
    createdAt: new Date().toISOString(),
  }
  const reappropriation = {
    id: 'RA-CREATE-pending-urban',
    raNo: `GO-RA-${fy.replace('-', '')}-004`,
    fy,
    sourceDepartmentId: 'urban',
    sourceBudgetHeadId: 'bh-grants',
    sourceSchemeId: null,
    destinationDepartmentId: 'urban',
    destinationBudgetHeadId: 'bh-materials',
    destinationSchemeId: null,
    amount: cr(1),
    reason: 'Urban sanitation materials requirement — seed demo record awaiting approval.',
    supportingOrder: 'GO-RA-2026-004',
    status: 'drafted',
    createdBy: 'Urban Dept Administrator',
    createdAt: new Date().toISOString(),
    idempotencyKey: `RA-${fy}-urban-grants-materials-001`,
  }
  return { sanctions: [sanction], releases: [release], reappropriations: [reappropriation] }
}

// ── Project proposals (seed demo) ────────────────────────────────────────────
export const SEED_PROPOSALS = [
  {
    id: 'PROP-SOL-012',
    name: 'State Solar Park Pre-Feasibility (Muzaffarpur)',
    departmentId: 'solar',
    districtId: 'muzaffarpur',
    schemeId: 'SCH-SURYAGHAR',
    projectCategory: 'cat-renewable',
    estimatedCost: cr(8),
    purpose: 'Pre-feasibility study for a state solar park — land, grid and DPR.',
    beneficiaryCount: 0,
    expectedOutcomes: 'Feasibility report and DPR ready for approval.',
    timeline: '6 months',
    documents: ['DPR-SOL-012-draft.pdf'],
    gisLocation: { lat: 26.12, lng: 85.4 },
    status: 'submitted',
    workflowId: 'WF-PROPOSAL',
    history: [{ action: 'submit', actor: 'BREDA', role: 'state_dept_admin', timestamp: '2026-07-28T09:00:00Z', remarks: 'Proposal submitted by department.' }],
    createdBy: 'BREDA',
    createdAt: '2026-07-28T09:00:00Z',
  },
  {
    id: 'PROP-PAT-011',
    name: 'Patna State Highway 1 Corridor Maintenance',
    departmentId: 'pwd',
    districtId: 'patna',
    schemeId: 'SCH-PWDHS',
    projectCategory: 'cat-roads',
    estimatedCost: cr(85),
    purpose: 'Corridor maintenance and strengthening over FY 2026-27 to FY 2027-28.',
    beneficiaryCount: 400000,
    expectedOutcomes: 'Maintainable road corridor with strengthened carriageway.',
    timeline: '18 months',
    documents: ['DPR-PAT-011.pdf'],
    gisLocation: { lat: 25.62, lng: 85.1 },
    status: 'escalated',
    workflowId: 'WF-PROPOSAL',
    history: [
      { action: 'submit', actor: 'PWD Circle Patna', role: 'state_dept_admin', timestamp: '2026-07-10T09:00:00Z', remarks: 'Submitted.' },
      { action: 'recommend', actor: 'DM Patna', role: 'dm', timestamp: '2026-07-15T11:00:00Z', remarks: 'Recommended at district level.' },
      { action: 'escalate', actor: 'PWD Dept Admin', role: 'state_dept_admin', timestamp: '2026-07-21T10:00:00Z', remarks: 'Amount ₹85 Cr exceeds acting authority — escalated to competent authority.' },
    ],
    createdBy: 'PWD Circle Patna',
    createdAt: '2026-07-10T09:00:00Z',
  },
  {
    id: 'PROP-GYA-016',
    name: 'Gaya District Hospital Equipment Renewal',
    departmentId: 'health',
    districtId: 'gaya',
    schemeId: 'SCH-NHM',
    projectCategory: 'cat-health-infra',
    estimatedCost: cr(9),
    purpose: 'Renewal of critical equipment at Gaya district hospital.',
    beneficiaryCount: 180000,
    expectedOutcomes: 'Functional critical equipment coverage at district hospital.',
    timeline: '8 months',
    documents: [],
    gisLocation: null,
    status: 'recommended',
    workflowId: 'WF-PROPOSAL',
    history: [
      { action: 'submit', actor: 'Health Dept Administrator', role: 'state_dept_admin', timestamp: '2026-07-05T09:00:00Z', remarks: 'Submitted.' },
      { action: 'recommend', actor: 'DM Gaya', role: 'dm', timestamp: '2026-07-11T11:00:00Z', remarks: 'Recommended — district priority.' },
    ],
    createdBy: 'Health Dept Administrator',
    createdAt: '2026-07-05T09:00:00Z',
  },
]

export const SEED_AUTHORITY_MATRIX = DEFAULT_AUTHORITY_MATRIX
export const SEED_WORKFLOWS = DEFAULT_WORKFLOWS
export const SEED_BUDGET_HEADS = BUDGET_HEADS

// FY 2025-26 lighter dataset for budget history / trends.
export const PREVIOUS_YEAR = {
  fy: '2025-26',
  authorizedByDept: {
    health: cr(480), education: cr(740), pwd: cr(950), electricity: cr(660),
    urban: cr(580), solar: cr(440), tourism: cr(270), water: cr(160),
  },
  sanctionedByDept: {
    health: cr(455), education: cr(700), pwd: cr(900), electricity: cr(620),
    urban: cr(540), solar: cr(410), tourism: cr(250), water: cr(140),
  },
  releasedByDept: {
    health: cr(430), education: cr(660), pwd: cr(850), electricity: cr(580),
    urban: cr(500), solar: cr(390), tourism: cr(230), water: cr(120),
  },
  utilizedByDept: {
    health: cr(400), education: cr(600), pwd: cr(760), electricity: cr(520),
    urban: cr(440), solar: cr(350), tourism: cr(200), water: cr(100),
  },
}