<template>
  <section class="landing-section landing-section--light section"><div class="landing-container split qr-section"><div><p class="eyebrow">DO PRIMEIRO CONTATO À SUA BASE</p><h2>Conheça melhor seu cliente, onde ele estiver.</h2><p>Um link ou QR Code no balcão, nas redes sociais ou no WhatsApp. O próprio cliente inicia o cadastro.</p><ol class="journey-steps"><li v-for="(step, index) in steps" :key="step"><button type="button" :aria-pressed="selected === index" @click="selected = index"><span>{{ index + 1 }}</span>{{ step }}</button></li></ol></div>
    <div class="phone-demo journey-phone" aria-live="polite" aria-atomic="true"><div class="phone-notch" /><AylaFlowLogo class="phone-logo" /><span class="eyebrow">EXPERIÊNCIA DEMONSTRATIVA</span>
      <Transition name="phone-screen" mode="out-in"><div :key="selected" class="phone-screen"><div v-if="selected === 0" class="journey-screen"><AppIcon name="qrCode" :size="100" /><h3>Um convite para se conhecer</h3><p>QR ilustrativo · não escaneável</p></div>
      <div v-else-if="selected === 1" class="journey-screen"><AppIcon name="users" :size="40" /><h3>Vamos nos conhecer?</h3><p>Cadastre-se para receber novidades da empresa.</p><div class="fake-button">Iniciar cadastro</div></div>
      <div v-else-if="selected === 2" class="journey-screen"><h3>Seus dados</h3><div class="fake-input">Nome do cliente</div><div class="fake-input">Telefone com DDD</div><p>Exemplo visual, sem coleta de dados.</p></div>
      <div v-else-if="selected === 3" class="journey-screen"><h3>O que interessa a você?</h3><div class="interest-chips"><span>Novidades</span><span>Promoções</span><span>Categoria A</span></div></div>
      <div v-else class="journey-screen"><AppIcon name="confirm" :size="52" /><h3>Cadastro concluído</h3><p>O cliente passa a fazer parte da base da empresa.</p></div>
      </div></Transition>
    </div>
  </div></section>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AylaFlowLogo from '@/components/ui/AylaFlowLogo.vue'
const selected = ref(0)
const steps = ['Cliente encontra o QR Code', 'Abre o cadastro', 'Informa seus dados', 'Seleciona interesses', 'Entra na base da empresa']
</script>
