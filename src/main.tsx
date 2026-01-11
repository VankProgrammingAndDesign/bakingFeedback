import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/theme.css'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Global error overlay for easier debugging when the app fails to render
function showOverlay(err: string) {
  try {
    const root = document.getElementById('root')
    if (!root) return
    root.innerHTML = `
      <div style="padding:20px;font-family:system-ui;color:#b91c1c;background:#fff">
        <h2>Application error</h2>
        <pre style="white-space:pre-wrap;color:#111">${err}</pre>
      </div>
    `
  } catch (_) {
    // ignore
  }
}

window.addEventListener('error', (ev) => {
  showOverlay(String(ev.error || ev.message || 'Unknown error'))
  // keep logging
  // eslint-disable-next-line no-console
  console.error(ev.error || ev.message)
})

window.addEventListener('unhandledrejection', (ev) => {
  showOverlay(String(ev.reason || 'Unhandled rejection'))
  // eslint-disable-next-line no-console
  console.error(ev.reason)
})
