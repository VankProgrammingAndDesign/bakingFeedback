# API Reference

Base path: `/api`

## GET /api/form
Fetches a form definition by bake session ID. If not found, a default form is returned.

### Request
Query params:
- `bakeSessionID` (string, optional)

Example:
```bash
curl "http://localhost:7071/api/form?bakeSessionID=rv1-test-1"
```

### Responses
200 OK:
```json
{
  "ok": true,
  "form": {
    "id": "rv1-test-1",
    "title": "Bakery Feedback",
    "version": "v1",
    "questions": [
      { "id": "q1", "type": "scale", "prompt": "How tasty was the bread?", "required": true, "min": 1, "max": 5 }
    ]
  }
}
```

500 Server Error (example shape):
```json
{
  "ok": false,
  "error": "Failed to read form",
  "diagnostics": {
    "databaseId": "bakingFeedbackDB",
    "containerId": "forms",
    "hasEndpoint": true,
    "hasKey": true
  }
}
```

## POST /api/submit
Submits completed feedback. Validates required fields and blocks basic bot submissions via a honeypot field.

### Request
Body:
```json
{
  "bakeSessionID": "rv1-test-1",
  "submitterName": "ryan",
  "answers": {
    "q1": 4,
    "q2": "Great flavor"
  },
  "formVersion": "v1",
  "honeypot": ""
}
```

Example:
```bash
curl -X POST "http://localhost:7071/api/submit" \
  -H "Content-Type: application/json" \
  -d '{"bakeSessionID":"rv1-test-1","submitterName":"ryan","answers":{"q1":4},"formVersion":"v1","honeypot":""}'
```

### Responses
200 OK:
```json
{ "ok": true, "submissionId": "6b2d6cbe-73c1-4df2-9c3d-2f4a7b8fce12" }
```

400 Bad Request:
- `bakeSessionID` missing
- `bakeSessionID` too long
- `submitterName` too long
- honeypot field present

500 Server Error:
- Cosmos DB not configured or write failure
