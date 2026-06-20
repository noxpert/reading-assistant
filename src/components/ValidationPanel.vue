<template>
  <v-card variant="tonal" color="warning" class="mt-3">
    <v-card-text>
      <div class="font-weight-medium mb-3">
        Text may have errors. Select a version to translate:
      </div>
      <v-radio-group v-model="selected" hide-details class="mb-4">
        <v-radio :label="`${originalText} (as entered)`" :value="originalText" />
        <v-radio
          v-for="correction in corrections"
          :key="correction"
          :label="correction"
          :value="correction"
        />
      </v-radio-group>
      <v-btn
        color="teal-darken-2"
        prepend-icon="mdi-translate"
        :disabled="!selected"
        @click="emit('select', selected)"
      >
        Translate
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  originalText: { type: String, required: true },
  corrections: { type: Array, required: true },
})

const emit = defineEmits(['select'])

const selected = ref(props.corrections[0] ?? props.originalText)

watch(
  () => props.corrections,
  (val) => {
    selected.value = val[0] ?? props.originalText
  }
)
</script>
