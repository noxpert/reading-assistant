import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTranslateStore } from '../../src/stores/translate.js'
import * as api from '../../src/services/api.js'

vi.mock('../../src/services/api.js', () => ({
  checkHealth: vi.fn(),
  fetchLanguages: vi.fn(),
  fetchPartsOfSpeech: vi.fn(),
  validate: vi.fn(),
  translate: vi.fn(),
  search: vi.fn(),
  saveWord: vi.fn(),
  savePhrase: vi.fn(),
}))

// Minimal translate response for tests that don't care about the result shape
const wordResult = (overrides = {}) => ({
  source_text: 'alma',
  target_text: 'apple',
  part_of_speech: 'noun',
  root_source: null,
  root_target: null,
  notes: null,
  ...overrides,
})

const emptySearch = { words: [], phrases: [] }

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('checkHealth', () => {
  it('sets serviceAvailable to true on success', async () => {
    api.checkHealth.mockResolvedValue(true)
    const store = useTranslateStore()
    await store.checkHealth()
    expect(store.serviceAvailable).toBe(true)
  })

  it('sets serviceAvailable to false on error', async () => {
    api.checkHealth.mockRejectedValue({ status: 0, message: 'unreachable' })
    const store = useTranslateStore()
    await store.checkHealth()
    expect(store.serviceAvailable).toBe(false)
  })
})

describe('loadReferenceData', () => {
  it('populates languages and partsOfSpeech in parallel', async () => {
    const langs = [{ code: 'hu', name: 'Hungarian' }]
    const pos = [{ code: 'noun', label: 'Noun' }]
    api.fetchLanguages.mockResolvedValue(langs)
    api.fetchPartsOfSpeech.mockResolvedValue(pos)
    const store = useTranslateStore()
    await store.loadReferenceData()
    expect(store.languages).toEqual(langs)
    expect(store.partsOfSpeech).toEqual(pos)
  })

  it('sets error when loading fails', async () => {
    api.fetchLanguages.mockRejectedValue({ message: 'Network error' })
    api.fetchPartsOfSpeech.mockRejectedValue({ message: 'Network error' })
    const store = useTranslateStore()
    await store.loadReferenceData()
    expect(store.error).toBeTruthy()
  })
})

describe('swapLanguages', () => {
  it('swaps sourceLang and targetLang', () => {
    const store = useTranslateStore()
    store.sourceLang = 'hu'
    store.targetLang = 'en'
    store.swapLanguages()
    expect(store.sourceLang).toBe('en')
    expect(store.targetLang).toBe('hu')
  })
})

