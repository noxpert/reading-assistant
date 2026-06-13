const BASE = '/api'

const SERVICE_UNAVAILABLE = {
  status: 0,
  message: 'Translation service is not responding. Make sure it is running on port 8081.',
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw SERVICE_UNAVAILABLE
  }

  if (!response.ok) {
    let message = response.statusText
    try {
      const body = await response.json()
      message = body.detail ?? body.message ?? message
    } catch {
      // use statusText
    }
    throw { status: response.status, message }
  }

  if (response.status === 204) return null
  return response.json()
}

export async function checkHealth() {
  return request('/')
}

export async function fetchLanguages() {
  return request('/languages')
}

export async function fetchPartsOfSpeech() {
  return request('/parts-of-speech')
}

export async function translate({ text, source_lang, target_lang }) {
  return request('/translate', {
    method: 'POST',
    body: JSON.stringify({ text, source_lang, target_lang }),
  })
}

export async function search({ text, source_lang, target_lang }) {
  return request('/search', {
    method: 'POST',
    body: JSON.stringify({ text, source_lang, target_lang }),
  })
}

export async function saveWord({
  translations,
  part_of_speech,
  context,
  source_name,
  is_verified,
}) {
  return request('/words', {
    method: 'POST',
    body: JSON.stringify({ translations, part_of_speech, context, source_name, is_verified }),
  })
}

export async function savePhrase({ translations, context, source_name }) {
  return request('/phrases', {
    method: 'POST',
    body: JSON.stringify({ translations, context, source_name }),
  })
}
