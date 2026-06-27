import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as api from '../services/api.js'

export const useDatabaseStore = defineStore('database', () => {
  // Search state
  const searchText = ref('')
  const searchSourceLang = ref('hu')
  const searchTargetLang = ref('en')
  const searchResults = ref(null) // null = no search yet, { words, phrases } after search
  const searching = ref(false)
  const searchError = ref(null)

  // Add form state
  const addType = ref('word') // 'word' | 'phrase'
  const addSourceLang = ref('hu')
  const addTargetLang = ref('en')
  const addSourceText = ref('')
  const addTargetText = ref('')
  const addPartOfSpeech = ref('other')
  const saving = ref(false)
  const saveError = ref(null)
  const saveSuccess = ref(false)

  // Reference data (shared with translate store via loadReferenceData, or loaded independently)
  const languages = ref([])
  const partsOfSpeech = ref([])

  const searchResultCount = computed(() => {
    if (!searchResults.value) return 0
    return (searchResults.value.words?.length ?? 0) + (searchResults.value.phrases?.length ?? 0)
  })

  async function loadReferenceData() {
    try {
      const [langs, pos] = await Promise.all([api.fetchLanguages(), api.fetchPartsOfSpeech()])
      languages.value = langs
      partsOfSpeech.value = pos
    } catch {
      // Non-fatal; selects will be empty
    }
  }

  async function doSearch() {
    if (!searchText.value.trim()) return
    searching.value = true
    searchError.value = null
    searchResults.value = null
    try {
      searchResults.value = await api.search({
        text: searchText.value.trim(),
        source_lang: searchSourceLang.value,
        target_lang: searchTargetLang.value,
      })
    } catch (err) {
      searchError.value = err.message ?? 'Search failed.'
    } finally {
      searching.value = false
    }
  }

  async function doAdd() {
    if (!addSourceText.value.trim() || !addTargetText.value.trim()) return
    saving.value = true
    saveError.value = null
    saveSuccess.value = false
    try {
      const translations = [
        { language_code: addSourceLang.value, text: addSourceText.value.trim() },
        { language_code: addTargetLang.value, text: addTargetText.value.trim() },
      ]
      if (addType.value === 'phrase') {
        await api.savePhrase({
          translations,
          context: null,
          source_name: import.meta.env.VITE_SOURCE_NAME ?? 'vocab-app',
        })
      } else {
        await api.saveWord({
          translations,
          part_of_speech: addPartOfSpeech.value,
          context: null,
          source_name: import.meta.env.VITE_SOURCE_NAME ?? 'vocab-app',
          is_verified: true,
        })
      }
      saveSuccess.value = true
      addSourceText.value = ''
      addTargetText.value = ''
    } catch (err) {
      saveError.value = err.message ?? 'Failed to save.'
    } finally {
      saving.value = false
    }
  }

  return {
    searchText,
    searchSourceLang,
    searchTargetLang,
    searchResults,
    searching,
    searchError,
    searchResultCount,
    addType,
    addSourceLang,
    addTargetLang,
    addSourceText,
    addTargetText,
    addPartOfSpeech,
    saving,
    saveError,
    saveSuccess,
    languages,
    partsOfSpeech,
    loadReferenceData,
    doSearch,
    doAdd,
  }
})
