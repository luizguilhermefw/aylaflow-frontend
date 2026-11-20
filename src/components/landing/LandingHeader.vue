<template>
  <header class="landing-header">
    <div class="wrap header-inner">
      <RouterLink to="/" class="landing-header-brand" aria-label="AylaFlow — página inicial" @click="goHome"><AylaFlowLogo class="landing-header-logo" alt="" /></RouterLink>
      <button class="menu-toggle secondary" type="button" aria-controls="landing-nav" :aria-expanded="open" @click="open = !open" @keydown.esc="open = false">
        {{ open ? 'Fechar menu' : 'Menu' }}
      </button>
      <nav id="landing-nav" :class="{ open }" aria-label="Navegação principal" @keydown.esc="open = false">
        <a :href="homeSection('como-funciona')" :aria-current="active === 'como-funciona' ? 'location' : undefined" @click="open = false">Como funciona</a>
        <a :href="homeSection('recursos')" :aria-current="active === 'recursos' ? 'location' : undefined" @click="open = false">Recursos</a>
        <a :href="homeSection('para-sua-empresa')" :aria-current="active === 'para-sua-empresa' ? 'location' : undefined" @click="open = false">Para sua empresa</a>
        <RouterLink to="/login">Entrar</RouterLink>
        <a class="primary" :href="contact">Quero conhecer o AylaFlow</a>
      </nav>
    </div>
  </header>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { landingTopBehavior } from '@/features/landing/landing.logic'
import AylaFlowLogo from '@/components/ui/AylaFlowLogo.vue'
const props = withDefaults(defineProps<{ contact: string; institutional?: boolean }>(), { institutional: false })
const homeSection = (id: string) => props.institutional ? '/#' + id : '#' + id
const open = ref(false)
const active = ref('')
const route = useRoute()
const router = useRouter()
async function goHome(event: MouseEvent) {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  open.value = false
  if (route.path !== '/' || route.hash) {
    const failure = await router.push('/')
    if (failure || router.currentRoute.value.path !== '/') return
    await nextTick()
  }
  window.scrollTo({ top: 0, behavior: landingTopBehavior(window.matchMedia('(prefers-reduced-motion: reduce)').matches) })
}
let observer: IntersectionObserver | undefined
onMounted(() => {
  if (props.institutional || !('IntersectionObserver' in window)) return
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) active.value = entry.target.id
  }, { rootMargin: '-15% 0px -45% 0px' })
  for (const id of ['como-funciona', 'recursos', 'para-sua-empresa']) {
    const section = document.getElementById(id)
    if (section) observer.observe(section)
  }
})
onUnmounted(() => observer?.disconnect())
</script>
