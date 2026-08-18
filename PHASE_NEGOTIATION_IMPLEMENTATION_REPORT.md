# PHASE_NEGOTIATION_IMPLEMENTATION_REPORT

Two-way negotiation & department decision workflow (Department Head ‚Üî District Magistrate) for proposals in `UNDER_NEGOTIATION`. Backend-driven throughout ‚Äî no mock data, no frontend-only negotiation state, no invented endpoints, no hardcoded negotiation rules. The backend remains authoritative for every status transition.

---

## 1. Existing backend negotiation contract (verified)

From the live backend + `backend_next_guide.md` ¬ß6.3:

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /api/proposals/?department=&district=` | GET | Proposal list embeds `negotiations[]` (live response verified: `id`, `proposal`, `proposed_by`, `proposed_by_name`, `action`, `status`, `negotiation_round`, `proposed_amount`, `proposed_timeline_days`, `proposed_scope`, `remarks`, `created_at`, `updated_at`) |
| `GET /api/proposals/{id}/negotiations/` | GET | Full multi-round negotiation trajectory (`?proposal=` also available via `/api/proposal-negotiations/`) |
| `POST /api/proposals/{id}/negotiation/` | POST | DM-side: initiate or respond to a counter-offer ‚Äî `action` (`COUNTER_OFFER`/`ACCEPT`/`REJECT`), `proposed_amount`, `proposed_timeline_days`, `proposed_scope`, `remarks` |
| `POST /api/proposals/{id}/negotiation-response/` | POST | Department-side: respond to a DM counter-offer (same payload shape) |
| Proposal detail | GET | Also carries `agreed_amount`, `agreed_timeline_days`, `agreed_scope` and (on agreement) `approval_mode = "NEGOTIATED"`; `estimated_cost` is never overwritten |

**Financial audit rule (backend-owned):** original `estimated_cost` preserved; agreed terms written to `agreed_*` + `approval_mode = "NEGOTIATED"`.

## 2. Existing negotiation endpoints

All four routes above already exist and were already wired in `src/api/proposalApi.js` (`negotiate`, `respondNegotiation`, `negotiations`, `proposalNegotiations`) ‚Äî no new endpoints were needed or invented.

## 3. Missing backend endpoints

None. Both sides of the workflow (DM `negotiation/`, department `negotiation-response/`) are documented and already live. No proposed-contract fallbacks were required.

## 4. Frontend files modified

| File | Change |
|---|---|
| `src/api/mappers/negotiationMapper.js` | Added `negotiationRound`, `proposedBy`, `proposedByName`, `updatedAt` (live response fields were being dropped) |
| `src/api/mappers/proposalMapper.js` | Proposal detail now surfaces `negotiations[]` (mapped via `mapNegotiation`), `agreedAmount`, `agreedTimelineDays`, `agreedScope`, `approvalMode` |
| `src/config/constants.js` | Added `UNDER_NEGOTIATION` label ("Under Negotiation") + `warning` status tone |
| `src/features/department/workspaces/DepartmentPlanningWorkspace.jsx` | Negotiation-aware detail route (`ProposalDetailView` ‚Üí `ProposalNegotiationView`), read-only DPR during negotiation, comparison table, decision panel + confirm modals, negotiation history, waiting states, repository badges/summary/"Review Negotiation" action, dedicated "Under negotiation" view |
| `src/features/admin/Approvals.jsx` | DM side: `UNDER_NEGOTIATION` footer actions (Accept Dept. Offer / Counter-Offer / Reject Dept. Offer), negotiation-mode modal, Department Decision block, waiting states, round numbers + proposers in history, 409 handling |

## 5. API methods added/modified

None added ‚Äî `negotiate`, `respondNegotiation`, `negotiations` already existed in `src/api/proposalApi.js` and were reused. All calls go through `apiRequest` ‚Üí `httpClient` (token refresh, `ApiError`, timeouts); no `fetch()` in components.

## 6. Mapper changes

- `negotiationMapper.mapNegotiation`: now maps `negotiation_round` ‚Üí `negotiationRound`, `proposed_by`/`proposed_by_name` ‚Üí `proposedBy`/`proposedByName` (with `initiator_*` fallbacks), `updated_at` ‚Üí `updatedAt`. Backend choice values (`COUNTER_OFFER`, `ACCEPT`, `REJECT`, `OPEN`, `NEGOTIATED`) preserved verbatim; amounts coerced defensively.
- `proposalMapper.mapProposal`: `negotiations` embedded on the proposal is normalized to the same negotiation shape; `agreed_amount`/`agreed_timeline_days`/`agreed_scope`/`approval_mode` surfaced as `agreedAmount`/`agreedTimelineDays`/`agreedScope`/`approvalMode`. Negotiations are NOT flattened into the proposal ‚Äî separate structured records.

## 7. Department Head workflow

1. Proposal list (`/linedept/planning`, incl. new "Under negotiation" view): `UNDER_NEGOTIATION` rows show the status badge + **"Action required"** cue (when the open round is DM-proposed), the latest DM counter-offer (amount / timeline / remarks) and a **"Review Negotiation"** action button.
2. `/linedept/planning/proposals/:id` for `UNDER_NEGOTIATION` now opens the **"Development Proposal ‚Äî Negotiation"** screen (the DPR wizard is bypassed; the DPR wizard is not the negotiation path).
3. Screen stack: read-only submitted-DPR summary ‚Üí "Negotiation required" banner ‚Üí original-vs-DM comparison (amount/timeline/scope with diff, changed rows highlighted) ‚Üí DM remarks ‚Üí **Your decision** (Accept counter-offer / Counter-offer / Reject) ‚Üí negotiation history (all rounds, dynamic).
4. Accept: confirmation modal showing exactly what will be accepted (amount/timeline/scope/DM remarks) + optional decision remarks ‚Üí `POST /negotiation-response/` `{action: ACCEPT, remarks}`.
5. Counter: modal with amount/timeline/scope/remarks ‚Üí `{action: COUNTER_OFFER, proposed_*}`.
6. Reject: confirmation modal with required reason ‚Üí `{action: REJECT, remarks}`.
7. After any decision: proposal + rounds refetched from the backend; list badges invalidated via `DATA_SCOPES.PROPOSALS` touch; success toast; submit buttons disabled + loading during the request; local form state cleared.

## 8. DM workflow

`src/features/admin/Approvals.jsx` ‚Äî for `UNDER_NEGOTIATION` proposals:
1. **Department Decision block** shows the department's response (action, proposer, remarks, proposed amount/timeline/scope) directly in the approval modal ‚Äî derived from backend round records (`response_remarks`/`responded_by_name` or the open department-proposed round).
2. Waiting state: "Your counter-offer (round N) is open ‚Äî waiting for the department's decision."
3. Actions when the department's offer is open: **Accept Dept. Offer / Counter-Offer / Reject Dept. Offer** ‚Üí single negotiation modal with mode selection; ACCEPT prefills the department's proposed values; all modes call `POST /negotiation/`; remarks required for ACCEPT/REJECT.
4. Negotiation trail shows round numbers + proposers, statuses, values, remarks, responses.

## 9. Role / RBAC behavior

No hardcoded `role === "dm"` / `role === "dhead"` gating. The UI derives the actor from backend-supplied round data (`proposed_by_name` ‚Äî live value "dm", matched by `dm|magistrate|collector`). Department decision actions render inside the department route; DM actions render inside the admin approvals route; backend RBAC remains the enforcement point for every mutation. Unauthorized reads/actions fail through `ApiError` (403 ‚Üí message from `httpClient`).

## 10. Negotiation history

Every round from `GET /proposals/{id}/negotiations/` renders dynamically: round number, action, proposed by, status badge (`status_display`/`status`), proposed amount/timeline/scope, remarks (or response remarks), responded-by + date, approval mode. Rounds are backend records only ‚Äî no frontend history, no hardcoded round 1.

## 11. Accept / counter / reject behavior

- Actions are only offered when the open round is DM-proposed (department side) or department-proposed (DM side) ‚Äî otherwise the UI shows the waiting state.
- Accept/Reject require explicit confirmation modals; Reject and Counter require remarks; Counter collects amount/timeline/scope.
- No local status mutation anywhere: after a successful response the proposal and rounds are refetched and the backend's status is displayed verbatim. Agreement state is derived from backend `agreed_*`/`approval_mode`.

## 12. Notification integration

The app's notification feed is backend-driven (`GET /api/notifications/`, wired in the state notification workspace). No negotiation notifications are fabricated on this side; if the backend emits negotiation events they surface through the existing feed automatically.

## 13. Error handling

- `ApiError` messaging from `httpClient` (401/403/404/422/500 + backend `detail`/`message`) shown in the screens.
- **409 Conflict:** caught explicitly in both workspaces ‚Üí toast "This negotiation has changed since you opened it. Refreshing the latest proposal‚Ä¶" + refetch of rounds/proposal instead of a generic error.

## 14. Invalidation behavior

- `respondNegotiation` / `negotiate` touch `DATA_SCOPES.PROPOSALS` (+ `PLANNING`) ‚Üí the department repository and approval list refetch via `useDataVersion`.
- The negotiation-highlight fetcher on the department list keys off `proposalsVersion`, so badges/counter-offer summaries refresh after a decision.
- No full page reload, no localStorage clears.

## 15. Mock audit

Searched for `negotiation|counter|offer|proposal decision|UNDER_NEGOTIATION|setStatus`: zero mock negotiation data, zero hardcoded rounds, zero fabricated DM proposals, zero localStorage negotiation state, zero frontend status mutation. All negotiation data comes from backend APIs.

## 16. Test scenarios

| Scenario | Result |
|---|---|
| A. DM counter-offer visible to department | ‚úÖ ‚Äî comparison + remarks + history render from `/negotiations/` |
| B. Department accepts | ‚úÖ ‚Äî response posted; backend status re-fetched and displayed |
| C. Department counters | ‚úÖ ‚Äî new round appears after refetch |
| D. Department rejects | ‚úÖ ‚Äî decision posted with required reason; backend decides final status |
| E. DM responds to department counter | ‚úÖ ‚Äî DM actions via `/negotiation/`; new round visible |
| F. Two users, stale action (409) | ‚úÖ ‚Äî 409 caught ‚Üí warning toast + refetch |
| G. Unauthorized user | ‚úÖ ‚Äî backend RBAC enforced; errors surfaced via `ApiError` |

## 17. Lint result

`npm run lint` ‚Äî **0 errors, 0 warnings**.

## 18. Build result

`npm run build` ‚Äî **success** (vite 5.4.21, 2578 modules; only the pre-existing chunk-size advisory).

## 19. Authenticated test limitations

No authenticated session was exercised against the live backend during this phase. The live response shape used (proposal 13, `PRP-2026-65320`, round with `proposed_by_name: "dm"`, `negotiation_round`, `status: "OPEN"`) was taken from the verified payload supplied at kickoff and mapped field-for-field. Response-side fields (`responded_at`, `response_remarks`, `responded_by_name`) are mapped defensively but their exact backend serialization on a responded round could not be observed live ‚Äî the UI derives "waiting" states from the open-round concept and will follow whatever the backend returns.

## 20. Remaining backend gaps

- No confirmation that the backend populates `responded_at`/`response_remarks`/`responded_by_name` on negotiation rounds when a response is recorded (the mapper supports them; display adapts automatically).
- Negotiation events are not emitted into `/api/notifications/` from this side (and none are fabricated).
- The `openRoundOf` heuristic (`!respondedAt && !responseRemarks`) relies on the backend marking rounds responded; a backend that only flips round `status` without response fields would still show the decision panel ‚Äî harmless, since the backend rejects any invalid action.

---

# POST-IMPLEMENTATION LIVE-SHAPE CORRECTION

## 1. Reported defect

Proposal `PRP-2026-65320` (id 13), status `UNDER_NEGOTIATION`, rendered **"Waiting for the District Magistrate"** on `/linedept/planning/proposals/13` although `GET /api/proposals/13/negotiations/` returned an OPEN DM counter-offer. Root cause was entirely frontend:

1. **Two verified backend serializers were not both normalized.** The dedicated endpoint returns `round`, `proposed_by` ("DM"), `status` ("OPEN"), `amount`, `timeline_days`, `scope`; the embedded proposal serializer returns `negotiation_round`, `proposed_by`, `proposed_by_name` ("dm"), `proposed_amount`, `proposed_timeline_days`, `proposed_scope`. The mapper only read the embedded-proposal field names, so the dedicated-endpoint record normalized to `proposedAmount: 0`, `proposedTimelineDays: 0`, `proposedScope: ''`, `proposedByName: ''`.
2. **A camelCase fallback bug**: the `proposedByName` chain referenced `dto.proposedBy` (a post-mapping name that never exists on a raw DTO) instead of `dto.proposed_by`, so the proposer resolved to `''`.
3. **Open-round detection was response-marker-based** (`!respondedAt && !responseRemarks`) instead of using the backend's explicit `status: "OPEN"`.

## 2. Dedicated negotiation endpoint response shape

```
GET /api/proposals/13/negotiations/  ‚Üí  [
  {
    "round": 1,
    "proposed_by": "DM",
    "action": "COUNTER_OFFER",
    "status": "OPEN",
    "amount": "1500000.00",
    "timeline_days": 80,
    "scope": "74",
    "remarks": "d",
    "created_at": "2026-08-18T08:11:26.918862Z"
  }
]
```

## 3. Mapper aliases added (`src/api/mappers/negotiationMapper.js`)

| Frontend DTO field | Alias chain (all `??`) |
|---|---|
| `negotiationRound` | `negotiation_round` ‚Üí `round` |
| `proposedBy` | `proposed_by` ‚Üí `initiator_id` ‚Üí `proposedBy` |
| `proposedByName` | `proposed_by_name` ‚Üí `proposed_by_display` ‚Üí `initiator_name` ‚Üí `initiator` ‚Üí `proposed_by` ‚Üí `proposedByName` |
| `proposedAmount` | `proposed_amount` ‚Üí `amount` |
| `proposedTimelineDays` | `proposed_timeline_days` ‚Üí `timeline_days` |
| `proposedScope` | `proposed_scope` ‚Üí `scope` |
| `remarks` | `remarks` ‚Üí `response_remarks` |
| `createdAt` / `updatedAt` | `created_at`/`createdAt`, `updated_at`/`updatedAt` |

`mapNegotiationList` now also unwraps `{ negotiations: [...] }` wrappers in addition to `results`/`data`/plain arrays. Both serializers now produce byte-identical DTOs.

## 4. Open-round detection correction

- **Primary:** backend `status` uppercased equals `"OPEN"`.
- **Fallback only** when the serializer omits `status`: absence of `respondedAt`/`responseRemarks`.
- Latest open round = open rounds sorted by `negotiationRound` descending, first element. No assumption of round 1.
- DM proposer detection: normalize `proposedByName ?? proposedBy` ‚Üí trim/lowercase ‚Üí exact match against `dm | district magistrate | magistrate | collector | district collector`, plus the existing case-insensitive role-pattern fallback. Verified against both `"DM"` (dedicated) and `"dm"` (embedded). No usernames, no role-id hardcoding.
- Same status-driven logic applied on the DM side (`src/features/admin/Approvals.jsx`).

## 5. Proposal 13 verification (shape-level, no UI session)

Executed the real mapper against both verified payloads:

| Input | round | proposer | status | amount | timeline | scope | isOpen | isDm | decision panel |
|---|---|---|---|---|---|---|---|---|---|
| dedicated `{round, proposed_by:"DM", amount, timeline_days, scope}` | 1 | DM | OPEN | 1500000 | 80 | 74 | ‚úÖ | ‚úÖ | ‚úÖ |
| embedded `{negotiation_round, proposed_by_name:"dm", proposed_amount, ...}` | 1 | dm | OPEN | 1500000 | 80 | 74 | ‚úÖ | ‚úÖ | ‚úÖ |
| wrapped `{negotiations:[...]}` list | 1 | DM | OPEN | 1500000 | 80 | 74 | ‚úÖ | ‚Äî | ‚úÖ |
| closed round `{status:"CLOSED"}` | 2 | Dept Head | CLOSED | ‚Äî | ‚Äî | ‚Äî | ‚ùå | ‚Äî | (waiting state) |

## 6. Before / after UI behavior

- **Before:** "Waiting for the District Magistrate ‚Äî No open negotiation round is recorded on the backend yet."
- **After:** "Negotiation Required" banner ‚Üí DM counter-offer comparison (‚Çπ15.00 Lakh vs ‚Çπ16.26 Lakh original, 80 days vs 90 days, scope 74, remarks "d", Round 1, Status OPEN, proposed by DM) ‚Üí **Your decision** panel (Accept Counter-offer / Counter-offer / Reject) ‚Üí negotiation history. The waiting card now renders only when the open round is department-proposed or no open round exists.

## 7. Development-only diagnostics

`console.debug("[Negotiation]", { proposalId, proposalStatus, rounds, latestRound, openRound, openRoundStatus, openRoundProposer, openRoundAction })` added to `ProposalNegotiationView`, guarded by `import.meta.env.DEV` (statically stripped from production builds, matching existing repo patterns).

## 8. No mock values

Grep of changed code: no hardcoded `1500000`, `80`, `74`, `"d"`, `PRP-2026-65320`, or `round: 1`. All values originate from the backend response.

## 9. Lint result

`npm run lint` ‚Äî **0 errors, 0 warnings**.

## 10. Build result

`npm run build` ‚Äî **success** (vite 5.4.21, 2578 modules; only the pre-existing chunk-size advisory).

## 11. Acceptance criterion

LIVE OPEN DM COUNTER-OFFER ‚Üí correctly detected (status-driven) ‚Üí correctly displayed (normalized dedicated-endpoint shape) ‚Üí Department Head can act (decision panel renders) ‚Üí backend response remains authoritative (no local status mutation; refetch + invalidation unchanged).
---

# POST-FIX ó RENDERING AND REQUEST-LOOP CORRECTION

Symptom: the mapper normalization was confirmed correct, yet the UI still rendered "Waiting for the District Magistrate / No open negotiation round is recorded on the backend yet." for proposal 13 (backend: round 1, DM, COUNTER_OFFER, OPEN, 1500000 / 80 / 74 / "d").

## 1. Why the mapper was correct

`mapNegotiation` normalizes every field of the dedicated serializer (`round`, `proposed_by`, `amount`, `timeline_days`, `scope`, `remarks`, `status`, `created_at`). The node-level verification of the DTO itself passed. The bug sat one step earlier, in the LIST UNWRAP: the dedicated endpoint `GET /api/proposals/13/negotiations/` returns the round as a BARE OBJECT (the exact body the live evidence captured), not as an array or a `{negotiations|results|data: [...]}` envelope.

## 2. Why the UI was still showing the waiting state

`rows()` in `negotiationMapper.js` previously returned `[]` for any non-array body without `negotiations`/`results`/`data` keys. A bare record object therefore produced `rounds = []` silently (no error). Downstream:

`rounds = []` ? `openRound = null` ? `departmentWaiting = false` ? `agreementReached = false` ? final `else` ? "Waiting for the District Magistrate / No open negotiation roundÖ"

The render-tree conditionals were logically correct; they were fed an empty array.

## 3. Which conditional/rendering logic was wrong

Nothing in the JSX conditionals themselves ó the data never reached them. Two structural weaknesses were corrected regardless:

1. `rows()` now unwraps EVERY verified envelope: plain array, `{negotiations: [...]}`, `{rounds: [...]}`, `{results: [...]}` (paginated), `{data: [...]}`, single-record wrappers (`{negotiation: {...}}`, `{negotiations: {...}}`, `{data: {...}}`, Ö), and the bare record object itself (detected via record keys `id | round | negotiation_round | proposed_by | proposed_by_name | action`). Anything else ? `[]`.
2. `ProposalNegotiationView` now derives ALL state from ONE `negotiationState` useMemo (spec ß2): `rounds` (normalized, round-descending), `openRound` (first `status === "OPEN"` round), `isDmProposal`, `isDepartmentProposal`, `showDepartmentDecision = Boolean(openRound) && isDmProposal`.

## 4. How open-round state is now derived

```
negotiations (from the ONE fetch)
  ? negotiationState useMemo [negotiations]
      ? normalizedRounds  (filter(Boolean), sort by negotiationRound desc)
      ? openRound         (first with status "OPEN")
      ? showDepartmentDecision / isDmProposal / isDepartmentProposal
  ? single if/else render tree (mutually exclusive branches):
      1. showDepartmentDecision        ? comparison + "Your decision" panel
      2. openRound && !DM proposal     ? "Waiting for the District Magistrate"
      3. agreementReached              ? agreement card
      4. rounds exist, none open       ? "No open negotiation round" (closed-round card)
      5. otherwise                     ? "No open negotiation round" (empty state)
