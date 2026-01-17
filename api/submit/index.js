const { CosmosClient } = require('@azure/cosmos')
const crypto = require('crypto')

function getCosmosClient() {
  // Cosmos SDK expects Web Crypto; polyfill for Functions runtime if needed.
  if (!globalThis.crypto && crypto.webcrypto) {
    globalThis.crypto = crypto.webcrypto
  }
  const endpoint = process.env.COSMOS_ENDPOINT
  const key = process.env.COSMOS_KEY
  if (!endpoint || !key) return null
  return new CosmosClient({ endpoint, key })
}

// HTTP POST handler for /api/submit
module.exports = async function (context, req) {
  const body = req.body || {}

  const bakeSessionID = typeof body.bakeSessionID === 'string' ? body.bakeSessionID.trim() : ''
  const submitterName = typeof body.submitterName === 'string' ? body.submitterName.trim() : ''
  const answers = body.answers || {}
  const honeypot = body.honeypot
  const formVersion = body.formVersion || null

  if (honeypot) {
    context.log.warn('Honeypot field present — possible bot')
    context.res = { status: 400, body: { ok: false, error: 'Bad request' } }
    return
  }

  if (!bakeSessionID) {
    context.res = { status: 400, body: { ok: false, error: 'bakeSessionID required' } }
    return
  }
  if (bakeSessionID.length > 50) {
    context.res = { status: 400, body: { ok: false, error: 'bakeSessionID too long' } }
    return
  }
  if (submitterName && submitterName.length > 50) {
    context.res = { status: 400, body: { ok: false, error: 'submitterName too long' } }
    return
  }

  const client = getCosmosClient()
  if (!client) {
    context.log.error('COSMOS_ENDPOINT or COSMOS_KEY not configured')
    context.res = { status: 500, body: { ok: false, error: 'Server configuration error' } }
    return
  }

  const databaseId = process.env.COSMOS_DATABASE || 'bakingFeedbackDB'
  const containerId = process.env.COSMOS_SUBMISSIONS_CONTAINER || 'submissions'

  try {
    const submissionId = (function generateUuid() {
      if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
      const bytes = crypto.randomBytes(16)
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = bytes.toString('hex')
      return `${hex.substr(0,8)}-${hex.substr(8,4)}-${hex.substr(12,4)}-${hex.substr(16,4)}-${hex.substr(20,12)}`
    })()
    const submittedAtUtc = new Date().toISOString()

    const doc = {
      id: submissionId,
      bakeSessionID,
      submitterName,
      answers,
      formVersion,
      submittedAtUtc
    }

    const container = client.database(databaseId).container(containerId)
    await container.items.create(doc)

    context.res = { status: 200, body: { ok: true, submissionId } }
  } catch (err) {
    context.log.error('Error writing submission', err)
    context.res = { status: 500, body: { ok: false, error: 'Failed to write submission' } }
  }
}
