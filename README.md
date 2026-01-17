# Baking Feedback

## Overview
This is a mobile-friendly web app for collecting structured feedback on baked goods via QR codes. A QR code opens a Static Web App URL with embedded parameters (such as `bakeSessionID` and `submitterName`), the frontend loads the correct form, and submissions are stored in Azure Cosmos DB for later review.

The app is deployed to Azure Static Web Apps. The frontend is React + Vite, the backend is Azure Functions (Node.js), and data is stored in Cosmos DB (NoSQL).

The Dashboard at `/dashboard` lists multiple submissions with question/answer pairing and summary metrics. It supports filtering by recipe ID (currently backed by `bakeSessionID` in submissions).

## Architecture Summary
- Azure Static Web Apps hosts the SPA frontend and routes `/api/*` to Azure Functions.
- Azure Functions expose `GET /api/form` and `POST /api/submit`.
- Azure Functions also expose `GET /api/submissions` and `GET /api/recipes` for the dashboard.
- Azure Cosmos DB stores form definitions and submissions.
- App Insights is referenced in the project spec but not wired in this repo.

## User Flow
1) User scans a QR code on packaging.
2) The QR opens a URL like `/r?bakeSessionID=...&submitterName=...`.
3) The frontend stores the parameters in session storage and routes to `/survey`.
4) The survey form loads from `/api/form`.
5) The user submits, `/api/submit` writes to Cosmos DB, and the app shows `/thanks`.
6) Admins can view submissions and metrics at `/dashboard`.

## Repository Structure
- `src/` React app (routes and UI)
- `api/` Azure Functions for form and submission APIs
- `staticwebapp.config.json` SPA fallback routing for SWA
- `.github/workflows/` CI/CD pipeline for SWA
- `docs/` Extended documentation (architecture, API, data model, deployment)

## Local Development
### Frontend
```bash
npm install
npm run dev
```
Vite runs at `http://localhost:5173` and proxies `/api` to `http://localhost:7071` per `vite.config.ts`.

### API (Azure Functions)
```bash
cd api
npm install
# copy api/local.settings.json.example to api/local.settings.json and fill values
func start
```
Functions host runs at `http://localhost:7071`.

## Environment Variables
Frontend uses relative `/api` calls; no frontend env vars are required by default.

Azure Functions read these variables:
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `COSMOS_DATABASE` (default `bakingFeedbackDB`)
- `COSMOS_FORMS_CONTAINER` (default `forms`)
- `COSMOS_SUBMISSIONS_CONTAINER` (default `submissions`)

Example `api/local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "https://<account>.documents.azure.com:443/",
    "COSMOS_KEY": "<key>",
    "COSMOS_DATABASE": "bakingFeedbackDB",
    "COSMOS_FORMS_CONTAINER": "forms",
    "COSMOS_SUBMISSIONS_CONTAINER": "submissions"
  }
}
```

## API Documentation (Summary)
### GET /api/form
Query: `?bakeSessionID=<id>`

Response (200):
```json
{
  "ok": true,
  "form": {
    "id": "rv1-test-1",
    "title": "Bakery Feedback",
    "version": "v1",
    "questions": []
  }
}
```

### POST /api/submit
Body:
```json
{
  "bakeSessionID": "rv1-test-1",
  "submitterName": "ryan",
  "answers": { "q1": 4 },
  "formVersion": "v1",
  "honeypot": ""
}
```
Response (200):
```json
{ "ok": true, "submissionId": "<uuid>" }
```

See full examples and error cases in `docs/api.md`.

### GET /api/submissions
Optional query: `?recipeId=<id>` (mapped to `bakeSessionID`).

### GET /api/recipes
Returns distinct recipe IDs for the dashboard dropdown.

## Cosmos DB Schema (Summary)
Containers:
- `forms`: documents keyed by `id` (bakeSessionID)
- `submissions`: documents with `bakeSessionID`, `submitterName`, `answers`, `formVersion`, `submittedAtUtc`

No partition key is specified in code; it depends on Cosmos container configuration. See `docs/data-model.md`.

## Security and Validation
- Basic input validation on `bakeSessionID` and `submitterName` length.
- Honeypot field (`honeypot`) is rejected if present.
- Optional QR signature is referenced in the spec but not implemented.

## Monitoring and Observability
- Application Insights is referenced in the spec but not configured in this repo.

## Deployment Notes
- CI/CD uses `.github/workflows/azure-static-web-apps-*.yml`.
- `app_location: "/"`, `api_location: "api"`, `output_location: "dist"`.
- `staticwebapp.config.json` provides SPA fallback for `/r`, `/survey`, `/thanks`.

## Troubleshooting
- 404 on `/r` or `/survey`: confirm `staticwebapp.config.json` is deployed.
- `Failed to load form (500)`: verify SWA app settings for Cosmos and check `/api/form` error body.
- Local API not reachable: ensure `func start` is running on `http://localhost:7071`.

## Spec vs Current Implementation
See `docs/spec-vs-current.md` for any mismatches between the project spec and the current repo.
