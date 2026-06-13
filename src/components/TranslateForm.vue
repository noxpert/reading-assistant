<template>
  <v-card>
    <v-card-text>
      <v-row align="center" class="mb-1">
        <v-col cols="5">
          <v-select
            v-model="store.sourceLang"
            :items="store.languages"
            item-value="code"
            item-title="name"
            label="From"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>

        <v-col cols="2" class="text-center">
          <v-btn
            icon
            variant="text"
            size="small"
            aria-label="Swap languages"
            @click="store.swapLanguages()"
          >
            <v-icon>mdi-swap-horizontal</v-icon>
          </v-btn>
        </v-col>

        <v-col cols="5">
          <v-select
            v-model="store.targetLang"
            :items="store.languages"
            item-value="code"
            item-title="name"
            label="To"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
      </v-row>

      <v-text-field
        v-model="store.inputText"
        label="Word or phrase"
        variant="outlined"
        clearable
        autofocus
        class="mt-2"
        @keyup.enter="store.doTranslate()"
      />

      <v-textarea
        v-model="store.context"
        label="Context (optional)"
        variant="outlined"
        rows="2"
        auto-grow
        no-resize
        hide-details
        class="mt-1"
        placeholder="e.g. A Pál-utcai Fiúk, ch. 3 — where you encountered it"
      />

      <v-btn
        block
        color="teal-darken-2"
        size="large"
        :loading="store.loading"
        prepend-icon="mdi-translate"
        class="mt-4"
        @click="store.doTranslate()"
      >
        Translate
      </v-btn>

      <v-alert
        v-if="store.error"
        type="error"
        variant="tonal"
        closable
        class="mt-3"
        :text="store.error"
        @click:close="store.error = null"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTranslateStore } from '../stores/translate.js'

const store = useTranslateStore()

onMounted(() => {
  store.loadReferenceData()
})
</script>
