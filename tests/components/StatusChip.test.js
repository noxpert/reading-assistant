import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusChip from '../../src/components/StatusChip.vue'

describe('StatusChip', () => {
  it.each([
    ['checking', 'Checking...'],
    ['found', 'In database'],
    ['not-found', 'Not in database'],
  ])('renders correct label for status "%s"', (status, label) => {
    const wrapper = mount(StatusChip, { props: { status } })
    expect(wrapper.text()).toContain(label)
  })

  it('uses tonal variant for "found"', () => {
    const wrapper = mount(StatusChip, { props: { status: 'found' } })
    const chip = wrapper.findComponent({ name: 'VChip' })
    expect(chip.props('variant')).toBe('tonal')
  })

  it('uses outlined variant for "not-found"', () => {
    const wrapper = mount(StatusChip, { props: { status: 'not-found' } })
    const chip = wrapper.findComponent({ name: 'VChip' })
    expect(chip.props('variant')).toBe('outlined')
  })

  it('uses tonal variant for "checking"', () => {
    const wrapper = mount(StatusChip, { props: { status: 'checking' } })
    const chip = wrapper.findComponent({ name: 'VChip' })
    expect(chip.props('variant')).toBe('tonal')
  })

  it('uses teal color for "found"', () => {
    const wrapper = mount(StatusChip, { props: { status: 'found' } })
    const chip = wrapper.findComponent({ name: 'VChip' })
    expect(chip.props('color')).toBe('teal-darken-2')
  })
})
