import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**'],
  },
  
  ...pluginVue.configs['flat/recommended'], 
  
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      globals: {
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
      },
      parserOptions: {
        extraFileExtensions: ['.vue'],
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
    },
  },

  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
    },
  },
];