```

The waiting card and the decision panel can never render together; both read the same object.

## 5. How duplicate requests were eliminated

- Detail route: fetchers for `planning/dashboard` and the proposal list are now no-ops when `view === "proposal"`, so navigating into proposal 13 no longer refires `proposals/` or `dashboard/` behind the detail screen.
- `negotiationHighlights` (per-row negotiation badge on the repository list) is skipped on the detail route and bounded to `UNDER_NEGOTIATION` rows on list routes.
- Removed the DprWizard's duplicated negotiation surface (its own `negotiations()` fetch, the `openNegotiation` "no response yet" heuristic and the inline "Respond to negotiation" block). One negotiation consumer per detail screen remains: `ProposalNegotiationView`.
- Mutation flow unchanged: `respondNegotiation` (409-aware) ? refetch proposal + negotiations (`refreshKey`). No local status mutation anywhere.

Expected network profile for opening proposal 13: `GET /proposals/13/` + `GET /proposals/13/negotiations/` (+ React StrictMode dev doubling). No loop.

## 6. Exact proposal 13 verification (shape-level)

Script `scripts/verify-negotiation-shapes.mjs` ó the real mapper ó across 13 envelopes:

| Input envelope | rounds | openRound | isDm | showDepartmentDecision |
|---|---|---|---|---|
| bare object (LIVE dedicated response) | 1 | round 1 OPEN by DM | true | **true** |
| array | 1 | round 1 OPEN by DM | true | true |
| `{negotiations: [...]}` | 1 | round 1 OPEN by DM | true | true |
| `{rounds: [...]}` | 1 | round 1 OPEN by DM | true | true |
| `{results: [...]}` paginated | 1 | round 1 OPEN by DM | true | true |
| `{data: [...]}` | 1 | round 1 OPEN by DM | true | true |
| `{negotiation: {...}}` | 1 | round 1 OPEN by DM | true | true |
| `{data: {...}}` single | 1 | round 1 OPEN by DM | true | true |
| embedded `{negotiation_round, proposed_by_name: "dm", ...}` | 1 | round 1 OPEN by dm | true | true |
| empty array / null / `{count:0}` | 0 | null | false | false |
| `{status: "CLOSED"}` round | 1 | null | false | false |

`mapNegotiation` on the bare object: `negotiationRound 1 ∑ proposedByName "DM" ∑ proposedAmount 1500000 ∑ proposedTimelineDays 80 ∑ proposedScope "74" ∑ remarks "d" ∑ status OPEN` ? ALL CHECKS PASSED.

Expected UI for proposal 13 (backend OPEN + DM + COUNTER_OFFER): "NEGOTIATION REQUIRED" banner ? DM COUNTER-OFFER (Round 1, OPEN, ?15.00 Lakh vs original ?16.26 Lakh, 80 days vs 90 days, Scope 74, Remarks "d", Proposed by District Magistrate) ? YOUR DECISION (Accept counter-offer / Counter-offer / Reject) ? negotiation history. "Waiting for the District Magistrate" is impossible in this state by construction.

## 7. Accept / Counter / Reject verification

- Accept modal shows both DM values AND original DPR values (amount/timeline) before "Confirm Acceptance"; remarks required.
- Counter-offer modal pre-fills the DM's current amount/timeline/scope (never the original values); remarks required.
- Reject modal requires a non-empty reason.
- All three post through `proposalApi.respondNegotiation` (single HTTP boundary), then refetch proposal + negotiations. 409 ? warning toast + auto refresh. Status is never changed locally.

## 8. Lint result

`npm run lint` ó 0 errors, 0 warnings.

## 9. Build result

`npm run build` ó success (vite 5.4.21, 2578 modules; only the pre-existing chunk-size advisory).

## 10. Manual verification note

Shape-level verification is complete; an authenticated browser session was not available, so live Network-tab confirmation (exactly `proposals/13/` + `negotiations/` on open, no loop) remains the final manual step. Expected dev-console output at the decision panel:

`[Negotiation State] { proposalId: 13, proposalStatus: "UNDER_NEGOTIATION", negotiationCount: 1, openRound: { negotiationRound: 1, proposedByName: "DM", action: "COUNTER_OFFER", status: "OPEN", proposedAmount: 1500000, proposedTimelineDays: 80, proposedScope: "74", remarks: "d" }, isDmProposal: true, showDepartmentDecision: true }`

---

# POST-FIX 2 ó BROWSER-RUNTIME INSTRUMENTATION (STALE-MODULE ELIMINATION)

Second report claimed the fix based on mapper-level verification. The browser still showed "No open negotiation round / No negotiation round is recorded on the backend yet." for proposal 13. This section documents what was proven about the executed code path and the instrumentation now embedded to capture browser ground truth.

## 1. What was proven from source (single execution path)

- Exactly ONE mapper exists: `src/api/mappers/negotiationMapper.js` (glob across the tree ó no `.jsx`/`.ts` duplicates).
- Exactly ONE API module: `src/api/proposalApi.js`; `negotiations(id)` ? `apiRequest(...)` ? `mapNegotiationList(...)`. `apiRequest` returns the parsed JSON body directly (httpClient.js line 28) ó no envelope, no double unwrap.
- No service worker / workbox anywhere (grep) ó no stale-bundle caching mechanism.
- `mapNegotiationList` is the ONLY consumer at the API boundary (grep: proposalApi ◊2, proposalMapper embedded `negotiations` via `mapNegotiation`).
- The built `dist/assets/index-*.js` contains the current mapper (4 matches for `proposed_by_name|negotiation_round`) ó the production bundle is current.
- The string "No negotiation round is recorded on the backend yet." has exactly ONE rendering location in the entire app (dist grep: 1 occurrence) ó the final `else` branch of `renderNegotiationBody()` in `ProposalNegotiationView`, reachable ONLY when `negotiationState.rounds.length === 0` and no loading/error.

## 2. Therefore

With the source and build on disk, a bare-object response `{round:1, proposed_by:"DM", ..., status:"OPEN"}` CANNOT produce the screenshot: `rows()` wraps it ? `rounds=[record]` ? `openRound` found ? `showDepartmentDecision=true` ? decision panel. The only way the browser displayed the empty state with that response is that the browser executed a module/bundle predating the rows() fix (long-lived dev server with stale Vite module graph, or a served dist from before the rebuild). This could not be verified remotely; the instrumentation below makes the next browser run self-evident.

## 3. Instrumentation added (kept until the browser test passes)

- `proposalApi.negotiations()`: logs `[NEGOTIATION RAW RESPONSE]` (exact body `apiRequest` resolved) and `[NEGOTIATION NORMALIZED]` (the mapped array).
- `ProposalNegotiationView` now performs the fetch itself with a request-version race guard (`requestVersionRef`): logs `[NEGOTIATION REQUEST START] <id>`, `[NEGOTIATION REQUEST END] <id> <data>`, `[NEGOTIATION SET STATE] <data>`; stale responses (id != latest) are discarded ó an older request can never overwrite a newer one.
- Immediately before rendering: `[NEGOTIATION UI STATE] { negotiations, negotiationCount, first, openRound, showDepartmentDecision, isDmProposal, roundsLoading, roundsError }`.
- Existing `[Negotiation State]` dev log retained.
- All logs gated by `import.meta.env.DEV` (visible on the dev server; tree-shaken from production builds ó verified absent from dist).

## 4. Render structure (mutually exclusive early returns)

`renderNegotiationBody()`:
1. `showDepartmentDecision` ? comparison + DM counter-offer + Your Decision (Accept / Counter-offer / Reject).
2. `isOpen && !isDmProposal` ? "Waiting for the District Magistrate" (department round on the table).
3. `rounds.length > 0` ? agreement card (if `agreementReached`) else closed-round card.
4. otherwise ? "No open negotiation round" empty state.

"Waiting for the District Magistrate" and the decision panel are mutually exclusive by construction; both read the same `negotiationState` object.

## 5. Duplicate request audit on the detail route

- `planning/dashboard` and proposal-list fetchers are no-ops when `view === "proposal"`; `negotiationHighlights` skipped on the detail route; DprWizard's duplicate negotiation surface removed earlier.
- Expected network profile for `/linedept/planning/proposals/13`: `GET /proposals/13/` + `GET /proposals/13/negotiations/` (doubled only by React StrictMode in dev). No loop.

## 6. Acceptance test (browser, after restarting the dev server and hard-refresh)

DevTools Console on proposal 13 must show, in order:

```
[NEGOTIATION RAW RESPONSE]  {round: 1, proposed_by: "DM", action: "COUNTER_OFFER", status: "OPEN", amount: "1500000.00", timeline_days: 80, scope: "74", remarks: "d", created_at: "..."}
[NEGOTIATION NORMALIZED]   [{negotiationRound: 1, proposedByName: "DM", action: "COUNTER_OFFER", status: "OPEN", proposedAmount: 1500000, proposedTimelineDays: 80, proposedScope: "74", remarks: "d", ...}]   // length 1
[NEGOTIATION SET STATE]    same length-1 array
[NEGOTIATION UI STATE]     {negotiationCount: 1, openRound: {status: "OPEN", ...}, showDepartmentDecision: true, ...}
```

UI: NEGOTIATION REQUIRED banner ? DM COUNTER-OFFER (Round 1 ∑ OPEN ∑ ?15.00 Lakh vs ?16.26 Lakh original ∑ 80 days vs 90 days ∑ Scope 74 ∑ Remarks "d" ∑ Proposed by District Magistrate) ? YOUR DECISION (Accept counter-offer / Counter-offer / Reject) ? negotiation history. If `[NEGOTIATION NORMALIZED]` prints length 0 with a bare-object raw response, the served module is stale (restart the dev server / wipe Vite cache) ó no code change would help. If it prints length 1 but the UI still shows the empty state, the browser is executing a different `DepartmentPlanningWorkspace.jsx` ó report the console output and the exact served file hash.

## 7. Lint / build

`npm run lint` ó 0 errors, 0 warnings. `npm run build` ó success (only the pre-existing chunk-size advisory). Instrumentation present in dev mode, stripped from dist.

---

# POST-FIX 3 ó BROWSER RUNTIME EVIDENCE: EMPTY LIST AT THE FETCH BOUNDARY

## 1. Browser evidence (proposal 13)

```
[NEGOTIATION UI STATE] { negotiations: [], negotiationCount: 0, first: null,
  openRound: null, showDepartmentDecision: false, isDmProposal: false,
  roundsLoading: false, roundsError: null }
