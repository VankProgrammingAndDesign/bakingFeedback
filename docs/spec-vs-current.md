# Spec vs Current Implementation

## Mismatches
- **Cosmos database name:** Spec says `bakingFeedback`, current code defaults to `bakingFeedbackDB` (overridable via `COSMOS_DATABASE`).
- **App Insights:** Mentioned in spec, not configured or instrumented in code.
- **Optional QR signature:** Mentioned in spec, not implemented in API validation.
- **Form identity:** Spec references `bakeSessionID` field; current implementation uses `id` as the lookup key in the `forms` container.

## Matches
- Frontend routes: `/r`, `/survey`, `/thanks`
- Backend endpoints: `GET /api/form`, `POST /api/submit`
- Containers: `forms`, `submissions`
