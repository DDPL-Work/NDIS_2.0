import { useProjectEngine } from '../../../app/store/projectEngine'

export const ProjectCreationService = {
  sanction: (proposalId, actor, remarks) => useProjectEngine.getState().createProjectFromProposal(proposalId, actor, remarks),
}
