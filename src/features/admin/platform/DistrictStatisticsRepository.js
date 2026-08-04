// District Statistics Repository (Module 1 - District Profile)

export const DistrictStatisticsRepository = {
  getProfile(districtId = 'nalanda') {
    return {
      districtId,
      name: 'Nalanda',
      state: 'Bihar',
      population: 2877653,
      blocksCount: 20,
      panchayatsCount: 249,
      villagesCount: 1084,
      departmentsCount: 15,
      schoolsCount: 1812,
      hospitalsCount: 42,
      roadLengthKm: 2840,
      waterAssetsCount: 1420,
      tourismAssetsCount: 24,
      totalBudget: 420000000, // ₹42 Cr
      projectsCount: 68,
      employeesCount: 4850,
      fieldStaffCount: 612,
    }
  }
}
