import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useTranslateStore } from '../../src/stores/translate.js'
import ResultCard from '../../src/components/ResultCard.vue'

vi.mock('../../src/services/api.js', () => ({
  checkHealth: vi.fn(),
  fetchLanguages: vi.fn(),
  fetchPartsOfSpeech: vi.fn(),
  translate: vi.fn(),
  search: vi.fn(),
  saveWord: vi.fn(),
  savePhrase: vi.fn(),
}))

function mountWithStore(storeOverrides = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const store = useTranslateStore()
  Object.assign(store, {
    result: { source_text: 'alma', target_text: 'apple', root_source: null, root_target: null, notes: null },
    isPhrase: false,
    inputWordStatus: false,
    rootWordStatus: false,
    partOfSpeechInput: 'noun',
    partOfSpeechRoot: 'noun',
    partsOfSpeech: [{ code: 'noun', label: 'Noun' }],
    savingInput: false,
    savingRoot: false,
    ...storeOverrides,
  })

  // vuetify is already in config.global.plugins from tests/setup.js
  return mount(ResultCard, { global: { plugins: [pinia] } })
}

describe('ResultCard — title', () => {
  it('shows "Translation result" for words', () => {
    const wrapper = mountWithStore({ isPhrase: false })
    expect(wrapper.text()).toContain('Translation result')
  })

  it('shows "Phrase translation" for phrases', () => {
    const wrapper = mountWithStore({ isPhrase: true })
    expect(wrapper.text()).toContain('Phrase translation')
  })
})

describe('ResultCard — word layout', () => {
  it('renders two WordPanel components', () => {
    const wrapper = mountWithStore({
      isPhrase: false,
      result: { source_text: 'almák', target_text: 'apples', root_source: 'alma', root_target: 'apple', notes: null },
    })
    const panels = wrapper.findAllComponents({ name: 'WordPanel' })
    expect(panels).toHaveLength(2)
  })

  it('labels panels as "Input word" and "Root word"', () => {
    const wrapper = mountWithStore({
      isPhrase: false,
      result: { source_text: 'almák', target_text: 'apples', root_source: 'alma', root_target: 'apple', notes: null },
    })
    const panels = wrapper.findAllComponents({ name: 'WordPanel' })
    expect(panels[0].props('label')).toBe('Input word')
    expect(panels[1].props('label')).toBe('Root word')
  })
})

describe('ResultCard — phrase layout', () => {
  it('renders only one WordPanel', () => {
    const wrapper = mountWithStore({ isPhrase: true })
    const panels = wrapper.findAllComponents({ name: 'WordPanel' })
    expect(panels).toHaveLength(1)
  })

  it('labels the panel as "Phrase"', () => {
    const wrapper = mountWithStore({ isPhrase: true })
    const panel = wrapper.findComponent({ name: 'WordPanel' })
    expect(panel.props('label')).toBe('Phrase')
  })

  it('passes isPhrase=true to the WordPanel', () => {
    const wrapper = mountWithStore({ isPhrase: true })
    expect(wrapper.findComponent({ name: 'WordPanel' }).props('isPhrase')).toBe(true)
  })
})

describe('ResultCard — notes section', () => {
  it('does not render notes section when notes is null', () => {
    const wrapper = mountWithStore({
      result: { source_text: 'alma', target_text: 'apple', root_source: null, root_target: null, notes: null },
    })
    expect(wrapper.text()).not.toContain('Notes')
  })

  it('renders notes section when notes is present', () => {
    const wrapper = mountWithStore({
      result: { source_text: 'alma', target_text: 'apple', root_source: null, root_target: null, notes: 'Irregular plural form.' },
    })
    expect(wrapper.text()).toContain('Notes')
    expect(wrapper.text()).toContain('Irregular plural form.')
  })
})

describe('ResultCard — prop passthrough', () => {
  it('passes dbStatus from store to input WordPanel', () => {
    const record = { id: 1 }
    const wrapper = mountWithStore({ inputWordStatus: record })
    const panel = wrapper.findAllComponents({ name: 'WordPanel' })[0]
    expect(panel.props('dbStatus')).toEqual(record)
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })
})
