<template>
  <v-app>
    <v-app-bar color="teal-darken-2" flat>
      <v-app-bar-title>
        <span class="font-weight-medium">Vocabulary</span>
        <span class="text-body-2 ml-2 opacity-70">Hungarian · English</span>
      </v-app-bar-title>
      <template #append>
        <v-icon class="mr-3">mdi-translate</v-icon>
      </template>
    </v-app-bar>

    <v-main>
      <v-container max-width="800" class="py-6">
        <v-alert
          v-if="store.serviceAvailable === false"
          type="warning"
          variant="tonal"
          closable
          class="mb-4"
          icon="mdi-connection"
        >
          Translation service is not responding. Make sure it is running on port 8081
          and try refreshing the page.
        </v-alert>

        <TranslateForm />

        <ResultCard v-if="store.result !== null" />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTranslateStore } from './stores/translate.js'
import TranslateForm from './components/TranslateForm.vue'
import ResultCard from './components/ResultCard.vue'

const store = useTranslateStore()

onMounted(() => {
  store.checkHealth()
})
</script>
