import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// Stubs .css files for the test environment. vite-plugin-vuetify is disabled
// in test mode to prevent it from transforming Vuetify's own component files
// when they are inlined through Vite (which strips their render functions).
const cssStubPlugin = {
  name: 'css-stub',
  enforce: 'pre',
  load(id) {
    if (id.endsWith('.css')) return ''
  },
}

export default defineConfig({
  plugins: [
    vue(),
    process.env.VITEST ? cssStubPlugin : vuetify({ autoImport: true }),
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['tests/setup.js'],
    server: {
      deps: {
        // Process Vuetify through Vite so the CSS stub can intercept .css imports.
        // vite-plugin-vuetify is off in test mode so Vuetify's own render functions
        // are not mangled by the auto-import transform.
        inline: ['vuetify'],
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
