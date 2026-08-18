import { mapNegotiationList, mapNegotiation } from '../src/api/mappers/negotiationMapper.js'

const DM_PROPOSER_LABELS = new Set(['dm', 'district magistrate', 'magistrate', 'collector', 'district collector'])
const isDmProposed = (round) => {
  const proposer = String(round?.proposedByName ?? round?.proposedBy ?? '').trim().toLowerCase()
  return DM_PROPOSER_LABELS.has(proposer) || /dm|magistrate|collector/i.test(proposer)
}
const derive = (negotiations) => {
  const rounds = Array.isArray(negotiations) ? negotiations : []
  const normalized = rounds.filter(Boolean).sort((a, b) => Number(b.negotiationRound || 0) - Number(a.negotiationRound || 0))
  const openRounds = normalized.filter((r) => String(r.status || '').toUpperCase() === 'OPEN')
  const openRound = openRounds[0] || null
  const proposer = String(openRound?.proposedByName ?? openRound?.proposedBy ?? '').trim().toLowerCase()
  const isDmProposal = DM_PROPOSER_LABELS.has(proposer) || /dm|magistrate|collector/i.test(proposer)
  return { count: normalized.length, openRound, isDmProposal, showDepartmentDecision: Boolean(openRound) && isDmProposal }
}

const LIVE_DEDICATED = { round: 1, proposed_by: 'DM', action: 'COUNTER_OFFER', status: 'OPEN', amount: '1500000.00', timeline_days: 80, scope: '74', remarks: 'd' }
const EMBEDDED = { negotiation_round: 1, proposed_by: 'dm', proposed_by_name: 'dm', action: 'COUNTER_OFFER', status: 'OPEN', proposed_amount: '1500000.00', proposed_timeline_days: 80, proposed_scope: '74', remarks: 'd', created_at: '2026-08-18T00:00:00Z' }
// THE ACTUAL CURRENT LIVE ENVELOPE (proposal 11): {proposal_id, estimated_cost,
// approval_mode, agreed_*, history: [...]}
const LIVE_HISTORY_ENVELOPE = {
  proposal_id: 11,
  estimated_cost: '3348713.00',
  approval_mode: null,
  agreed_amount: null,
  agreed_timeline_days: null,
  agreed_scope: null,
  history: [
    { round: 1, proposed_by: 'DM', action: 'COUNTER_OFFER', status: 'OPEN', amount: '2222222.00', timeline_days: 211, scope: null, remarks: 'aqqwe', created_at: '2026-08-18T09:49:41.388494Z' },
  ],
}

const cases = [
  ['LIVE history envelope (proposal 11)', LIVE_HISTORY_ENVELOPE],
  ['history envelope with two rounds', { proposal_id: 11, history: [{ round: 1, status: 'CLOSED' }, { round: 2, proposed_by: 'DM', status: 'OPEN' }] }],
  ['history: [] empty', { proposal_id: 11, history: [] }],
  ['history with closed round only', { proposal_id: 11, history: [{ round: 1, status: 'ACCEPTED' }] }],
  ['bare object (LIVE dedicated response)', LIVE_DEDICATED],
  ['array of dedicated rounds', [LIVE_DEDICATED]],
  ['{negotiations: [...]}', { negotiations: [LIVE_DEDICATED] }],
  ['{rounds: [...]}', { rounds: [LIVE_DEDICATED] }],
  ['{results: [...]} paginated', { count: 1, next: null, previous: null, results: [LIVE_DEDICATED] }],
  ['{data: [...]}', { data: [LIVE_DEDICATED] }],
  ['{negotiation: {...}}', { negotiation: LIVE_DEDICATED }],
  ['{data: {...}} single', { data: LIVE_DEDICATED }],
  ['embedded shape array', [EMBEDDED]],
  ['empty array', []],
  ['null', null],
  ['{count:0} metadata only', { count: 0 }],
  ['closed round (status CLOSED)', { round: 2, proposed_by: 'DM', action: 'ACCEPT', status: 'CLOSED', amount: '1500000.00', timeline_days: 80, scope: '74', remarks: 'ok' }],
]

let failures = 0
for (const [name, input] of cases) {
  const list = mapNegotiationList(input)
  const state = derive(list)
  const round = state.openRound
  console.log(`\n== ${name} ==`)
  console.log('  rounds:', state.count, '| openRound:', round ? `round ${round.negotiationRound} ${round.status} by ${round.proposedByName || round.proposedBy}` : 'null')
  console.log('  isDmProposal:', state.isDmProposal, '| showDepartmentDecision:', state.showDepartmentDecision)
  if (round) {
    const isCanonical = round.raw === LIVE_DEDICATED
    const ok = !isCanonical || (round.proposedAmount === 1500000 && round.proposedTimelineDays === 80 && (round.proposedScope === '74' || round.proposedScope === '') && round.remarks === 'd')
    if (!ok) { failures++; console.log('  !!! NORMALIZATION MISMATCH', JSON.stringify(round)) }
  }
  if (input === LIVE_DEDICATED || (Array.isArray(input) && input[0] === LIVE_DEDICATED) || (input && input.negotiation === LIVE_DEDICATED) || (input && input.data === LIVE_DEDICATED) || (input && Array.isArray(input.data) && input.data[0] === LIVE_DEDICATED)) {
    if (!state.showDepartmentDecision) { failures++; console.log('  !!! EXPECTED showDepartmentDecision=true') }
  }
}

const single = mapNegotiation(LIVE_DEDICATED)
console.log('\n== mapNegotiation(bare object) ==')
console.log('  negotiationRound:', single.negotiationRound, '| proposedByName:', JSON.stringify(single.proposedByName), '| proposedBy:', JSON.stringify(single.proposedBy))
console.log('  proposedAmount:', single.proposedAmount, '| proposedTimelineDays:', single.proposedTimelineDays, '| proposedScope:', single.proposedScope, '| remarks:', JSON.stringify(single.remarks), '| status:', single.status)

if (!single.proposedByName || single.proposedByName !== 'DM') failures++
if (single.proposedAmount !== 1500000) failures++
if (single.proposedTimelineDays !== 80) failures++
if (single.proposedScope !== '74') failures++
if (single.negotiationRound !== 1) failures++

// EXACT LIVE PROPOSAL-11 ASSERTIONS: history envelope -> OPEN DM round
const p11 = mapNegotiationList(LIVE_HISTORY_ENVELOPE)
const p11round = p11[0]
console.log('\n== LIVE proposal 11 (history envelope) ==')
console.log('  list length:', p11.length)
console.log('  round:', JSON.stringify(p11round && {
  negotiationRound: p11round.negotiationRound,
  proposedByName: p11round.proposedByName,
  action: p11round.action,
  status: p11round.status,
  proposedAmount: p11round.proposedAmount,
  proposedTimelineDays: p11round.proposedTimelineDays,
  proposedScope: p11round.proposedScope,
  remarks: p11round.remarks,
  createdAt: p11round.createdAt,
}))
const p11state = derive(p11)
console.log('  isDmProposal:', p11state.isDmProposal, '| showDepartmentDecision:', p11state.showDepartmentDecision)
if (p11.length !== 1) failures++
if (!p11round || p11round.negotiationRound !== 1 || p11round.proposedByName !== 'DM' || p11round.status !== 'OPEN') failures++
if (p11round.proposedAmount !== 2222222 || p11round.proposedTimelineDays !== 211) failures++
if (p11round.remarks !== 'aqqwe' || !p11state.showDepartmentDecision) failures++

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECKS FAILED`)
process.exit(failures === 0 ? 0 : 1)
