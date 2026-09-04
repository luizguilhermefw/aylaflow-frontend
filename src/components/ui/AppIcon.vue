<template>
  <svg
    class="app-icon"
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="isHidden ? 'true' : undefined"
    :aria-label="isHidden ? undefined : accessibleLabel"
    :role="isHidden ? undefined : 'img'"
  >
    <title v-if="title">{{ title }}</title>
    <component
      :is="node.tag"
      v-for="(node, index) in nodes"
      :key="`${node.tag}-${index}`"
      v-bind="node.attrs"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  APP_ICON_CATALOG,
  type AppIconName,
} from './app-icon.catalog'

const props = withDefaults(defineProps<{
  name: AppIconName
  size?: number | string
  ariaHidden?: boolean
  title?: string
  label?: string
}>(), {
  size: 20,
})

const nodes = computed(() => APP_ICON_CATALOG[props.name])
const accessibleLabel = computed(() => props.label ?? props.title)
const isHidden = computed(() => props.ariaHidden ?? !accessibleLabel.value)
</script>

<style scoped>
.app-icon {
  display: inline-block;
  flex: 0 0 auto;
  color: currentColor;
  stroke-width: var(--icon-stroke-width, 2);
  vertical-align: middle;
}
</style>
