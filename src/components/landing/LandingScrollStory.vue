<template>
  <section id="como-funciona" class="landing-section landing-section--dark section contrast-section">
    <div class="landing-container scroll-story"><div class="story-sticky"><p class="eyebrow">COMO FUNCIONA · DEMONSTRAÇÃO</p><h2>O sistema identifica. A regra orienta. A ação acontece.</h2>
      <div class="story-interface" aria-label="Fluxo demonstrativo completo">
        <div v-for="(item, index) in story" :key="item[0]" :class="{ 'story-current': stage === index, 'story-done': stage >= index }"><span>{{ index + 1 }}</span><div><strong>{{ item[0] }}</strong><p>{{ item[1] }}</p></div></div>
      </div>
    </div>
    <ol class="story-markers"><li v-for="(item, index) in story" :key="item[0]" :ref="el => setMarker(el, index)"><span class="eyebrow">0{{ index + 1 }}</span><h3>{{ item[0] }}</h3><p>{{ item[1] }}</p></li></ol>
  </div></section>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { readingProgress } from '@/features/landing/landing-motion'
const stage = ref(0)
const markers: HTMLElement[] = []
const story = [['Cliente identificado', 'Mariana · Última compra: há 94 dias'], ['Regra encontrada', 'Reativação · 90 dias sem compra'], ['Cliente → Regra', 'O momento do cliente encontra a regra configurada.'], ['Ação', 'Entrar na automação'], ['Canal', 'WhatsApp'], ['Automação preparada', 'Cliente identificado → Regra acionada → Automação preparada']]
function setMarker(el: unknown, index: number) { if (el instanceof HTMLElement) markers[index] = el }
let frame = 0
function update() {
  frame = 0
  const root = document.documentElement
  root.style.setProperty('--landing-reading-progress', String(readingProgress(window.scrollY, root.scrollHeight, window.innerHeight)))
  let next = 0
  markers.forEach((marker, index) => { if (marker.getBoundingClientRect().top <= window.innerHeight * .65) next = index })
  stage.value = next
}
function schedule() { if (!frame) frame = requestAnimationFrame(update) }
onMounted(() => { window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule); schedule() })
onUnmounted(() => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame); document.documentElement.style.removeProperty('--landing-reading-progress') })
</script>
