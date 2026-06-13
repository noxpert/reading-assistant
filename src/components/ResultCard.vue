<template>
  <v-card class="mt-4">
    <v-card-title class="text-subtitle-1 font-weight-medium pa-4 pb-2">
      Translation result
    </v-card-title>

    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6">
          <WordPanel
            label="Input word"
            :source-text="store.result.source_text"
            :target-text="store.result.target_text"
            :pos-code="store.partOfSpeechInput"
            :parts-of-speech="store.partsOfSpeech"
            :db-status="store.inputWordStatus"
            :saving="store.savingInput"
            :is-null-root="false"
            @update:pos-code="store.partOfSpeechInput = $event"
            @save="store.doSaveInput()"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <WordPanel
            label="Root word"
            :source-text="store.result.root_source ?? ''"
            :target-text="store.result.root_target ?? ''"
            :pos-code="store.partOfSpeechRoot"
            :parts-of-speech="store.partsOfSpeech"
            :db-status="store.rootWordStatus"
            :saving="store.savingRoot"
            :is-null-root="!store.result.root_source"
            @update:pos-code="store.partOfSpeechRoot = $event"
            @save="store.doSaveRoot()"
          />
        </v-col>
      </v-row>

      <template v-if="store.result.notes">
        <v-divider class="my-4" />
        <div class="text-overline text-medium-emphasis mb-2">Notes</div>
        <v-sheet rounded color="grey-lighten-4" class="pa-3 text-body-2">
          {{ store.result.notes }}
        </v-sheet>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { useTranslateStore } from '../stores/translate.js'
import WordPanel from './WordPanel.vue'

const store = useTranslateStore()
</script>
