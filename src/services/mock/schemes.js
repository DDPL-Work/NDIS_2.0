// FR-CP-06 — Government scheme discovery and application-status tracking (mst_scheme, Vol 2 §12.2)
export const SCHEMES = [
  {
    id: 'jjm', name: 'Jal Jeevan Mission', departmentId: 'water',
    description: 'Functional household tap connections for every rural home.',
    eligibility: 'All rural households without an existing piped connection.',
    beneficiariesInDistrict: 184320, status: 'active',
  },
  {
    id: 'pm-surya-ghar', name: 'PM Surya Ghar: Muft Bijli Yojana', departmentId: 'solar',
    description: 'Rooftop solar subsidy for households and government buildings.',
    eligibility: 'Homeowners and government building custodians with suitable rooftop area.',
    beneficiariesInDistrict: 6410, status: 'active',
  },
  {
    id: 'ayushman-bharat', name: 'Ayushman Bharat (PM-JAY)', departmentId: 'health',
    description: 'Health cover of ₹5 lakh per family per year for secondary/tertiary care.',
    eligibility: 'Families identified under SECC deprivation criteria.',
    beneficiariesInDistrict: 512900, status: 'active',
  },
  {
    id: 'samagra-shiksha', name: 'Samagra Shiksha Abhiyan', departmentId: 'education',
    description: 'School infrastructure, digital classrooms and teacher training support.',
    eligibility: 'Government and government-aided schools.',
    beneficiariesInDistrict: 812, status: 'active',
  },
  {
    id: 'pmgsy', name: 'Pradhan Mantri Gram Sadak Yojana', departmentId: 'district_assets',
    description: 'All-weather road connectivity for unconnected habitations.',
    eligibility: 'Habitations above the population threshold without all-weather road access.',
    beneficiariesInDistrict: 96, status: 'active',
  },
  {
    id: 'swadesh-darshan', name: 'Swadesh Darshan 2.0', departmentId: 'tourism',
    description: 'Sustainable and responsible development of tourist circuits.',
    eligibility: 'Heritage sites and circuits nominated under the Buddhist Circuit theme.',
    beneficiariesInDistrict: 14, status: 'active',
  },
]

export function getSchemes({ departmentId } = {}) {
  return departmentId ? SCHEMES.filter((s) => s.departmentId === departmentId) : SCHEMES
}
