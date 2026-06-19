import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { VSelect, VBtn } from 'vuetify/components'
import WordPanel from '../../src/components/WordPanel.vue'

const baseProps = {
  label: 'Input word',
  sourceText: 'alma',
  targetText: 'apple',
  posCode: 'noun',
  partsOfSpeech: [
    { code: 'noun', label: 'Noun' },
    { code: 'verb', label: 'Verb' },
  ],
  dbStatus: false,
  saving: false,
  isNullRoot: false,
  isPhrase: false,
}

describe('WordPanel — null root', () => {
  it('shows the null-root message when isNullRoot=true', () => {
    const wrapper = mount(WordPanel, { props: { ...baseProps, isNullRoot: true } })
    expect(wrapper.text()).toContain('already in root form')
  })

  it('hides source text and save button when isNullRoot=true', () => {
    const wrapper = mount(WordPanel, { props: { ...baseProps, isNullRoot: true } })
    expect(wrapper.text()).not.toContain('alma')
    expect(wrapper.findComponent(VBtn).exists()).toBe(false)
  })
})

describe('WordPanel — word mode (isPhrase=false)', () => {
  it('shows the POS select', () => {
    const wrapper = mount(WordPanel, { props: baseProps })
    expect(wrapper.findComponent(VSelect).exists()).toBe(true)
  })

  it('shows source and target text', () => {
    const wrapper = mount(WordPanel, { props: baseProps })
    expect(wrapper.text()).toContain('alma')
    expect(wrapper.text()).toContain('apple')
  })

  it('shows "Save word" on the button when dbStatus=false', () => {
    const wrapper = mount(WordPanel, { props: { ...baseProps, dbStatus: false } })
    expect(wrapper.findComponent(VBtn).text()).toContain('Save word')
  })

  it('shows "Saved" on the button when dbStatus is an object', () => {
    const wrapper = mount(WordPanel, {
      props: { ...baseProps, dbStatus: { id: 1 } },
    })
    expect(wrapper.findComponent(VBtn).text()).toContain('Saved')
  })

  it('disables save button when dbStatus is an object', () => {
    const wrapper = mount(WordPanel, {
      props: { ...baseProps, dbStatus: { id: 1 } },
    })
    expect(wrapper.findComponent(VBtn).props('disabled')).toBe(true)
  })

  it('disables save button when dbStatus is null (checking)', () => {
    const wrapper = mount(WordPanel, { props: { ...baseProps, dbStatus: null } })
    expect(wrapper.findComponent(VBtn).props('disabled')).toBe(true)
  })

  it('enables save button when dbStatus=false (not in db)', () => {
    const wrapper = mount(WordPanel, { props: { ...baseProps, dbStatus: false } })
    expect(wrapper.findComponent(VBtn).props('disabled')).toBe(false)
  })

  it('emits "save" when save button is clicked', async () => {
    const wrapper = mount(WordPanel, { props: { ...baseProps, dbStatus: false } })
    await wrapper.findComponent(VBtn).trigger('click')
    expect(wrapper.emitted('save')).toHaveLength(1)
  })

  it('emits "update:posCode" when POS selection changes', async () => {
    const wrapper = mount(WordPanel, { props: baseProps })
    await wrapper.findComponent(VSelect).setValue('verb')
    expect(wrapper.emitted('update:posCode')).toBeDefined()
  })
})

describe('WordPanel — phrase mode (isPhrase=true)', () => {
  const phraseProps = { ...baseProps, isPhrase: true }

  it('hides the POS select', () => {
    const wrapper = mount(WordPanel, { props: phraseProps })
    expect(wrapper.findComponent(VSelect).exists()).toBe(false)
  })

  it('shows "Save phrase" on the button when dbStatus=false', () => {
    const wrapper = mount(WordPanel, { props: phraseProps })
    expect(wrapper.findComponent(VBtn).text()).toContain('Save phrase')
  })

  it('shows "Saved" on the button when dbStatus is an object', () => {
    const wrapper = mount(WordPanel, {
      props: { ...phraseProps, dbStatus: { id: 1 } },
    })
    expect(wrapper.findComponent(VBtn).text()).toContain('Saved')
  })

  it('still shows source and target text', () => {
    const wrapper = mount(WordPanel, { props: phraseProps })
    expect(wrapper.text()).toContain('alma')
    expect(wrapper.text()).toContain('apple')
  })
})

describe('WordPanel — StatusChip', () => {
  it('shows checking chip when dbStatus=null', () => {
    const wrapper = mount(WordPanel, { props: { ...baseProps, dbStatus: null } })
    const chip = wrapper.findComponent({ name: 'StatusChip' })
    expect(chip.props('status')).toBe('checking')
  })

  it('shows found chip when dbStatus is an object', () => {
    const wrapper = mount(WordPanel, {
      props: { ...baseProps, dbStatus: { id: 1 } },
    })
    const chip = wrapper.findComponent({ name: 'StatusChip' })
    expect(chip.props('status')).toBe('found')
  })

  it('shows not-found chip when dbStatus=false', () => {
    const wrapper = mount(WordPanel, { props: { ...baseProps, dbStatus: false } })
    const chip = wrapper.findComponent({ name: 'StatusChip' })
    expect(chip.props('status')).toBe('not-found')
  })
})
