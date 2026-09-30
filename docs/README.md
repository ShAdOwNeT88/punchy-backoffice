# Project documentation

This directory is the durable source of truth for the back office's current behaviour,
implementation, decisions and change history.

| Document | Purpose |
|---|---|
| [`REQUIREMENTS.md`](REQUIREMENTS.md) | Current functional contract and externally observable behaviour |
| [`TECHNICAL.md`](TECHNICAL.md) | Current implementation, boundaries, dependencies and operations |
| [`DECISIONS.md`](DECISIONS.md) | Durable decisions with context, rationale and consequences |
| [`specs/`](specs/) | Accepted designs and reasoning for individual changes |
| [`plans/`](plans/) | Implementation plans for individual changes |
| [`../openapi/punchy.yaml`](../openapi/punchy.yaml) | API contract with the backend and the mobile app |

## Lifecycle

1. Explain and clarify the desired change.
2. Save the accepted design in `specs/`.
3. Save the implementation plan in `plans/`.
4. Implement and verify the change.
5. Reconcile `REQUIREMENTS.md`, `TECHNICAL.md` and `DECISIONS.md` with the verified result.

Specifications and plans preserve how a change was designed and delivered. Requirements and
technical documentation describe the system as it exists now; they are not changelogs.

## Maintenance rules

- Keep statements evidence-based and mark unknown information explicitly.
- Update documentation in the same change that makes it stale.
- Preserve accepted decisions; supersede them with a new dated entry.
- Do not store credentials, secrets, personal data or environment-specific access details here.
