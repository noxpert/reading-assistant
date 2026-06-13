<template>
  <v-chip size="small" label :color="chipColor" :variant="chipVariant" :prepend-icon="chipIcon">
    {{ chipText }}
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (v) => ['checking', 'found', 'not-found'].includes(v),
  },
})

const chipColor = computed(() => {
  if (props.status === 'found') return 'teal-darken-2'
  if (props.status === 'checking') return 'grey'
  return 'grey'
})

const chipVariant = computed(() => {
  if (props.status === 'found') return 'tonal'
  if (props.status === 'checking') return 'tonal'
  return 'outlined'
})

const chipIcon = computed(() => {
  if (props.status === 'found') return 'mdi-database-check'
  if (props.status === 'checking') return 'mdi-progress-clock'
  return 'mdi-database-off-outline'
})

const chipText = computed(() => {
  if (props.status === 'found') return 'In database'
  if (props.status === 'checking') return 'Checking...'
  return 'Not in database'
})
</script>