describe('doTranslate', () => {
  it('does nothing when inputText is empty', async () => {
    const store = useTranslateStore()
    store.inputText = ''
    await store.doTranslate()
    expect(api.translate).not.toHaveBeenCalled()
  })

  it('does nothing when inputText is whitespace only', async () => {
    const store = useTranslateStore()
    store.inputText = '   '
    await store.doTranslate()
    expect(api.translate).not.toHaveBeenCalled()
  })

  it('sets isPhrase=true when input contains a space', async () => {
    api.translate.mockResolvedValue(wordResult({ source_text: 'jó napot' }))
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'jó napot'
    await store.doTranslate()
    expect(store.isPhrase).toBe(true)
  })

  it('sets isPhrase=false when input has no space', async () => {
    api.translate.mockResolvedValue(wordResult())
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'alma'
    await store.doTranslate()
    expect(store.isPhrase).toBe(false)
  })

  it('does not overwrite partOfSpeech for phrases', async () => {
    api.translate.mockResolvedValue(wordResult({ source_text: 'jó napot', part_of_speech: 'noun' }))
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'jó napot'
    store.partOfSpeechInput = 'other'
    await store.doTranslate()
    expect(store.partOfSpeechInput).toBe('other')
  })

  it('sets partOfSpeech from result for words', async () => {
    api.translate.mockResolvedValue(wordResult({ part_of_speech: 'verb' }))
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'fut'
    await store.doTranslate()
    expect(store.partOfSpeechInput).toBe('verb')
    expect(store.partOfSpeechRoot).toBe('verb')
  })

  it('falls back to "other" when part_of_speech is null', async () => {
    api.translate.mockResolvedValue(wordResult({ part_of_speech: null }))
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'alma'
    await store.doTranslate()
    expect(store.partOfSpeechInput).toBe('other')
  })

  it('sets error and clears result on translation failure', async () => {
    api.translate.mockRejectedValue({ message: 'Service unavailable' })
    const store = useTranslateStore()
    store.inputText = 'test'
    await store.doTranslate()
    expect(store.error).toBe('Service unavailable')
    expect(store.result).toBeNull()
  })

  it('resets loading to false after success', async () => {
    api.translate.mockResolvedValue(wordResult())
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'alma'
    await store.doTranslate()
    expect(store.loading).toBe(false)
  })

  it('resets loading to false after failure', async () => {
    api.translate.mockRejectedValue({ message: 'error' })
    const store = useTranslateStore()
    store.inputText = 'alma'
    await store.doTranslate()
    expect(store.loading).toBe(false)
  })

  it('clears previous result and statuses before translating', async () => {
    api.translate.mockResolvedValue(wordResult())
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.result = { source_text: 'old' }
    store.inputWordStatus = { id: 1 }
    store.rootWordStatus = { id: 2 }
    store.error = 'old error'
    store.inputText = 'alma'
    const translatePromise = store.doTranslate()
    // Check reset happens synchronously at start of action
    expect(store.result).toBeNull()
    expect(store.inputWordStatus).toBeNull()
    expect(store.rootWordStatus).toBeNull()
    expect(store.error).toBeNull()
    await translatePromise
  })
})

describe('doTranslate — validate flow', () => {
  it('skips validate when validateBeforeTranslate=false', async () => {
    api.translate.mockResolvedValue(wordResult())
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'alma'
    store.validateBeforeTranslate = false
    await store.doTranslate()
    expect(api.validate).not.toHaveBeenCalled()
  })

  it('calls validate with inputText and sourceLang when validateBeforeTranslate=true', async () => {
    api.validate.mockResolvedValue({ is_valid: true, text: 'alma', corrections: null })
    api.translate.mockResolvedValue(wordResult())
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'alma'
    store.sourceLang = 'hu'
    store.validateBeforeTranslate = true
    await store.doTranslate()
    expect(api.validate).toHaveBeenCalledWith({ text: 'alma', lang: 'hu' })
  })

  it('proceeds to translate when is_valid=true', async () => {
    api.validate.mockResolvedValue({ is_valid: true, text: 'alma', corrections: null })
    api.translate.mockResolvedValue(wordResult())
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'alma'
    store.validateBeforeTranslate = true
    await store.doTranslate()
    expect(api.translate).toHaveBeenCalled()
  })

  it('sets validationNotice to "valid" when is_valid=true', async () => {
    api.validate.mockResolvedValue({ is_valid: true, text: 'alma', corrections: null })
    api.translate.mockResolvedValue(wordResult())
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'alma'
    store.validateBeforeTranslate = true
    await store.doTranslate()
    expect(store.validationNotice).toBe('valid')
  })

  it('sets validationPending and does not translate when is_valid=false', async () => {
    api.validate.mockResolvedValue({ is_valid: false, text: 'siett', corrections: ['sietni', 'sietek'] })
    const store = useTranslateStore()
    store.inputText = 'siett'
    store.validateBeforeTranslate = true
    await store.doTranslate()
    expect(store.validationPending).toEqual({ originalText: 'siett', corrections: ['sietni', 'sietek'] })
    expect(api.translate).not.toHaveBeenCalled()
  })

  it('sets error and does not translate on validate failure', async () => {
    api.validate.mockRejectedValue({ message: 'Ollama unreachable' })
    const store = useTranslateStore()
    store.inputText = 'alma'
    store.validateBeforeTranslate = true
    await store.doTranslate()
    expect(store.error).toBe('Ollama unreachable')
    expect(api.translate).not.toHaveBeenCalled()
  })

  it('resets validating to false after validation success', async () => {
    api.validate.mockResolvedValue({ is_valid: true, text: 'alma', corrections: null })
    api.translate.mockResolvedValue(wordResult())
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'alma'
    store.validateBeforeTranslate = true
    await store.doTranslate()
    expect(store.validating).toBe(false)
  })

  it('resets validating to false after validation failure', async () => {
    api.validate.mockRejectedValue({ message: 'error' })
    const store = useTranslateStore()
    store.inputText = 'alma'
    store.validateBeforeTranslate = true
    await store.doTranslate()
    expect(store.validating).toBe(false)
  })

  it('clears validationPending and validationNotice at start of doTranslate', async () => {
    api.validate.mockResolvedValue({ is_valid: true, text: 'alma', corrections: null })
    api.translate.mockResolvedValue(wordResult())
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'alma'
    store.validationPending = { originalText: 'old', corrections: ['old'] }
    store.validationNotice = 'valid'
    store.validateBeforeTranslate = false
    const promise = store.doTranslate()
    expect(store.validationPending).toBeNull()
    expect(store.validationNotice).toBeNull()
    await promise
  })
})

