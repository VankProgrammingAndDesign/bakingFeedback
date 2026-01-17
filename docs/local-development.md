# Local Development

## Prerequisites
- Node.js 18 or 20
- Azure Functions Core Tools (`func`)
- An Azure Cosmos DB account (or a local emulator)

## Frontend (Vite)
From the repo root:
```bash
npm install
npm run dev
```
Runs at `http://localhost:5173`.

`vite.config.ts` proxies `/api` to `http://localhost:7071` so the frontend can call the local Functions host.

## API (Azure Functions)
From `api/`:
```bash
npm install
# copy api/local.settings.json.example to api/local.settings.json and fill values
func start
```
Functions host runs at `http://localhost:7071`.

## Environment Variables
Functions read these settings (example names in `api/local.settings.json.example`):
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `COSMOS_DATABASE` (default `bakingFeedbackDB`)
- `COSMOS_FORMS_CONTAINER` (default `forms`)
- `COSMOS_SUBMISSIONS_CONTAINER` (default `submissions`)

## Common Local Issues
- `func` not found: install Azure Functions Core Tools and restart your terminal.
- `Failed to load form (500)`: verify Cosmos credentials in `api/local.settings.json`.
