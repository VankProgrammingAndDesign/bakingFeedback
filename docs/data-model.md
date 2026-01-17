# Data Model

## Cosmos DB
Database: `bakingFeedbackDB` (default in code)
Containers: `forms`, `submissions`

Partition key is not specified in code; it depends on the Cosmos container configuration. Dashboard queries may be cross-partition unless the container is partitioned by `bakeSessionID` (or another filterable field).

## Forms Container
Forms are fetched by `id` matching the `bakeSessionID` from the QR link.

Example document:
```json
{
  "id": "rv1-test-1",
  "title": "Bakery Feedback",
  "version": "v1",
  "questions": [
    {
      "id": "q1",
      "type": "scale",
      "prompt": "How tasty was the bread?",
      "required": true,
      "min": 1,
      "max": 5
    },
    {
      "id": "q2",
      "type": "text",
      "prompt": "Any comments or improvements?",
      "required": false
    }
  ]
}
```

## Submissions Container
Submissions are created on `/api/submit`.

Example document:
```json
{
  "id": "6b2d6cbe-73c1-4df2-9c3d-2f4a7b8fce12",
  "bakeSessionID": "rv1-test-1",
  "submitterName": "ryan",
  "answers": {
    "q1": 4,
    "q2": "Great flavor"
  },
  "formVersion": "v1",
  "submittedAtUtc": "2026-01-11T02:34:56.000Z"
}
```

## Dashboard Data Shaping
The dashboard needs question text alongside answers. Submissions only store `answers` by question ID, so `/api/submissions` joins with the `forms` container and returns a `qa` array with `{ questionId, questionText, answerValue }`.

The dashboard filter refers to `recipeId`, which maps to `bakeSessionID` in the current data model.
