const { CosmosClient } = require('@azure/cosmos')
const nodeCrypto = require('crypto')

function getCosmosClient() {
  // Cosmos SDK expects Web Crypto; polyfill for Functions runtime if needed.
  if (!globalThis.crypto && nodeCrypto.webcrypto) {
    globalThis.crypto = nodeCrypto.webcrypto
  }
  const endpoint = process.env.COSMOS_ENDPOINT
  const key = process.env.COSMOS_KEY
  if (!endpoint || !key) return null
  return new CosmosClient({ endpoint, key })
}

// HTTP GET handler for /api/recipes
module.exports = async function (context, req) {
  const client = getCosmosClient()
  if (!client) {
    context.log.error('COSMOS_ENDPOINT or COSMOS_KEY not configured')
    context.res = { status: 500, body: { ok: false, error: 'Server configuration error' } }
    return
  }

  const databaseId = process.env.COSMOS_DATABASE || 'bakingFeedbackDB'
  const submissionsId = process.env.COSMOS_SUBMISSIONS_CONTAINER || 'submissions'

  try {
    const container = client.database(databaseId).container(submissionsId)
    const bakeQuery = {
      query: 'SELECT DISTINCT VALUE c.bakeSessionID FROM c WHERE IS_DEFINED(c.bakeSessionID)',
      parameters: [],
    }
    const recipeQuery = {
      query: 'SELECT DISTINCT VALUE c.recipeId FROM c WHERE IS_DEFINED(c.recipeId)',
      parameters: [],
    }
    const { resources: bakeIds } = await container.items.query(bakeQuery).fetchAll()
    const { resources: recipeIdsRaw } = await container.items.query(recipeQuery).fetchAll()
    const merged = new Set([...(bakeIds || []), ...(recipeIdsRaw || [])].filter(Boolean))
    const recipeIds = Array.from(merged).sort()
    context.res = { status: 200, body: { ok: true, recipeIds } }
  } catch (err) {
    context.log.error('Error in /api/recipes', err)
    context.res = { status: 500, body: { ok: false, error: 'Failed to read recipe IDs' } }
  }
}
