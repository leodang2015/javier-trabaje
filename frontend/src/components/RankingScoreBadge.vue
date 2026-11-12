<template>
  <span
    class="score-badge q-px-sm q-py-xs rounded-borders text-weight-bolder text-subtitle2 shadow-xs"
    :class="campo === 'goles' ? 'bg-orange-1 text-orange-9 border border-orange-3' : 'bg-blue-1 text-blue-9 border border-blue-3'"
  >
    {{ valor }} {{ campo === 'goles' ? '⚽' : '🎯' }}
  </span>
</template>

<script setup>
defineProps({
  valor: {
    type: [Number, String],
    required: true
  },
  campo: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.score-badge {
  display: inline-block;
}
</style>
