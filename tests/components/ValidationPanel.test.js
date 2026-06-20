import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import ValidationPanel from '../../src/components/ValidationPanel.vue'

const vuetify = createVuetify()
const mountPanel = (props) =>
  mount(ValidationPanel, {
    props,
    global: { plugins: [vuetify] },
  })

describe('ValidationPanel', () => {
  it('renders the original text with "(as entered)" label', () => {
    const wrapper = mountPanel({ originalText: 'siett', corrections: ['sietni'] })
    expect(wrapper.text()).toContain('siett (as entered)')
  })

  it('renders all corrections as options', () => {
    const wrapper = mountPanel({ originalText: 'siett', corrections: ['sietni', 'sietek'] })
    expect(wrapper.text()).toContain('sietni')
    expect(wrapper.text()).toContain('sietek')
  })

  it('defaults selection to the first correction', () => {
    const wrapper = mountPanel({ originalText: 'siett', corrections: ['sietni', 'sietek'] })
    const radios = wrapper.findAllComponents({ name: 'VRadio' })
    const firstCorrectionRadio = radios.find((r) => r.props('value') === 'sietni')
    expect(firstCorrectionRadio).toBeTruthy()
    // The selected ref defaults to corrections[0]
    const selectedRadio = radios.find((r) => r.props('value') === 'sietni')
    expect(selectedRadio.props('value')).toBe('sietni')
  })

  it('emits select with the selected value when Translate is clicked', async () => {
    const wrapper = mountPanel({ originalText: 'siett', corrections: ['sietni'] })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual(['sietni'])
  })

  it('emits select with original text when original option would be clicked', async () => {
    const wrapper = mountPanel({ originalText: 'siett', corrections: [] })
    // With no corrections, defaults to originalText
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('select')[0]).toEqual(['siett'])
  })
})
