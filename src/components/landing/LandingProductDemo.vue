<template>
  <figure class="product-demo" aria-label="Exemplo demonstrativo de um fluxo de reativação">
    <figcaption><span class="eyebrow">EXEMPLO DE AUTOMAÇÃO</span><span class="demo-status">Configurada pela empresa</span></figcaption>
    <h2>Reativação de clientes</h2>
    <p>Um momento certo para retomar a conversa.</p>
    <p class="demo-status">{{ automationStates[stage] }}</p>
    <ol class="live-flow"><li v-for="(step, index) in steps" :key="step" :class="{ completed: stage > index, current: stage === index }"><span aria-hidden="true">{{ stage > index ? '✓' : stage === index ? '◉' : '○' }}</span><div>{{ step }}<small>{{ details[index] }}</small></div></li></ol>
    <button type="button" class="flow-pause secondary" :aria-pressed="paused" @click="paused = !paused">{{ paused ? 'Retomar demonstração' : 'Pausar demonstração' }}</button>
  </figure>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { automationStates, demoStage } from '@/features/landing/landing-motion'
const paused = ref(false)
const stage = ref(5)
const steps = ['Cliente identificado', 'Regra encontrada', 'Automação acionada', 'Comunicação preparada', 'Canal WhatsApp']
const details = ['Última compra há 92 dias', 'Reativação · 90 dias sem compra', 'Entrar na automação', 'Ação de relacionamento', 'Canal definido pela empresa']
let timer: ReturnType<typeof setInterval> | undefined
let elapsed = 0
let reduced: MediaQueryList | undefined
function resetMotion() { elapsed = 0; stage.value = reduced?.matches ? 5 : 0 }
onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  resetMotion()
  reduced.addEventListener('change', resetMotion)
  timer = setInterval(() => {
    if (paused.value || reduced?.matches || document.hidden) return
    elapsed = (elapsed + 250) % 12500
    stage.value = demoStage(elapsed, false)
  }, 250)
})
onUnmounted(() => { clearInterval(timer); reduced?.removeEventListener('change', resetMotion) })
</script>
