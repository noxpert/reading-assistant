import pluginVue from 'eslint-plugin-vue'
import prettierConfig from '@vue/eslint-config-prettier'

export default [
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  ...pluginVue.configs['flat/recommended'],
  prettierConfig,
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]
