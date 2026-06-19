import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as api from '../services/api.js'

const spaceIndicatesPhrase = import.meta.env.VITE_SPACE_INDICATES_PHRASE !== 'false'

function findExactMatch(records, text) {
  if (!text) return undefined
  const needle = text.trim().toLowerCase()
  return records.find((record) =>
    record.translations.some((t) => t.text.trim().toLowerCase() === needle)
  )
}

export const useTranslateStore = defineStore(
  'translate',
  () => {
    // Persisted
    const sourceLang = ref(import.meta.env.VITE_DEFAULT_SOURCE_LANG ?? 'hu')
    const targetLang = ref(import.meta.env.VITE_DEFAULT_TARGET_LANG ?? 'en')

    // Session
    const inputText = ref('')
    const context = ref('')
    const partOfSpeechInput = ref('other')
    const partOfSpeechRoot = ref('other')

    // Result
    const result = ref(null)
    const isPhrase = ref(false)
    const inputWordStatus = ref(null) // null=checking, false=not found, object=record
    const rootWordStatus = ref(null)

    // UI
    const serviceAvailable = ref(true)
    const loading = ref(false)
    const savingInput = ref(false)
    const savingRoot = ref(false)
    const error = ref(null)

    // Reference data
    const languages = ref([])
    const partsOfSpeech = ref([])

    async function checkHealth() {
      try {
        await api.checkHealth()
        serviceAvailable.value = true
      } catch {
        serviceAvailable.value = false
      }
    }

    async function loadReferenceData() {
      try {
        const [langs, pos] = await Promise.all([api.fetchLanguages(), api.fetchPartsOfSpeech()])
        languages.value = langs
        partsOfSpeech.value = pos
      } catch (err) {
        error.value = err.message ?? 'Failed to load reference data.'
      }
    }

    function swapLanguages() {
      const tmp = sourceLang.value
      sourceLang.value = targetLang.value
      targetLang.value = tmp
    }

    async function doTranslate() {
      if (!inputText.value.trim()) return

      loading.value = true
      error.value = null
      result.value = null
      isPhrase.value = spaceIndicatesPhrase && inputText.value.trim().includes(' ')
      inputWordStatus.value = null
      rootWordStatus.value = null

      try {
        result.value = await api.translate({
          text: inputText.value,
          source_lang: sourceLang.value,
          target_lang: targetLang.value,
        })
        if (!isPhrase.value) {
          partOfSpeechInput.value = result.value.part_of_speech ?? 'other'
          partOfSpeechRoot.value = result.value.part_of_speech ?? 'other'
        }
        await checkDatabaseStatus()
      } catch (err) {
        error.value = err.message ?? 'Translation failed.'
      } finally {
        loading.value = false
      }
    }

    async function checkDatabaseStatus() {
      if (!result.value) return

      try {
        if (isPhrase.value) {
          const results = await api.search({
            text: result.value.source_text,
            source_lang: sourceLang.value,
            target_lang: targetLang.value,
          })
          inputWordStatus.value = findExactMatch(results.phrases, result.value.source_text) ?? false
          rootWordStatus.value = false
        } else {
          const hasRoot = !!result.value.root_source
          if (hasRoot) {
            const [inputResults, rootResults] = await Promise.all([
              api.search({
                text: result.value.source_text,
                source_lang: sourceLang.value,
                target_lang: targetLang.value,
              }),
              api.search({
                text: result.value.root_source,
                source_lang: sourceLang.value,
                target_lang: targetLang.value,
              }),
            ])
            inputWordStatus.value =
              findExactMatch(inputResults.words, result.value.source_text) ?? false
            rootWordStatus.value =
              findExactMatch(rootResults.words, result.value.root_source) ?? false
          } else {
            const inputResults = await api.search({
              text: result.value.source_text,
              source_lang: sourceLang.value,
              target_lang: targetLang.value,
            })
            inputWordStatus.value =
              findExactMatch(inputResults.words, result.value.source_text) ?? false
            rootWordStatus.value = false
          }
        }
      } catch {
        // Non-fatal: default to not-found so save button is available
        inputWordStatus.value = false
        rootWordStatus.value = false
      }
    }

    async function doSaveInput() {
      if (!result.value) return
      savingInput.value = true
      try {
        if (isPhrase.value) {
          inputWordStatus.value = await api.savePhrase({
            translations: [
              { language_code: sourceLang.value, text: result.value.source_text },
              { language_code: targetLang.value, text: result.value.target_text },
            ],
            context: context.value || null,
            source_name: import.meta.env.VITE_SOURCE_NAME ?? 'vocab-app',
          })
        } else {
          inputWordStatus.value = await api.saveWord({
            translations: [
              { language_code: sourceLang.value, text: result.value.source_text },
              { language_code: targetLang.value, text: result.value.target_text },
            ],
            part_of_speech: partOfSpeechInput.value,
            context: context.value || null,
            source_name: import.meta.env.VITE_SOURCE_NAME ?? 'vocab-app',
            is_verified: false,
          })
        }
      } catch (err) {
        error.value = err.message ?? 'Failed to save.'
      } finally {
        savingInput.value = false
      }
    }

    async function doSaveRoot() {
      if (!result.value?.root_source) return
      savingRoot.value = true
      try {
        rootWordStatus.value = await api.saveWord({
          translations: [
            { language_code: sourceLang.value, text: result.value.root_source },
            { language_code: targetLang.value, text: result.value.root_target },
          ],
          part_of_speech: partOfSpeechRoot.value,
          context: context.value || null,
          source_name: import.meta.env.VITE_SOURCE_NAME ?? 'vocab-app',
          is_verified: false,
        })
      } catch (err) {
        error.value = err.message ?? 'Failed to save root word.'
      } finally {
        savingRoot.value = false
      }
    }

    return {
      sourceLang,
      targetLang,
      inputText,
      context,
      partOfSpeechInput,
      partOfSpeechRoot,
      result,
      isPhrase,
      inputWordStatus,
      rootWordStatus,
      serviceAvailable,
      loading,
      savingInput,
      savingRoot,
      error,
      languages,
      partsOfSpeech,
      checkHealth,
      loadReferenceData,
      swapLanguages,
      doTranslate,
      doSaveInput,
      doSaveRoot,
    }
  },
  {
    persist: {
      paths: ['sourceLang', 'targetLang'],
    },
  }
)