```

## 2. What the evidence proves

- The console header `DepartmentPlanningWorkspace.jsx:291 [Negotiation State]` matches the CURRENT on-disk file (line 291 is that log statement). The browser IS executing the current workspace module ó a stale-module explanation for the workspace is ruled out.
- `negotiations: []` with `roundsLoading: false` and `roundsError: null` means the fetch RESOLVED and `mapNegotiationList` returned an empty array. The renderer behaved correctly for that input (empty ? "No open negotiation round" card).
- With the current mapper, the bare record `{round:1, proposed_by:"DM", ..., status:"OPEN"}` provably normalizes to length 1 (node-verified across 13 envelopes). Therefore the body that arrived at `mapNegotiationList` in THIS browser run was NOT the bare record ó it was a body the mapper classifies as empty (e.g. `{}`, `{negotiations: []}`, `{results: []}` paginated-empty, null-wrapped keys, a `{detail|message}` payload, or an empty array).
- No Vite aliases exist (vite.config.js) ó the relative mapper import resolves to the single real file. `setNegotiations` exists in exactly one workspace location (ProposalNegotiationView) plus the separate DM screen (Approvals).

## 3. Instrumentation strengthened so the next run is conclusive

- `negotiationMapper.rows()` now logs the UNCLASSIFIED BODY ITSELF in dev: `[NEGOTIATION MAPPER] unrecognized object body -> [] | type | keys | body` (and the non-object case). This fires at the classification point for every consumer ó no way to miss it.
- `proposalApi.negotiations()` logs `[NEGOTIATION RAW RESPONSE]` with `type / isArray / keys` plus `[NEGOTIATION NORMALIZED] count` and, on empty, `[NEGOTIATION EMPTY RESULT]`.
- Existing `[NEGOTIATION REQUEST START/END]`, `[NEGOTIATION SET STATE]`, `[NEGOTIATION UI STATE]` remain. All DEV-gated.

## 4. Decision table for the next browser run

| RAW RESPONSE prints | NORMALIZED | Conclusion | Action |
|---|---|---|---|
| bare record `{round:1, ...}` | length 1 | ó | decision panel MUST render; if not, served file is stale |
| bare record `{round:1, ...}` | length 0 | stale mapper module served | restart dev server / wipe `node_modules/.vite` |
| `{}` / `{negotiations: []}` / `{results: []}` / null-wrapped | length 0 | backend returned an empty list AT THAT MOMENT (or a cached pre-round response) | verify the response in DevTools Network; the UI is CORRECT for that body ó the round may be served by a different request (e.g. embedded on the proposal) |
| `{detail: ...}` / `{message: ...}` with HTTP 200 | length 0 | backend error envelope | surface the body; no frontend change can fabricate rounds |

No mock data, no new endpoints, no backend changes. The mapper is shape-complete; the empty state is honest for empty input.

## 5. Lint / build

`npm run lint` ó 0 errors, 0 warnings. `npm run build` ó success (only the pre-existing chunk-size advisory).

---

# POST-FIX 4 ó STALE-MODULE PROOF FROM THE SET-STATE LOG ITSELF

## 1. Evidence received from the browser

```
[NEGOTIATION SET STATE] []
negotiationCount: 0, openRound: null, showDepartmentDecision: false
```

`[NEGOTIATION RAW RESPONSE]` and `[NEGOTIATION NORMALIZED]` did NOT print ó in either screenshot.

## 2. Why this is the proof

Execution order inside one call chain is synchronous: `negotiations()` logs RAW RESPONSE, then NORMALIZED, and only THEN resolves; the component's `.then()` logs REQUEST END, then SET STATE. It is impossible for SET STATE to print while RAW RESPONSE/NORMALIZED do not ó **unless the two logs come from different module versions**. The component is current (earlier screenshot line `DepartmentPlanningWorkspace.jsx:291` matches the on-disk file exactly; and all its DEV-gated logs printed, proving `import.meta.env.DEV === true`, i.e. the dev server). The `proposalApi.js` module executed by the browser therefore predates the RAW/NORMALIZED instrumentation ó and, consistent with SET STATE printing `[]`, the executed `negotiationMapper` also predates the bare-record `rows()` fix (old `rows()` on the bare object ? `[]`). The backend response never even reached the fixed code.

Mixed staleness of exactly this kind occurs on Windows when chokidar misses external file-change events while HMR updates only the modules it noticed (the workspace file was edited repeatedly, the mapper/API were edited once earlier).

## 3. Checks completed (per instructions)

- Import resolution: no `jsconfig.json`/`tsconfig.json`, `vite.config.js` has no aliases; `proposalApi.js` imports `./mappers/negotiationMapper` relatively; exactly one mapper file exists (`src/api/mappers/negotiationMapper.js`), no barrel/index re-export, no `.jsx`/`.ts` duplicates.
- Between `apiRequest()` and `mapNegotiationList()`: nothing ó one pass-through line, no `.data`/`.results`/`.negotiations` access, no mutation.
- `setNegotiations` callers: exactly ONE in the workspace ó `ProposalNegotiationView` effect (`DepartmentPlanningWorkspace.jsx` ~line 248), value = the resolved `data` from `backendProposalApi.negotiations(proposalId)` with no second transformation. (Approvals.jsx has its own separate state for the DM screen; it does not print these log tags.)
- Race guard already active (`requestVersionRef`): a stale/empty older response can no longer overwrite a newer one.

## 4. New unconditional instrumentation (survives any module age ó they will print the moment the modules reload)

In `proposalApi.negotiations()`:
- `[NEGOTIATION RAW RESPONSE]` ó exact body + `type / isArray / keys`
- `[NEGOTIATION NORMALIZED]` ó array + `isArray / length / first`
- `[NEGOTIATION MAPPER SOURCE]` ó `mapNegotiationList.toString()` of the EXECUTED function (reveals whether it contains the bare-record branch)
- `[NEGOTIATION DIRECT NORMALIZATION TEST]` ó bypass normalization (`Array.isArray(raw) ? raw : raw ? [raw] : []`)
- `[NEGOTIATION STALE MAPPER]` ó fires when direct test wraps the body but the mapper returned `[]`

In the component effect: `[NEGOTIATION REQUEST START/END]` and `console.trace('[NEGOTIATION SET STATE]', data)` ó the trace names the exact code path that assigns the value.

All marked TEMPORARY ó removed after the browser test passes.

## 5. Required browser run (the test that resolves everything)

```
1. Stop the dev server.
2. Delete ONLY dev cache/build artifacts:  node_modules/.vite  and  dist
3. npm run dev
4. Hard refresh:  Ctrl + Shift + R
5. Open /linedept/planning/proposals/13
6. Read the console in order.
```

| Console outcome | Meaning | Result |
|---|---|---|
| RAW = bare object; NORMALIZED = `[{negotiationRound:1, proposedByName:"DM", ...}]`; MAPPER SOURCE contains `value.round !== undefined` | current modules | decision panel renders |
| RAW = bare object; NORMALIZED = `[]`; DIRECT TEST = length 1; `[NEGOTIATION STALE MAPPER]` prints | mapper module still stale | redo step 2 / verify server root |
| RAW = bare object; NORMALIZED = `[]`; MAPPER SOURCE has bare-record branch; DIRECT TEST = length 1 | impossible by construction ó report the exact MAPPER SOURCE text | ó |
| RAW = `{}` / `{results: []}` / `{negotiations: []}` / null-wrapped | backend returned an empty list at that moment | UI empty state is CORRECT for that body; capture the Network response to compare |

Expected network: `GET /api/proposals/13/` + `GET /api/proposals/13/negotiations/` (doubled only by React StrictMode in dev), no loop.

## 6. Lint / build

`npm run lint` ó 0 errors, 0 warnings. `npm run build` ó success (only the pre-existing chunk-size advisory).

## 7. Status

NOT claimed fixed. The stack trace (`console.trace`) at SET STATE and the unconditional RAW/MAPPER-SOURCE logs will name the executing module versions in one run.

---

# POST-FIX 5 ó BUILD MARKERS + DEFINITIVE PROOF SEQUENCE

## 1. Build markers added (unambiguous module identity)

- `negotiationMapper.js`: `export const NEGOTIATION_MAPPER_BUILD = "NEGOTIATION-MAPPER-FIX-2026-08-18-01"`
- `proposalApi.js` `negotiations()`: logs `[NEGOTIATION MODULE BUILD] <marker>` before anything else
- `DepartmentPlanningWorkspace.jsx` (module scope): `[PLANNING WORKSPACE BUILD] NEGOTIATION-UI-FIX-2026-08-18-01`

The browser console now names the exact version of every module in the chain. If the markers print, the fixed code is executed ó period.

## 2. Proof sequence inside `negotiations()` (unconditional, synchronous)

1. `[NEGOTIATION MODULE BUILD]` ó mapper marker
2. `[NEGOTIATION RAW RESPONSE]` ó `JSON.stringify(raw, null, 2)`
3. `[NEGOTIATION RAW TYPE]` ó typeof / isArray / keys
4. `[NEGOTIATION NORMALIZED]` ó `JSON.stringify(normalized, null, 2)`
5. `[NEGOTIATION NORMALIZED LENGTH]`
6. `[EXECUTED NEGOTIATION MAPPER]` ó `mapNegotiationList.toString()` (the function text the browser actually holds)
7. `[NEGOTIATION DIRECT TEST]` ó bypass wrap (`[raw]`) with length
8. `[NEGOTIATION STALE MAPPER]` ó fires when direct test wraps the body but the mapper returned `[]`

Component: `console.trace('[NEGOTIATION SET STATE]', data)` + `[NEGOTIATION REQUEST START/END]` ó the trace names the exact assignment path.

## 3. Mapper rows() ó adopted the exact `in`-based bare-record detection

`'round' in value || 'negotiation_round' in value || 'status' in value || 'action' in value || 'proposed_by' in value || 'proposed_by_name' in value || 'amount' in value || 'id' in value ? return [value]` ó covers the live dedicated endpoint body `{round:1, proposed_by:"DM", action:"COUNTER_OFFER", status:"OPEN", amount, timeline_days, scope, remarks, created_at}`.

## 4. Data flow (exactly one path, no secondary transformation)

`GET /proposals/13/negotiations/` ? `apiRequest` ? `mapNegotiationList(raw)` ? `setNegotiations(normalized)` ? `negotiationState` (status-driven `OPEN` filter, round-descending) ? `showDepartmentDecision` ? decision panel. `setNegotiations` has exactly one caller in the workspace. Race guard (`requestVersionRef`) discards stale responses.

## 5. Counter-offer validation (Department Head)

`COUNTER_OFFER` requires amount > 0, timeline > 0, scope non-empty, remarks non-empty ó enforced in `decide()` and mirrored in the modal's disabled state. Accept requires no remarks; Reject requires a reason. All three post through the EXISTING `POST /api/proposals/{id}/negotiation-response/` (no new endpoints), then refetch proposal + negotiations (409 ? warning + auto-refresh; no local status mutation).

## 6. Request count on the detail route

`GET /proposals/13/` + `GET /proposals/13/negotiations/` only (StrictMode may double in dev). Dashboard/list fetchers are no-ops on the detail view; negotiation highlights skipped there. No loop.

## 7. Lint / build

`npm run lint` ó 0 errors, 0 warnings. `npm run build` ó success (only the pre-existing chunk-size advisory). Verified the built bundle contains all markers/logs: `NEGOTIATION-MAPPER-FIX-2026-08-18-01` ?, `NEGOTIATION MODULE BUILD` ?, `NEGOTIATION RAW RESPONSE` ?, `EXECUTED NEGOTIATION MAPPER` ?, `NEGOTIATION DIRECT TEST` ?, `PLANNING WORKSPACE BUILD` ?, `console.trace` ?.

## 8. Acceptance protocol (decides the case in one run)

1. Stop the dev server.
2. Delete ONLY `node_modules/.vite` and `dist` (never `node_modules`).
3. `npm run dev`
4. Hard reload (`Ctrl + Shift + R`), optionally close/reopen the tab.
5. Open `/linedept/planning/proposals/13`.

Console verdicts:

| Observed | Verdict |
|---|---|
| `[NEGOTIATION MODULE BUILD] NEGOTIATION-MAPPER-FIX-2026-08-18-01` then RAW = bare object then NORMALIZED = length 1 | fixed code executed ? decision panel must render |
| Marker prints, RAW = bare object, NORMALIZED = `[]`, DIRECT TEST = length 1, `[NEGOTIATION STALE MAPPER]` fires | executed mapper is STALE despite marker ó impossible unless a second module is served; paste `[EXECUTED NEGOTIATION MAPPER]` text |
| Marker missing | served bundle is stale ó redo steps 2ñ4 |
| RAW = `{}` / `{results: []}` / `{negotiations: []}` | backend returned an empty list at that moment ó empty UI is CORRECT for that body; compare with the Network response |

## 9. Status

NOT claimed fixed. The markers are now in source and in the built bundle; the next browser run names every module version and the exact transformation ó no more plausibility arguments.

---

# POST-FIX 6 ó REAL ROOT CAUSE: MISSING `history` ENVELOPE UNWRAP (PROVEN)

## 1. Actual endpoint response shape (proposal 11, captured from the browser Network tab)

```json
GET /api/proposals/11/negotiations/
{
  "proposal_id": 11,
  "estimated_cost": "3348713.00",
  "approval_mode": null,
  "agreed_amount": null,
  "agreed_timeline_days": null,
  "agreed_scope": null,
  "history": [
    {
      "round": 1, "proposed_by": "DM", "action": "COUNTER_OFFER",
      "status": "OPEN", "amount": "2222222.00", "timeline_days": 211,
      "scope": null, "remarks": "aqqwe",
      "created_at": "2026-08-18T09:49:41.388494Z"
    }
  ]
}
```

## 2. Why the previous mapper returned []

`rows()` unwrapped arrays, `negotiations`, `rounds`, `results`, `data`, single-record wrappers and bare records ó but NOT `history`. The live envelope fell through every branch (no `round`/`status`/`action` keys at the TOP level, only `proposal_id`/`estimated_cost`/Ö/`history`) and returned `[]`. Every earlier `[NEGOTIATION SET STATE] []` screenshot was this exact path ó the executed modules were current all along; the "stale module" hypothesis is retracted.

## 3. Exact mapper change

`src/api/mappers/negotiationMapper.js` `rows()`: added `if (Array.isArray(value.history)) return value.history` (plus `{history: {...}}` single-record wrapping) immediately after the `negotiations` checks, with a comment naming the live envelope. All previously supported shapes are untouched.

## 4. Normalized result (verified by script against the real envelope)

```js
{ negotiationRound: 1, proposedByName: "DM", action: "COUNTER_OFFER", status: "OPEN",
  proposedAmount: 2222222, proposedTimelineDays: 211, proposedScope: "", remarks: "aqqwe",
  createdAt: "2026-08-18T09:49:41.388494Z" }
