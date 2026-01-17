import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import RedirectPage from './pages/Redirect'
import SurveyPage from './pages/Survey'
import ThanksPage from './pages/Thanks'

function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Bakery Feedback</h1>
      </header>
      <main className="app-main">
        {/* App routes: redirect entry, survey form, and thank-you */}
        <Routes>
          <Route path="/r" element={<RedirectPage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/thanks" element={<ThanksPage />} />
          <Route
            path="/"
            element={
              <div className="home">
                <p>Start by visiting a redirect link with query params.</p>
                <p>Example: <Link to="/r?bakeSessionID=abc123&submitterName=Alex">Open sample link</Link></p>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