describe('selectCorrection', () => {
  it('updates inputText to the selected text', async () => {
    api.translate.mockResolvedValue(wordResult({ source_text: 'sietni' }))
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'siett'
    store.validationPending = { originalText: 'siett', corrections: ['sietni'] }
    await store.selectCorrection('sietni')
    expect(store.inputText).toBe('sietni')
  })

  it('clears validationPending after selection', async () => {
    api.translate.mockResolvedValue(wordResult())
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.validationPending = { originalText: 'siett', corrections: ['sietni'] }
    await store.selectCorrection('sietni')
    expect(store.validationPending).toBeNull()
  })

  it('calls translate with the selected text', async () => {
    api.translate.mockResolvedValue(wordResult({ source_text: 'sietni' }))
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.sourceLang = 'hu'
    store.targetLang = 'en'
    await store.selectCorrection('sietni')
    expect(api.translate).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'sietni', source_lang: 'hu', target_lang: 'en' })
    )
  })

  it('sets error on translate failure', async () => {
    api.translate.mockRejectedValue({ message: 'Service down' })
    const store = useTranslateStore()
    await store.selectCorrection('sietni')
    expect(store.error).toBe('Service down')
  })
})

describe('checkDatabaseStatus (phrase path)', () => {
  it('searches phrases array when isPhrase=true', async () => {
    const phraseRecord = { id: 1, translations: [{ text: 'jó napot', language_code: 'hu' }] }
    api.translate.mockResolvedValue(wordResult({ source_text: 'jó napot' }))
    api.search.mockResolvedValue({ words: [], phrases: [phraseRecord] })
    const store = useTranslateStore()
    store.inputText = 'jó napot'
    await store.doTranslate()
    expect(store.inputWordStatus).toEqual(phraseRecord)
    expect(store.rootWordStatus).toBe(false)
  })

  it('sets inputWordStatus=false when phrase not in database', async () => {
    api.translate.mockResolvedValue(wordResult({ source_text: 'jó napot' }))
    api.search.mockResolvedValue({ words: [], phrases: [] })
    const store = useTranslateStore()
    store.inputText = 'jó napot'
    await store.doTranslate()
    expect(store.inputWordStatus).toBe(false)
  })

  it('runs a single search for phrases (no root search)', async () => {
    api.translate.mockResolvedValue(wordResult({ source_text: 'jó napot', root_source: 'nap' }))
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'jó napot'
    await store.doTranslate()
    expect(api.search).toHaveBeenCalledTimes(1)
  })
})

