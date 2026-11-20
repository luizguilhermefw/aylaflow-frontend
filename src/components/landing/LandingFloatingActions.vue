<template>
  <aside v-if="!footerVisible" class="landing-floating-actions" aria-label="Ações rápidas">
    <button v-if="showTop" type="button" class="floating-top" aria-label="Voltar ao topo" @click="goToTop">Topo</button>
    <a :href="whatsappHref" class="floating-whatsapp" aria-label="Falar com a AylaFlow pelo WhatsApp" target="_blank" rel="noopener noreferrer">
      <AppIcon name="whatsapp" :size="20" /><span class="whatsapp-label-desktop">Falar pelo WhatsApp</span><span class="whatsapp-label-mobile">WhatsApp</span>
    </a>
  </aside>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { landingTopBehavior, salesWhatsappHref, showLandingTop } from '@/features/landing/landing.logic'
const whatsappHref = salesWhatsappHref()
const showTop = ref(false)
const footerVisible = ref(false)
let frame = 0
let footer: HTMLElement | null = null
function update() {
  frame = 0
  showTop.value = showLandingTop(window.scrollY)
  footerVisible.value = footer !== null && footer.getBoundingClientRect().top < window.innerHeight
}
function schedule() { if (!frame) frame = requestAnimationFrame(update) }
function goToTop() {
  window.scrollTo({ top: 0, behavior: landingTopBehavior(window.matchMedia('(prefers-reduced-motion: reduce)').matches) })
}
onMounted(() => {
  footer = document.querySelector('.institutional-footer')
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  schedule()
})
onUnmounted(() => {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  cancelAnimationFrame(frame)
})
</script>
<style scoped>
.landing-floating-actions { position: fixed; right: 20px; bottom: 20px; z-index: 30; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.landing-floating-actions button, .landing-floating-actions a { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; font: inherit; font-size: .78rem; font-weight: 700; cursor: pointer; text-decoration: none; animation: floating-action-in .2s ease-out; }
.floating-top { padding: 0 12px; color: var(--text-secondary); background: color-mix(in srgb, var(--bg-surface) 92%, transparent); border: 1px solid var(--border-default); transition: color .2s, border-color .2s; }
.floating-top:hover { color: var(--brand-light); border-color: var(--brand-light); }
.landing-floating-actions .floating-whatsapp { min-height: 46px; gap: 10px; padding: 0 16px; background: linear-gradient(135deg, #08383d, #0a4a50); color: #fff; border: 1px solid rgba(30,212,199,.35); box-shadow: 0 10px 28px rgba(6,43,48,.20); transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
.floating-whatsapp .app-icon { color: var(--brand-highlight); }
.whatsapp-label-mobile { display: none; }
@media (hover: hover) { .landing-floating-actions .floating-whatsapp:hover { transform: translateY(-2px); border-color: var(--brand-highlight); box-shadow: 0 14px 32px rgba(6,43,48,.28); } }
.landing-floating-actions :focus-visible { outline: 2px solid var(--brand-primary); outline-offset: 4px; }
@keyframes floating-action-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@media (max-width: 600px) { .landing-floating-actions { right: 16px; bottom: 16px; } .whatsapp-label-desktop { display: none; } .whatsapp-label-mobile { display: inline; } }
@media (prefers-reduced-motion: reduce) { .landing-floating-actions button, .landing-floating-actions a { animation: none; transition: none; } .landing-floating-actions .floating-whatsapp:hover { transform: none; } }
</style>
