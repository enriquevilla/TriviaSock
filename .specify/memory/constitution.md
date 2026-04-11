<!-- Sync Impact Report
Version Change: N/A → 1.0.0 (initial ratification)
Modified Principles: N/A (new document — template placeholders replaced)
Added Sections: Core Principles (I–III), WebSocket Standards, Quality Gates, Governance
Removed Sections: [SECTION_2_NAME], [SECTION_3_NAME] placeholders replaced with concrete sections
Templates Requiring Updates:
  - .specify/templates/plan-template.md ✅ no changes needed (Constitution Check is generic)
  - .specify/templates/spec-template.md ✅ no changes needed
  - .specify/templates/tasks-template.md ✅ no changes needed (Security hardening task already present)
Follow-up TODOs: None — all placeholders resolved
-->

# TriviaSock Constitution

## Core Principles

### I. Simplicity First

Code MUST be simple, readable, and maintainable above all else. Complexity MUST be justified —
if a simpler approach exists, it MUST be taken. Every abstraction, pattern, or architectural
decision requires explicit rationale. Prefer flat structures over deep hierarchies. Prefer
explicit logic over implicit magic. Premature optimization is a violation of this principle.

**Rationale**: TriviaSock's inherent complexity lives in game logic and WebSocket coordination,
not in framework abstractions. Keeping code simple enables fast debugging, easy onboarding, and
confident refactoring. When in doubt, write the boring version.

### II. WebSocket Security

All WebSocket connections and messages MUST be validated, authenticated, and sanitized before
processing. The server MUST reject malformed, unauthenticated, or unauthorized messages with an
appropriate typed error response. Input from any client MUST be treated as untrusted.

**Non-negotiable rules**:

- Every incoming message MUST be validated against a known schema before any processing occurs.
- Authentication is defined as successful name registration via `lobby:join`. Before
  authentication, a client is a read-only observer and MAY receive `state:full` broadcasts
  (player list, current phase) but MUST NOT be permitted to send any game action messages.
  Any game action received from an unauthenticated connection MUST be rejected with
  `NOT_AUTHENTICATED`.
- Message payloads MUST be sanitized to prevent injection attacks.
- Sensitive data (tokens, credentials, internal IDs) MUST NOT be logged or broadcast to clients.

**Rationale**: WebSocket servers are long-lived and stateful, handling many concurrent clients.
A single security gap exposes all connected players simultaneously. Security is non-negotiable
in a networked multiplayer application.

### III. State Consistency & Synchronization

Game state MUST be the single source of truth and MUST remain consistent across all connected
clients at all times. State mutations MUST be atomic and ordered. Clients receive authoritative
state from the server only; client-side state is display-only and MUST NOT influence server
decisions.

**Non-negotiable rules**:

- The server MUST own and control all authoritative game state.
- State changes MUST be broadcast to all relevant clients atomically — no partial updates.
- Race conditions in message handling MUST be prevented via sequential processing or explicit
  synchronization mechanisms, documented in code.
- Reconnecting clients MUST receive a full state snapshot before being allowed to participate.

**Rationale**: In a real-time multiplayer trivia game, inconsistent state causes unfair gameplay,
near-impossible-to-reproduce bugs, and a broken user experience. Consistency is a hard contract,
not a best-effort goal.

## WebSocket Standards

Connection lifecycle, message protocol, and error handling MUST follow these standards across
all features:

- **Connection**: Authentication MUST complete within the first message exchange after opening.
- **Messages**: All messages MUST use a consistent envelope: `{ type: string, payload: object }`.
- **Errors**: All error conditions MUST produce a typed error response — never a silent failure.
- **Disconnection**: Graceful disconnection MUST trigger proper cleanup of player and room state.
- **Reconnection**: The protocol MUST support reconnection with full server-side state recovery.

## Quality Gates

Before any feature is considered complete, the following checks MUST pass:

- Code review MUST confirm adherence to Principle I (no unjustified complexity introduced).
- All WebSocket message handlers MUST have documented input validation per Principle II.
- State mutation paths MUST be traceable and covered by tests per Principle III.
- No feature may be merged that introduces a known race condition without explicit mitigation
  documented inline in code comments.

## Governance

This Constitution supersedes all other project conventions and practices. Amendments require a
documented rationale and impact assessment before merging. Any change that materially alters or
removes a principle constitutes a MAJOR version bump and MUST include a migration plan for
affected code.

**Versioning Policy**:

- MAJOR: Principle removed, redefined, or backward-incompatible governance change.
- MINOR: New principle or section added; materially expanded guidance.
- PATCH: Clarifications, wording improvements, or non-semantic refinements.

**Compliance**: All PRs and code reviews MUST verify adherence to this Constitution. Complexity
violations MUST be justified in a Complexity Tracking table in the relevant plan document.

**Version**: 1.0.1 | **Ratified**: 2026-04-11 | **Last Amended**: 2026-04-11
