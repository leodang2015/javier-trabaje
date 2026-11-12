<template>
  <q-btn
    v-bind="$attrs"
    class="app-action-button"
    :color="props.color || colorByTone[props.tone] || props.tone"
    :style="{
      '--app-action-font-family': props.fontFamily,
      '--app-action-font-weight': props.fontWeight,
      '--app-action-letter-spacing': props.letterSpacing,
      '--app-action-border-radius': props.borderRadius
    }"
  >
    <slot />
  </q-btn>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

const props = defineProps({
  tone: {
    type: String,
    default: 'primary'
  },
  color: {
    type: String,
    default: ''
  },
  fontFamily: {
    type: String,
    default: 'inherit'
  },
  fontWeight: {
    type: [Number, String],
    default: 700
  },
  letterSpacing: {
    type: String,
    default: '0.01em'
  },
  borderRadius: {
    type: String,
    default: '8px'
  }
})

const colorByTone = {
  primary: 'primary',
  dark: 'slate-800',
  neutral: 'grey-7',
  indigo: 'indigo-7',
  warning: 'amber-9'
}
</script>

<style scoped>
.app-action-button {
  border-radius: var(--app-action-border-radius);
}

.app-action-button :deep(.q-btn__content) {
  font-family: var(--app-action-font-family);
  font-weight: var(--app-action-font-weight);
  letter-spacing: var(--app-action-letter-spacing);
}
</style>