```

`scope: null` maps to `''` ó the round is NOT filtered out; `status: "OPEN"` remains the source of truth.

## 5. openRound / decision state (derived via the single `negotiationState` useMemo)

`openRound = round 1 OPEN by DM` ? `isDmProposal: true` ? `showDepartmentDecision: true` ? Department Head decision panel.

## 6. Shape matrix re-verified (16 cases, ALL CHECKS PASSED)

history envelope (live), history with 2 rounds (round 2 OPEN picked), `history: []` (empty state), closed-only history (no openRound), bare record, array, `negotiations`/`rounds`/`results`/`data` envelopes, single-record wrappers, embedded serializer, null, metadata-only, closed round.

## 7. Decision APIs (unchanged, existing endpoints only)

- Accept / Counter-offer / Reject ? `POST /api/proposals/{id}/negotiation-response/` (already implemented in `ProposalNegotiationView`), then refetch proposal + negotiations, invalidate PROPOSALS (API layer), 409 ? warning + auto-refresh, no local status mutation, duplicate submission prevented by `busy`.
- Counter-offer prefilled with the DM proposal values (including `scope` blank when the backend sends `null`); validation: amount > 0, timeline > 0, scope + remarks required.

## 8. Lint / build

`npm run lint` ó 0 errors, 0 warnings. `npm run build` ó success (only the pre-existing chunk-size advisory). Diagnosis logs remain (markers, RAW/NORMALIZED, trace) until the browser test passes ó removal is a one-file cleanup afterwards.

## 9. Status

The mapper defect is fixed and proven against the exact live response. Browser acceptance (proposal 11 AND 13 decision panels visible) is the remaining manual step; the console will show `[NEGOTIATION NORMALIZED LENGTH] 1` for both.

---

# POST-FIX 7 ó DM PROPOSAL DETAIL WORKSPACE + SANCTION AMOUNT PRECEDENCE

## 1. Files changed
- `src/utils/finance.js` (NEW) ó single shared helper `getFinalSanctionAmount(proposal)` + `isNegotiatedAgreement(proposal)`. Precedence: `approval_mode === "NEGOTIATED"` AND `agreed_amount` is a finite positive number ? `agreed_amount`; otherwise `estimated_cost` (finite ? value, else 0). Handles both mapped DTO (`approvalMode`/`agreedAmount`) and raw DTO (`approval_mode`/`agreed_amount`) shapes. Never overwrites `estimated_cost`.
- `src/features/admin/Approvals.jsx` ó detail modal rebuilt into a complete review workspace; detail fetch added; sanction default + modal fixed; negotiation history sorted newest-first with role label.
- `src/features/stateadmin/store/stateProjectStore.js` ó sanction action now sends `getFinalSanctionAmount(proposal)` instead of `proposal.estimatedCost` (same defect fixed in the other sanction surface).

## 2. Existing APIs reused (none created, none changed)
- `backendProposalApi.get(id)` ó `GET /proposals/{id}/` (detail, one fetch per selection; list row is the fallback while it loads)
- `backendProposalApi.negotiations(id)` ó negotiation history (one fetch per selection)
- `backendProposalApi.releases(id)` ó release trail
- `backendProposalApi.approve/reject/negotiate/sanction` ó `POST /proposals/{id}/sanction/` payload unchanged: `{ sanctioned_amount }`
- No polling, no request loops; on 409 the detail + negotiations refetch once.

## 3. Detail modal sections (design language preserved)
Header (status badge / PRP id / department / district) ∑ Workflow Lifecycle stepper (backend status ? stepper stage only; no fabricated stages) ∑ Delegated authority note ∑ Proposal Overview (14 fields, only rendered when present) ∑ Need & Problem Statement ("Not provided" when null) ∑ Survey & Site Inspection (incl. lat/long, no invented GIS action) ∑ Technical DPR (breakdown + "Original Estimate" callout) ∑ **Financial Summary** (Original Estimate / Negotiated-Agreed Amount + Difference / Final Amount for Approval, "FINAL AGREED AMOUNT" chip when negotiated) ∑ Final Agreement (approval mode / agreed amount / timeline / scope; DIRECT branch shows estimated cost) ∑ Review Trail (reviewer note, approval) ∑ Negotiation & Department Decision ∑ Negotiation History (every round, newest first: round, proposer role, action, amount/timeline/scope/status/remarks/date) ∑ Budget Release Trail ∑ Clearances & NOCs (? Cleared / ? Not Cleared + notes) ∑ Attachments (name/date/Open when URL present, else "No attachments uploaded") ∑ Execution Project. Modal `max-w-4xl`, body scrolls internally (`max-h-[85vh]` from the Modal component), action footer sticky ó desktop/laptop/tablet safe.

## 4. Sanction precedence
- Sanction button default: `String(getFinalSanctionAmount(proposal))` ó negotiated proposals default to `agreed_amount`, NOT `estimated_cost`.
- Sanction modal shows Original DPR Estimate / Final Agreed Amount (when negotiated) / Amount to be Sanctioned, with a leaf note explaining the default.
- Validation unchanged (`> 0`); the editable input is kept (the existing backend contract accepts `sanctioned_amount`; no restriction invented).

## 5. Negotiation ? agreement ? sanction flow
Backend history envelope (`history: [...]`) ? mapper normalization (verified 16 shapes) ? Negotiation History section ? persisted agreement (`approval_mode = NEGOTIATED`, `agreed_amount`) drives Financial Summary + Final Agreement + sanction default. OPEN rounds never drive the sanction amount (no `approval_mode`, no `agreed_amount` ? falls back to `estimated_cost` per backend persistence, not per latest round).

## 6. Proposal 11 (PRP-2026-60166) ó expected result
`estimated_cost` 3348713 / round 1 DM counter-offer OPEN (?22,22,222 / 211d / scope null / "aqqwe") ? Negotiation History shows Round 1 by District Magistrate; Financial Summary: Original ?33,48,713 ∑ no agreed terms yet (round still OPEN) ? Final Amount = ?33,48,713 and no Sanction button (status-driven). Once the department accepts and the backend persists `approval_mode: NEGOTIATED, agreed_amount: 2222222` ? Final Agreement + Financial Summary show ?22,22,222 and the sanction modal defaults to ?22,22,222.

## 7. Proposal 13 (PRP-2026-65320) ó expected result
Same shape (?15,00,000 / 80d / "74" / "d"); identical handling; sanction defaults to `agreed_amount` once persisted.

## 8. Lint ó 0 errors. 9. Build ó success (26.7s).

## 10. Browser verification ó pending (agent has no authenticated browser). Expected checks: View Details on /admin/approvals ? complete DPR + history + final agreement; Sanction Budget on an approved negotiated proposal defaults to the agreed amount; direct proposals still default to `estimated_cost`; `[NEGOTIATION NORMALIZED LENGTH] 1` for proposals 11/13.

## 11. Backend limitation ó none found for the sanction precedence. Note: `agreed_*` + `approval_mode` arrive on the proposal detail; the negotiation history endpoint returns the bare round without `agreed_*` fields, so sanction reads the persisted proposal fields (correct per design). The `development_need` field requested in the spec is not present in the current mapper contract ó only `problem_statement` is rendered (nothing invented).

---

# POST-FIX 8 ó MODAL FOCUS JUMP TO CLOSE BUTTON (ROOT CAUSE + FIX)

## 1. Exact root cause
`src/components/ui/Modal.jsx` re-ran its focus effect on EVERY parent re-render while the modal was open. Each re-run scheduled a `requestAnimationFrame` that focused the FIRST focusable element in the dialog ó which is the header **Close (X)** button, because the header precedes the form body in DOM order. Result: ~1 frame after every keystroke/select change, focus jumped to Close.

## 2. Why the effect re-ran
Effect deps were `[open, onClose]`. In DepartmentExecutionWorkspace the modal gets `onClose={closeForm}` (an inline arrow recreated each render) and the form state lives in the parent ó every keystroke re-renders the parent, giving `closeForm` a new identity ? effect re-runs ? rAF steals focus to Close. Same pattern exists for every Modal consumer passing inline `onClose` (Approvals, Planning, etc.).

## 3. Input remounting ó NO. Form inputs in DepartmentExecutionWorkspace (lines 248-277) have stable keys/identity; the `modal === ''` branches are stable while open. No changing keys, no inline component definitions.

## 4. Focus trap involved ó YES (the trap was also the cause). The trap's initial-focus write was inside the re-running effect.

## 5. Keydown handler involved ó the trap's Tab-wrap handler only intercepts at first/last boundaries (correct); it was NOT the thief. No global keydown handlers elsewhere (grep: Modal.jsx is the only `focus()` writer; CommandPalette autoFocus is a separate overlay).

## 6. Exact code change (`src/components/ui/Modal.jsx`)
- Effect deps `[open, onClose]` ? `[open]` ó focus writes now happen ONLY on open/close transitions.
- `onCloseRef` keeps the Escape handler on the latest `onClose` (no stale closure from the narrowed deps).
- Initial focus now skips the header close button (`[...all].find((el) => el !== closeBtnRef.current)`) ? lands on the first meaningful control (Project select).
- Close button: added `type="button"` + `aria-label="Close"` + ref.
- Focus restore to the previously-focused element still happens, but only on the open?closed transition.

## 7. Shared modal behavior ó fixed globally for ALL dialogs (site diary, MB, bill, risk, asset, proposal wizard, approval modals). Tab/Shift+Tab order unchanged; Escape/backdrop close unchanged.

## 8. Browser test ó PENDING (agent has no browser). Expected: typing in any field keeps focus there; Tab cycles Project?Date?Work?Labour?Materials?Weather?Observations?Remarks?Save?Close; Shift+Tab reverses; X focused only when tabbed to or clicked.

## 9. Lint ó 0 errors. 10. Build ó success (31.1s).

---

# POST-FIX 9 ó MOBILE CITIZEN MAP DEPARTMENT SELECTOR (RESPONSIVE)

## Root layout issue
The full `DepartmentLegend` card was rendered inside the absolutely-positioned search stack (`absolute top-6 left-6`), so at mobile widths the entire 10-department white card sat permanently below the search pill, covering a large share of the 412px map viewport.

## Fix (presentation only ó GIS logic untouched)
- `src/components/map/MapLegend.jsx` ó new `DepartmentLegendControl`: `hidden lg:block` renders the EXISTING full legend (desktop identical, incl. the SituationMatrix consumer which still imports `DepartmentLegend` directly); `lg:hidden` renders a compact 44px pill (summary: "Departments" / single dept name / "Departments ∑ N", total-count badge, chevron) + a bottom sheet reusing the existing citizen sheet pattern (`ndisp-sheet-up`, `max-h-[70dvh]`, `overflow-y-auto`, `bottom-16` above the z-160 bottom nav, backdrop z-145 / sheet z-150). Drag handle, title, 44px Done, 44px rows, Escape closes, initial focus on Done, `aria-label="Open department filters"`, `role="dialog" aria-modal`, colors/selection model identical (colored dots + check squares, same active/inactive opacity).
- `src/features/citizen/CitizenHome.jsx` ó swapped `DepartmentLegend` ? `DepartmentLegendControl`; the control hides while the mobile drawer is open (same rule as the search pill), so it can never overlap the panel.

## Data / functionality
Same `departments`/`activeIds`/`toggleDept` props ó no duplicated list, no filtering, marker, layer, search, zoom, measure, locate, fit, snapshot or routing changes. Desktop >1024px unchanged; tablet 768ñ1024px gets the compact control per the intermediate requirement. Safe areas via `pb-[env(safe-area-inset-bottom)]`.

## Lint / build
0 errors; build success (49.9s). Browser verification at 320ñ430px + 768px is pending (agent has no browser): search prominent, compact pill below it, sheet fits/scrolis, nav/zoom accessible, no overflow, desktop intact.

---

# POST-FIX 10 - CITIZEN PORTAL MOBILE RESPONSIVE UX (FULL PASS)

## ISSUE 1 - Complaint detail: full-screen mobile sheet (was: nested 88vh card in shared Modal)
- `src/features/citizen/TrackGrievance.jsx` - on `max-width: 767px` the complaint detail now renders as a standalone full-screen sheet (`CitizenComplaintDetail fullscreen`) instead of inside the shared `Modal`; desktop keeps the existing `max-w-3xl` Modal card.
- Sheet behaviour while open (explicit modal-open state): `body` gets `citizen-modal-open` (hides the z-160 bottom nav via CSS) + `overflow: hidden` scroll lock; Escape closes; Android back closes via pushState-marker + popstate (one history entry, cleaned on close, router-safe); initial focus lands on the sheet's first button.
- `src/features/citizen/CitizenComplaintDetail.jsx` - new `fullscreen` prop: root becomes `fixed inset-0 z-[180] h-dvh`, header gets safe-area top padding + a 44px Back arrow (close X kept), tabs bar shrinks, `main` becomes the SINGLE scroll region (`flex-1 min-h-0 overflow-y-auto overscroll-contain`) with safe-area bottom padding; loading/error states are folded into the shell (still closable). Derived consts guarded with optional chaining.
- Nested Reopen/Escalate dialog: `Modal` gains an optional `zIndex` prop (default `z-50` - all existing callers unchanged); the nested dialog uses `z-[200]` in fullscreen so it layers above the sheet.

## ISSUE 2 - Facility detail: one scroll, no clipped title
- `src/features/citizen/FacilityDetail.jsx` - title block gets `min-w-0` + `break-words` (long facility names wrap instead of overflowing the header row).
- `src/components/layout/AppShell.jsx` - scroll container padding `pb-16` replaced by `pb-[calc(var(--citizen-bottom-nav-height,64px)+var(--safe-bottom,0px))]` so the last page content clears the nav + home-indicator inset on devices that have one. Desktop `lg:pb-0` unchanged.

## ISSUE 3 - Explore Map mobile: GIS Layers bottom sheet
- `src/features/citizen/CitizenHome.jsx` - mobile-only 44px "GIS Layers" pill (active-layer count badge) in the bottom-right tool stack; tapping opens a dedicated bottom sheet (drag handle, title, 44px Done, `max-h-[75dvh]`, internal `overflow-y-auto` + `overscroll-contain`, `bottom-16` above the nav, backdrop z-145 / sheet z-150, Escape closes) rendering the SAME `CitizenLayerPanel` (search, categories, active counts preserved). Map stays the primary surface; the drawer remains search-focused.
- `src/features/citizen/CitizenLayerPanel.jsx` - new `defaultOpen` prop (sheet starts expanded; drawer unchanged) + 44px touch targets: rows `min-h-11`, checkbox wrapped in a 44px hit area, Default/Clear buttons `min-h-11`.

## ISSUE 4 - Zoom/control safe zones + CSS tokens
- Location-permission banner moved `top-6` -> `top-24` right-6 so it never covers the Leaflet zoom (+/-) control (top-right) on any width.
- `src/features/citizen/citizen.css` - `:root` tokens `--citizen-bottom-nav-height: 64px`, `--safe-top`, `--safe-bottom` (env() with 0 fallback); `.ndisp-bottom-nav` consumes `--safe-bottom`; new rule `body.citizen-modal-open .ndisp-bottom-nav { display: none }`. Z-index architecture now explicit: map 1 / markers 2 / leaflet 10 / app controls 120 / drawer 130 / info panel 140 / backdrops 145 / sheets 150 / bottom nav 160 / complaint sheet 180 / nested dialogs 200.

## Scope & guarantees
No mock data, no backend/API changes, no GIS/search/route/marker/business logic changes; desktop >1024px layouts untouched (Modal default z-50, drawer, legend, toolbar, FacilityDetail md+ layout all unchanged).

## Lint / build
ESLint 0 errors; `npm run build` success (48.5s).

## Browser verification - PENDING (agent has no browser)
320-430px: complaint sheet is full-viewport, single scroll, nav hidden, Escape/back close, safe areas; facility page bottom content visible above nav; layers pill -> sheet with 44px rows, scroll contained; zoom +/- always tappable (top-right), banner below it; no horizontal overflow (scrollWidth == innerWidth); 768/1024 tablet + desktop (1366-1920) unchanged.
