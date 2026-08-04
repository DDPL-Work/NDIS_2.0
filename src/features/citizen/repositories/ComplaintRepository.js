// Single client-side repository boundary for the complaint engine.
export const ComplaintRepository = {
  findNearbyDuplicates: (complaints, categoryId, position, distanceMeters) => complaints.filter((complaint) => complaint.categoryId === categoryId && complaint.location?.position && distanceMeters(position, complaint.location.position) < 250 && !['closed', 'cancelled'].includes(complaint.state)),
}
