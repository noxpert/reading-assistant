<template>
  <v-app>
    <v-app-bar color="teal-darken-2" flat>
      <v-app-bar-title>
        <span class="font-weight-medium">Vocabulary</span>
        <span class="text-body-2 ml-2 opacity-70">Hungarian · English</span>
      </v-app-bar-title>
      <template #append>
        <v-tabs v-model="currentTab" color="white" density="compact" class="mr-2">
          <v-tab value="/" @click="router.push('/')">
            <v-icon start size="small">mdi-database</v-icon>
            Database
          </v-tab>
          <v-tab value="/translate" @click="router.push('/translate')">
            <v-icon start size="small">mdi-translate</v-icon>
            Translate
          </v-tab>
        </v-tabs>
      </template>
    </v-app-bar>

    <v-main>
      <v-alert
        v-if="store.serviceAvailable === false"
        type="warning"
        variant="tonal"
        closable
        class="mb-0 rounded-0"
        icon="mdi-connection"
      >
        Translation service is not responding. Make sure it is running on port 8081 and try
        refreshing the page.
      </v-alert>

      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTranslateStore } from './stores/translate.js'

const router = useRouter()
const route = useRoute()
const store = useTranslateStore()

const currentTab = computed(() => route.path)

onMounted(() => {
  store.checkHealth()
})
</script>
