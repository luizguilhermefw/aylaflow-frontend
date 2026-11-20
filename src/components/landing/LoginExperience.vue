<template>
  <aside class="login-experience"><div class="experience-content">
    <AylaFlowLogo class="experience-logo" />
    <h2>Relacionamentos não deveriam depender de <span>alguém lembrar.</span></h2>
    <p>O AylaFlow trabalha com sua base para transformar momentos certos em novas oportunidades.</p>
    <ol class="experience-flow" aria-hidden="true"><li v-for="(step, index) in steps" :key="step" :class="{ active: activeStep === index }"><span>{{ index + 1 }}</span>{{ step }}</li></ol>
  </div></aside>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import AylaFlowLogo from '@/components/ui/AylaFlowLogo.vue'
const steps = ['Cliente identificado', 'Regra encontrada', 'Ação preparada', 'Relacionamento continua']
const activeStep = ref(3)
let timer: ReturnType<typeof setInterval> | undefined
let motion: MediaQueryList | undefined
let desktop: MediaQueryList | undefined
function syncAnimation() {
  clearInterval(timer)
  timer = undefined
  activeStep.value = 3
  if (motion?.matches || !desktop?.matches) return
  activeStep.value = 0
  timer = setInterval(() => { if (!document.hidden) activeStep.value = (activeStep.value + 1) % steps.length }, 2200)
}
onMounted(() => {
  motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  desktop = window.matchMedia('(min-width: 821px)')
  motion.addEventListener('change', syncAnimation)
  desktop.addEventListener('change', syncAnimation)
  syncAnimation()
})
onUnmounted(() => {
  clearInterval(timer)
  motion?.removeEventListener('change', syncAnimation)
  desktop?.removeEventListener('change', syncAnimation)
})
</script>
<style scoped>
.login-experience { display: flex; align-items: center; padding: 40px clamp(28px, 5vw, 88px); color: #f2f6f7; background: radial-gradient(circle at 20% 15%, rgba(30,212,199,.12), transparent 32%), linear-gradient(145deg, #08383d, #062b30); position: relative; isolation: isolate; }
.login-experience::before { content: ''; position: absolute; right: 24px; top: 32px; width: 120px; height: 100px; background: radial-gradient(rgba(30,212,199,.15) 1px, transparent 2px) 0 0 / 20px 20px; z-index: -1; }
.experience-content { width: 100%; max-width: 520px; margin-inline: auto; }
.experience-logo { --aylaflow-logo-width: 150px; --brand-logo-filter: invert(1) hue-rotate(180deg); --brand-logo-blend-mode: screen; display: block; margin-bottom: 24px; }
h2 { font-size: clamp(1.8rem, 2.8vw, 2.7rem); line-height: 1.2; letter-spacing: -.035em; }
h2 span { color: #1ed4c7; }
p { color: #c5d0d3; margin-top: 20px; max-width: 440px; line-height: 1.7; font-size: .95rem; }
.experience-flow { list-style: none; display: grid; gap: 12px; margin-top: 32px; }
.experience-flow li { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: #c5d0d3; background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; font-size: .82rem; transition: border-color .3s, background .3s; }
.experience-flow li span { color: #1ed4c7; font-weight: 700; }
.experience-flow li.active { color: #f2f6f7; background: rgba(30,212,199,.1); border-color: #1ed4c7; }
@media(max-width: 820px) { .login-experience { padding: 24px; } .experience-logo { --aylaflow-logo-width: 120px; margin-bottom: 12px; } h2 { font-size: 1.35rem; max-width: 420px; } p { margin-top: 12px; font-size: .82rem; } .experience-flow { display: none; } }
@media(prefers-reduced-motion: reduce) { .experience-flow li { transition: none; } }
</style>
