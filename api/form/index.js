const crypto = require('node:crypto')
const { CosmosClient } = require('@azure/cosmos')

const BUILD_STAMP = `form-${new Date().toISOString()}`

const DEFAULT_FORM = {
  id: 'default',
  formVersion: 'dev-1',
  questions: [
    { id: 'q1', type: 'scale', prompt: 'How tasty was the bread?', required: true, min: 1, max: 5 },
    { id: 'q2', type: 'text', prompt: 'Any comments or improvements?', required: false }
  ]
}

function getCosmosClient() {
  const endpoint = process.env.COSMOS_ENDPOINT
  const key = process.env.COSMOS_KEY
  if (!endpoint || !key) return null
  return new CosmosClient({ endpoint, key })
}

module.exports = async function (context, req) {
  const bakeSessionID = (req.query && req.query.bakeSessionID) || null

  const client = getCosmosClient()
  if (!client) {
    context.log('COSMOS_ENDPOINT or COSMOS_KEY not configured; returning default form')
    context.res = { status: 200, body: { ok: true, form: DEFAULT_FORM } }
    return
  }

  const databaseId = process.env.COSMOS_DATABASE || 'bakingFeedbackDB'
  const containerId = process.env.COSMOS_FORMS_CONTAINER || 'forms'

  try {
    if (!bakeSessionID) {
      context.res = { status: 200, body: { ok: true, form: DEFAULT_FORM } }
      return
    }

    const container = client.database(databaseId).container(containerId)
    const querySpec = { query: 'SELECT * FROM c WHERE c.id=@id', parameters: [{ name: '@id', value: bakeSessionID }] }
    const { resources } = await container.items.query(querySpec).fetchAll()

    if (resources && resources.length > 0) {
      const formDoc = resources[0]
      context.res = { status: 200, body: { ok: true, form: formDoc } }
      return
    }

    // not found - return default
    context.res = { status: 200, body: { ok: true, form: DEFAULT_FORM } }
  } catch (err) {
  context.log.error('Error in /api/form', err)

  context.res = {
    status: 500,
    body: {
      ok: false,
      error: err?.message || String(err),
      name: err?.name,
      code: err?.code,
      diagnostics: {
        databaseId,
        containerId,
        hasEndpoint: !!process.env.COSMOS_ENDPOINT,
        hasKey: !!process.env.COSMOS_KEY,
        endpointHost: (process.env.COSMOS_ENDPOINT || '').replace(/^https?:\/\//, '').split('/')[0],
        // note: does NOT return COSMOS_KEY
      }
    }
  }
}

}
