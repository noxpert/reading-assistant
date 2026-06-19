import { config } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Vuetify uses these browser APIs internally; happy-dom doesn't provide them.
// Must use classes so Vuetify can call them with `new`.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver
global.IntersectionObserver = MockIntersectionObserver

export const vuetify = createVuetify({ components, directives })

config.global.plugins = [vuetify]
