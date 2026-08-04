import { useProjectEngine } from '../../../app/store/projectEngine'

export const ProposalRepository = {
  create: (payload) => useProjectEngine.getState().createProposal(payload),
  update: (id, updates) => useProjectEngine.getState().updateProposal(id, updates),
  transition: (id, state, actor, remarks) => useProjectEngine.getState().transitionProposal(id, state, actor, remarks),
}
