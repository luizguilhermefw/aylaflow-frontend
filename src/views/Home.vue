<template>
  <div class="landing landing-page">
    <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>
    <LandingHeader :contact="contact" />
    <main id="conteudo">
      <section class="landing-section landing-section--hero"><div class="landing-container hero">
        <div>
          <p class="eyebrow">RELACIONAMENTO QUE CONTINUA DEPOIS DA VENDA</p>
          <h1>Seu cliente já comprou de você. <span>O AylaFlow ajuda sua empresa a fazer ele voltar.</span></h1>
          <p class="hero-description">Transforme sua base de clientes em novas oportunidades de venda com automações inteligentes de relacionamento, reativação e campanhas pelo WhatsApp.</p>
          <div class="cta-row"><a class="primary" :href="contact">Quero conhecer o AylaFlow <AppIcon name="send" :size="17" /></a><a class="secondary" href="#como-funciona">Ver como funciona</a></div>
          <p class="hero-note">Sem depender de planilhas. Sem lembrar manualmente quem precisa ser chamado. Sem deixar clientes importantes desaparecerem da sua base.</p>
        </div>
        <LandingProductDemo />
      </div></section>

      <section class="landing-section landing-section--light section">
        <div class="landing-container split">
          <div><p class="eyebrow">UMA BASE CHEIA DE POSSIBILIDADES</p><h2>Você já tem clientes. O problema é continuar vendendo para eles.</h2></div>
          <div><p>Clientes que conhecem a marca param de comprar. Com a equipe ocupada, retomar essas conversas acaba ficando para depois.</p><p>Datas passam, campanhas ficam genéricas e a base só é utilizada quando alguém lembra dela.</p><strong class="statement">O AylaFlow transforma essa base em relacionamento recorrente.</strong></div>
        </div>
        <div class="landing-container problem-grid"><div v-for="problem in problems" :key="problem"><AppIcon name="alert" :size="19" /><span>{{ problem }}</span></div></div>
      </section>

      <LandingScrollStory />

      <LandingExplorers />
      <LandingRegistrationJourney />
      <section class="landing-section landing-section--dark section interests-section"><div class="landing-container split"><div><p class="eyebrow">CADA CLIENTE TEM SEU CONTEXTO</p><h2>Fale com clientes diferentes de formas diferentes.</h2><p>Cada empresa pode configurar sua própria estrutura de interesses. Essas preferências ajudam a preparar campanhas para públicos específicos.</p><strong class="statement">Menos mensagem genérica. Mais contexto.</strong></div><div class="interest-demo"><span class="eyebrow">INTERESSES DEMONSTRATIVOS</span><div class="interest-chips"><span v-for="interest in interests" :key="interest"><AppIcon name="confirm" :size="16" />{{ interest }}</span></div><p>Sua empresa define as opções. O cliente informa suas preferências.</p></div></div></section>


      <section class="landing-section landing-section--light section"><div class="landing-container split"><div><h2>Sua base de clientes pode trabalhar a favor do seu crescimento.</h2><p>O AylaFlow foi criado para ajudar empresas a aproveitar melhor algo que elas já possuem: clientes que já conhecem, já confiaram e já compraram da marca.</p><p>Em vez de pensar somente em conquistar o próximo cliente, a empresa passa a trabalhar também para manter relacionamento com quem já comprou.</p></div><div class="control-card"><AppIcon name="consentGranted" :size="28" /><h2>Automação com controle.</h2><ul><li>Cada empresa possui suas próprias configurações.</li><li>Automações seguem regras definidas pela empresa.</li><li>Processos de envio possuem registros.</li><li>Clientes podem solicitar interrupção das comunicações.</li></ul><p>Um produto pensado para evitar automações sem controle.</p></div></div></section>

      <section class="landing-section landing-section--dark section"><div class="landing-container final-cta"><div class="cta-network" aria-hidden="true"><span>Cliente ↘</span><strong>AylaFlow</strong><span>↙ Cliente</span><small>↓ relacionamento</small></div><p class="eyebrow">VAMOS CONVERSAR?</p><h2>Quer entender como o AylaFlow pode funcionar no seu negócio?</h2><p>Se sua empresa possui uma base de clientes e quer melhorar o relacionamento e a recorrência sem depender de processos manuais todos os dias, vale conversar.</p><a class="primary" :href="contact">Quero ver o AylaFlow funcionando</a><small>{{ contact === '/login' ? 'Acesse o AylaFlow para continuar.' : 'Fale diretamente com a gente pelo WhatsApp.' }}</small></div></section>
    </main>
    <LandingFooter /><LandingFloatingActions />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import LandingScrollStory from '@/components/landing/LandingScrollStory.vue'
import LandingExplorers from '@/components/landing/LandingExplorers.vue'
import LandingRegistrationJourney from '@/components/landing/LandingRegistrationJourney.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'
import LandingFloatingActions from '@/components/landing/LandingFloatingActions.vue'
import LandingHeader from '@/components/landing/LandingHeader.vue'
import LandingProductDemo from '@/components/landing/LandingProductDemo.vue'
import { usePageMeta } from '@/features/landing/page-meta'
import { salesContactHref } from '@/features/landing/landing.logic'
import '@/components/landing/landing.css'

const contact = salesContactHref(import.meta.env.VITE_SALES_CONTACT_URL, import.meta.env.VITE_ACTIVATION_CONTACT_URL)
const problems = ['Cliente sumiu', 'Data importante passou', 'Base sem segmentação', 'Processo depende da equipe lembrar']
const interests = ['Novidades', 'Promoções', 'Categoria A', 'Categoria B', 'Lançamentos']
let revealObserver: IntersectionObserver | undefined
usePageMeta(() => ({ title: 'AylaFlow | Automação de relacionamento e reativação de clientes', description: 'Automatize reativação de clientes, campanhas, cadastros e relacionamento com sua base usando o AylaFlow.' }))
onMounted(() => {
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('revealed')
        revealObserver?.unobserve(entry.target)
      }
    }, { threshold: 0.08 })
    document.querySelectorAll('.landing main > section').forEach((section) => revealObserver?.observe(section))
  }
})
onUnmounted(() => {
  revealObserver?.disconnect()
})
</script>
