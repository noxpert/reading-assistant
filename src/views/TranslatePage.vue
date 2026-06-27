<template>
  <v-container max-width="800" class="py-6">
    <TranslateForm />
    <ResultCard v-if="store.result !== null" />
  </v-container>
</template>

<script setup>
import { useTranslateStore } from '../stores/translate.js'
import TranslateForm from '../components/TranslateForm.vue'
import ResultCard from '../components/ResultCard.vue'

const store = useTranslateStore()
</script>
