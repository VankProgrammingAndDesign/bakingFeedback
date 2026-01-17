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

function normalizeRecipeId(submission) {
  return submission.bakeSessionID || submission.recipeId || null
}

function buildQaList(answers, form) {
  const pairs = []
  const answerMap = answers && typeof answers === 'object' ? answers : {}
  const used = new Set()

  if (form && Array.isArray(form.questions)) {
    for (const q of form.questions) {
      const text = q.label || q.prompt || q.id || 'Question'
      pairs.push({
        questionId: q.id,
        questionText: text,
        answerValue: Object.prototype.hasOwnProperty.call(answerMap, q.id) ? answerMap[q.id] : null,
      })
      used.add(q.id)
    }
  }

  for (const key of Object.keys(answerMap)) {
    if (used.has(key)) continue
    pairs.push({
      questionId: key,
      questionText: key,
      answerValue: answerMap[key],
    })
  }

  return pairs
}

// HTTP GET handler for /api/submissions
module.exports = async function (context, req) {
  const recipeIdRaw = req.query && typeof req.query.recipeId === 'string' ? req.query.recipeId.trim() : ''
  if (recipeIdRaw && recipeIdRaw.length > 50) {
    context.res = { status: 400, body: { ok: false, error: 'recipeId too long' } }
    return
  }

  const client = getCosmosClient()
  if (!client) {
    context.log.error('COSMOS_ENDPOINT or COSMOS_KEY not configured')
    context.res = { status: 500, body: { ok: false, error: 'Server configuration error' } }
    return
  }

  const databaseId = process.env.COSMOS_DATABASE || 'bakingFeedbackDB'
  const submissionsId = process.env.COSMOS_SUBMISSIONS_CONTAINER || 'submissions'
  const formsId = process.env.COSMOS_FORMS_CONTAINER || 'forms'

  try {
    const submissionsContainer = client.database(databaseId).container(submissionsId)
    // Note: if your container has a partition key, consider querying by that key for RU efficiency.
    let querySpec
    if (recipeIdRaw) {
      querySpec = {
        query: 'SELECT * FROM c WHERE c.bakeSessionID=@id OR c.recipeId=@id ORDER BY c.submittedAtUtc DESC',
        parameters: [{ name: '@id', value: recipeIdRaw }],
      }
    } else {
      querySpec = {
        query: 'SELECT * FROM c ORDER BY c.submittedAtUtc DESC',
        parameters: [],
      }
    }

    const { resources: submissions } = await submissionsContainer.items.query(querySpec).fetchAll()
    const recipeIds = Array.from(new Set(submissions.map(normalizeRecipeId).filter(Boolean)))

    const formMap = new Map()
    if (recipeIds.length > 0) {
      const formsContainer = client.database(databaseId).container(formsId)
      const params = recipeIds.map((id, i) => ({ name: `@id${i}`, value: id }))
      const inClause = params.map((p) => p.name).join(', ')
      const formQuery = {
        query: `SELECT * FROM c WHERE c.id IN (${inClause})`,
        parameters: params,
      }
      const { resources: forms } = await formsContainer.items.query(formQuery).fetchAll()
      for (const form of forms) {
        formMap.set(form.id, {
          ...form,
          version: form.version ?? form.formVersion ?? null,
        })
      }
    }

    const shaped = submissions.map((submission) => {
      const recipeId = normalizeRecipeId(submission)
      const form = recipeId ? formMap.get(recipeId) : null
      return {
        id: submission.id,
        recipeId,
        bakeSessionID: submission.bakeSessionID || null,
        submitterName: submission.submitterName || null,
        formVersion: submission.formVersion || null,
        submittedAtUtc: submission.submittedAtUtc || null,
        qa: buildQaList(submission.answers, form),
      }
    })

    context.res = { status: 200, body: { ok: true, submissions: shaped } }
  } catch (err) {
    context.log.error('Error in /api/submissions', err)
    context.res = { status: 500, body: { ok: false, error: 'Failed to read submissions' } }
  }
}