describe('checkDatabaseStatus (word path)', () => {
  it('searches words array when isPhrase=false', async () => {
    const wordRecord = { id: 1, translations: [{ text: 'alma', language_code: 'hu' }] }
    api.translate.mockResolvedValue(wordResult())
    api.search.mockResolvedValue({ words: [wordRecord], phrases: [] })
    const store = useTranslateStore()
    store.inputText = 'alma'
    await store.doTranslate()
    expect(store.inputWordStatus).toEqual(wordRecord)
  })

  it('runs parallel searches when root word exists', async () => {
    api.translate.mockResolvedValue(
      wordResult({ source_text: 'almák', root_source: 'alma', root_target: 'apple' })
    )
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'almák'
    await store.doTranslate()
    expect(api.search).toHaveBeenCalledTimes(2)
    expect(api.search).toHaveBeenCalledWith(expect.objectContaining({ text: 'almák' }))
    expect(api.search).toHaveBeenCalledWith(expect.objectContaining({ text: 'alma' }))
  })

  it('sets rootWordStatus=false when root_source is null', async () => {
    api.translate.mockResolvedValue(wordResult({ root_source: null }))
    api.search.mockResolvedValue(emptySearch)
    const store = useTranslateStore()
    store.inputText = 'alma'
    await store.doTranslate()
    expect(store.rootWordStatus).toBe(false)
    expect(api.search).toHaveBeenCalledTimes(1)
  })

  it('filters search results to exact match only', async () => {
    const exactMatch = { id: 1, translations: [{ text: 'alma', language_code: 'hu' }] }
    const partialMatch = { id: 2, translations: [{ text: 'almafa', language_code: 'hu' }] }
    api.translate.mockResolvedValue(wordResult())
    api.search.mockResolvedValue({ words: [partialMatch, exactMatch], phrases: [] })
    const store = useTranslateStore()
    store.inputText = 'alma'
    await store.doTranslate()
    expect(store.inputWordStatus).toEqual(exactMatch)
  })

  it('matches case-insensitively', async () => {
    const record = { id: 1, translations: [{ text: 'Alma', language_code: 'hu' }] }
    api.translate.mockResolvedValue(wordResult({ source_text: 'alma' }))
    api.search.mockResolvedValue({ words: [record], phrases: [] })
    const store = useTranslateStore()
    store.inputText = 'alma'
    await store.doTranslate()
    expect(store.inputWordStatus).toEqual(record)
  })

  it('defaults both statuses to false on search error (non-fatal)', async () => {
    api.translate.mockResolvedValue(wordResult())
    api.search.mockRejectedValue({ message: 'Search failed' })
    const store = useTranslateStore()
    store.inputText = 'alma'
    await store.doTranslate()
    expect(store.inputWordStatus).toBe(false)
    expect(store.rootWordStatus).toBe(false)
    // Search errors are non-fatal — result is still set, no user-visible error
    expect(store.result).not.toBeNull()
    expect(store.error).toBeNull()
  })
})

