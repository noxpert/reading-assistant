<template>
  <v-card variant="outlined" height="100%">
    <v-card-title class="d-flex align-center justify-space-between py-2 px-4">
      <span class="text-overline text-medium-emphasis">{{ label }}</span>
      <StatusChip :status="chipStatus" />
    </v-card-title>

    <v-divider />

    <v-card-text>
      <div v-if="isNullRoot" class="text-body-2 text-medium-emphasis font-italic py-4 text-center">
        This word is already in root form — nothing separate to save.
      </div>

      <template v-else>
        <div class="text-h5 font-weight-medium mb-1">{{ sourceText || '—' }}</div>
        <div class="text-body-1 text-medium-emphasis mb-4">{{ targetText || '—' }}</div>

        <v-select
          :model-value="posCode"
          :items="partsOfSpeech"
          item-value="code"
          item-title="label"
          label="Part of speech"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-4"
          @update:model-value="$emit('update:posCode', $event)"
        />

        <v-btn
          block
          variant="outlined"
          color="teal-darken-2"
          :loading="saving"
          :disabled="dbStatus !== false"
          :prepend-icon="dbStatus && typeof dbStatus === 'object' ? 'mdi-check' : 'mdi-bookmark-plus'"
          @click="$emit('save')"
        >
          {{ dbStatus && typeof dbStatus === 'object' ? 'Saved' : 'Save word' }}
        </v-btn>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import StatusChip from './StatusChip.vue'

const props = defineProps({
  label: { type: String, required: true },
  sourceText: { type: String, default: '' },
  targetText: { type: String, default: '' },
  posCode: { type: String, default: 'other' },
  partsOfSpeech: { type: Array, default: () => [] },
  dbStatus: { default: null },   // null | false | object
  saving: { type: Boolean, default: false },
  isNullRoot: { type: Boolean, default: false },
})

defineEmits(['update:posCode', 'save'])

const chipStatus = computed(() => {
  if (props.dbStatus === null) return 'checking'
  if (props.dbStatus === false) return 'not-found'
  return 'found'
})
</script>
