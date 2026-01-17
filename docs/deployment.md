# Deployment

## Azure Static Web Apps
The CI/CD pipeline is defined in `.github/workflows/azure-static-web-apps-witty-ground-04124a710.yml`.

Key configuration:
- `app_location: "/"` (frontend source)
- `api_location: "api"` (Azure Functions)
- `output_location: "dist"` (Vite build output)

## SPA Routing
`staticwebapp.config.json` enables navigation fallback so client-side routes resolve:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```

## App Settings
Set these in the Static Web Apps configuration:
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `COSMOS_DATABASE` (default `bakingFeedbackDB`)
- `COSMOS_FORMS_CONTAINER` (default `forms`)
- `COSMOS_SUBMISSIONS_CONTAINER` (default `submissions`)

## Functions Runtime
Azure Functions are deployed alongside the SWA app by the GitHub Actions workflow.

## Monitoring
Application Insights is mentioned in the project spec, but there is no config or instrumentation in this repo.
