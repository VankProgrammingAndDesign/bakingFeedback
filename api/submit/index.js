const { CosmosClient } = require('@azure/cosmos')
const { v4: uuidv4 } = require('uuid')

function getCosmosClient() {
  const endpoint = process.env.COSMOS_ENDPOINT
  const key = process.env.COSMOS_KEY
  if (!endpoint || !key) return null
  return new CosmosClient({ endpoint, key })
}

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
    const submissionId = uuidv4()
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