describe('doSaveInput', () => {
  it('does nothing when result is null', async () => {
    const store = useTranslateStore()
    store.result = null
    await store.doSaveInput()
    expect(api.saveWord).not.toHaveBeenCalled()
    expect(api.savePhrase).not.toHaveBeenCalled()
  })

  it('calls savePhrase when isPhrase=true', async () => {
    api.savePhrase.mockResolvedValue({ id: 1 })
    const store = useTranslateStore()
    store.result = { source_text: 'jó napot', target_text: 'good day' }
    store.isPhrase = true
    store.sourceLang = 'hu'
    store.targetLang = 'en'
    await store.doSaveInput()
    expect(api.savePhrase).toHaveBeenCalledTimes(1)
    expect(api.saveWord).not.toHaveBeenCalled()
  })

  it('saves phrase without part_of_speech or is_verified', async () => {
    api.savePhrase.mockResolvedValue({ id: 1 })
    const store = useTranslateStore()
    store.result = { source_text: 'jó napot', target_text: 'good day' }
    store.isPhrase = true
    store.sourceLang = 'hu'
    store.targetLang = 'en'
    await store.doSaveInput()
    const call = api.savePhrase.mock.calls[0][0]
    expect(call).not.toHaveProperty('part_of_speech')
    expect(call).not.toHaveProperty('is_verified')
  })

  it('includes correct translations in phrase save', async () => {
    api.savePhrase.mockResolvedValue({ id: 1 })
    const store = useTranslateStore()
    store.result = { source_text: 'jó napot', target_text: 'good day' }
    store.isPhrase = true
    store.sourceLang = 'hu'
    store.targetLang = 'en'
    store.context = 'ch. 1'
    await store.doSaveInput()
    expect(api.savePhrase).toHaveBeenCalledWith(
      expect.objectContaining({
        translations: [
          { language_code: 'hu', text: 'jó napot' },
          { language_code: 'en', text: 'good day' },
        ],
        context: 'ch. 1',
      })
    )
  })

  it('calls saveWord when isPhrase=false', async () => {
    api.saveWord.mockResolvedValue({ id: 1 })
    const store = useTranslateStore()
    store.result = { source_text: 'alma', target_text: 'apple' }
    store.isPhrase = false
    store.sourceLang = 'hu'
    store.targetLang = 'en'
    await store.doSaveInput()
    expect(api.saveWord).toHaveBeenCalledTimes(1)
    expect(api.savePhrase).not.toHaveBeenCalled()
  })

  it('saves word with part_of_speech and is_verified=false', async () => {
    api.saveWord.mockResolvedValue({ id: 1 })
    const store = useTranslateStore()
    store.result = { source_text: 'alma', target_text: 'apple' }
    store.isPhrase = false
    store.partOfSpeechInput = 'noun'
    store.sourceLang = 'hu'
    store.targetLang = 'en'
    await store.doSaveInput()
    expect(api.saveWord).toHaveBeenCalledWith(
      expect.objectContaining({ part_of_speech: 'noun', is_verified: false })
    )
  })

  it('updates inputWordStatus with the saved record', async () => {
    const saved = { id: 42, translations: [] }
    api.saveWord.mockResolvedValue(saved)
    const store = useTranslateStore()
    store.result = { source_text: 'alma', target_text: 'apple' }
    store.isPhrase = false
    await store.doSaveInput()
    expect(store.inputWordStatus).toEqual(saved)
  })

  it('sets error on save failure', async () => {
    api.saveWord.mockRejectedValue({ message: 'Conflict' })
    const store = useTranslateStore()
    store.result = { source_text: 'alma', target_text: 'apple' }
    store.isPhrase = false
    await store.doSaveInput()
    expect(store.error).toBe('Conflict')
    expect(store.savingInput).toBe(false)
  })
})

describe('doSaveRoot', () => {
  it('does nothing when result has no root', async () => {
    const store = useTranslateStore()
    store.result = { source_text: 'alma', root_source: null }
    await store.doSaveRoot()
    expect(api.saveWord).not.toHaveBeenCalled()
  })

  it('calls saveWord with root translations and partOfSpeechRoot', async () => {
    const saved = { id: 2, translations: [] }
    api.saveWord.mockResolvedValue(saved)
    const store = useTranslateStore()
    store.result = { source_text: 'almák', target_text: 'apples', root_source: 'alma', root_target: 'apple' }
    store.partOfSpeechRoot = 'noun'
    store.sourceLang = 'hu'
    store.targetLang = 'en'
    await store.doSaveRoot()
    expect(api.saveWord).toHaveBeenCalledWith(
      expect.objectContaining({
        translations: [
          { language_code: 'hu', text: 'alma' },
          { language_code: 'en', text: 'apple' },
        ],
        part_of_speech: 'noun',
        is_verified: false,
      })
    )
    expect(store.rootWordStatus).toEqual(saved)
  })

  it('sets error on save failure', async () => {
    api.saveWord.mockRejectedValue({ message: 'Server error' })
    const store = useTranslateStore()
    store.result = { source_text: 'almák', root_source: 'alma', root_target: 'apple' }
    await store.doSaveRoot()
    expect(store.error).toBe('Server error')
    expect(store.savingRoot).toBe(false)
  })
})
