<template>
  <v-container max-width="800" class="py-6">
    <!-- Search section -->
    <v-card class="mb-6">
      <v-card-title class="pa-4 pb-2 text-subtitle-1 font-weight-medium">
        <v-icon start>mdi-database-search</v-icon>
        Search database
      </v-card-title>

      <v-card-text>
        <v-row align="center" class="mb-2">
          <v-col cols="5">
            <v-select
              v-model="store.searchSourceLang"
              :items="store.languages"
              item-value="code"
              item-title="name"
              label="Search language"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="2" class="text-center text-medium-emphasis text-body-2"> → </v-col>
          <v-col cols="5">
            <v-select
              v-model="store.searchTargetLang"
              :items="store.languages"
              item-value="code"
              item-title="name"
              label="Translation language"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
        </v-row>

        <v-text-field
          v-model="store.searchText"
          label="Search text"
          variant="outlined"
          clearable
          autofocus
          class="mt-2"
          @keyup.enter="store.doSearch()"
        />

        <v-btn
          block
          color="teal-darken-2"
          size="large"
          :loading="store.searching"
          prepend-icon="mdi-magnify"
          class="mt-2"
          @click="store.doSearch()"
        >
          Search
        </v-btn>

        <v-alert
          v-if="store.searchError"
          type="error"
          variant="tonal"
          closable
          class="mt-3"
          :text="store.searchError"
          @click:close="store.searchError = null"
        />
      </v-card-text>
    </v-card>

    <!-- Search results -->
    <template v-if="store.searchResults !== null">
      <div class="text-overline text-medium-emphasis mb-2">
        {{ store.searchResultCount }} result{{ store.searchResultCount !== 1 ? 's' : '' }}
      </div>

      <v-alert
        v-if="store.searchResultCount === 0"
        type="info"
        variant="tonal"
        text="No matching words or phrases found."
        class="mb-4"
      />

      <template v-if="store.searchResults.words?.length">
        <div class="text-caption text-medium-emphasis text-uppercase mb-1">Words</div>
        <v-card variant="outlined" class="mb-4">
          <v-list lines="two">
            <v-list-item
              v-for="(record, i) in store.searchResults.words"
              :key="record.id ?? i"
              :divider="i < store.searchResults.words.length - 1"
            >
              <v-list-item-title>
                <span v-for="(t, ti) in record.translations" :key="ti" class="mr-3">
                  <span class="font-weight-medium">{{ t.text }}</span>
                </span>
              </v-list-item-title>
              <v-list-item-subtitle v-if="record.part_of_speech">
                {{ record.part_of_speech }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </template>

      <template v-if="store.searchResults.phrases?.length">
        <div class="text-caption text-medium-emphasis text-uppercase mb-1">Phrases</div>
        <v-card variant="outlined" class="mb-4">
          <v-list lines="two">
            <v-list-item
              v-for="(record, i) in store.searchResults.phrases"
              :key="record.id ?? i"
              :divider="i < store.searchResults.phrases.length - 1"
            >
              <v-list-item-title>
                <span v-for="(t, ti) in record.translations" :key="ti" class="mr-3">
                  <span class="font-weight-medium">{{ t.text }}</span>
                </span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </template>
    </template>

    <!-- Add manually section -->
    <v-card>
      <v-card-title class="pa-4 pb-2 text-subtitle-1 font-weight-medium">
        <v-icon start>mdi-plus-circle-outline</v-icon>
        Add translation manually
      </v-card-title>

      <v-card-text>
        <v-btn-toggle
          v-model="store.addType"
          mandatory
          color="teal-darken-2"
          density="compact"
          class="mb-4"
        >
          <v-btn value="word" prepend-icon="mdi-alphabetical">Word</v-btn>
          <v-btn value="phrase" prepend-icon="mdi-text">Phrase</v-btn>
        </v-btn-toggle>

        <v-row align="start">
          <v-col cols="5">
            <v-select
              v-model="store.addSourceLang"
              :items="store.languages"
              item-value="code"
              item-title="name"
              label="From language"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-3"
            />
            <v-text-field
              v-model="store.addSourceText"
              :label="store.addType === 'phrase' ? 'Phrase' : 'Word'"
              variant="outlined"
              hide-details
            />
          </v-col>

          <v-col cols="2" class="text-center" style="padding-top: 52px">
            <v-icon color="medium-emphasis">mdi-arrow-right</v-icon>
          </v-col>

          <v-col cols="5">
            <v-select
              v-model="store.addTargetLang"
              :items="store.languages"
              item-value="code"
              item-title="name"
              label="To language"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-3"
            />
            <v-text-field
              v-model="store.addTargetText"
              label="Translation"
              variant="outlined"
              hide-details
            />
          </v-col>
        </v-row>

        <v-select
          v-if="store.addType === 'word'"
          v-model="store.addPartOfSpeech"
          :items="store.partsOfSpeech"
          item-value="code"
          item-title="label"
          label="Part of speech"
          density="compact"
          variant="outlined"
          hide-details
          class="mt-3"
        />

        <v-btn
          block
          color="teal-darken-2"
          size="large"
          :loading="store.saving"
          :disabled="!store.addSourceText.trim() || !store.addTargetText.trim()"
          prepend-icon="mdi-bookmark-plus"
          class="mt-4"
          @click="store.doAdd()"
        >
          Save {{ store.addType }}
        </v-btn>

        <v-alert
          v-if="store.saveSuccess"
          type="success"
          variant="tonal"
          closable
          class="mt-3"
          text="Saved successfully."
          @click:close="store.saveSuccess = false"
        />

        <v-alert
          v-if="store.saveError"
          type="error"
          variant="tonal"
          closable
          class="mt-3"
          :text="store.saveError"
          @click:close="store.saveError = null"
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDatabaseStore } from '../stores/database.js'

const store = useDatabaseStore()

onMounted(() => {
  store.loadReferenceData()
})
</script>
