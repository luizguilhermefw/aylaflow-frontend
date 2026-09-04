<template>
  <span class="aylaflow-logo">
    <img
      src="@/assets/brand/aylaflow-logo.png"
      :alt="alt"
      width="500"
      height="500"
    >
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  alt?: string
}>(), {
  alt: 'AylaFlow',
})
</script>

<style scoped>
.aylaflow-logo {
  position: relative;
  display: inline-block;
  width: min(100%, var(--aylaflow-logo-width, 220px));
  aspect-ratio: 355 / 228;
  overflow: hidden;
  flex: 0 0 auto;
}

.aylaflow-logo img {
  position: absolute;
  top: -29.4%;
  left: -20.85%;
  display: block;
  width: 140.85%;
  height: auto;
  max-width: none;
  object-fit: contain;
  filter: var(--brand-logo-filter);
  mix-blend-mode: var(--brand-logo-blend-mode);
}
</style>
