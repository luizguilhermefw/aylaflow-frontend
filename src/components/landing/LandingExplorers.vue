<template>
  <section id="recursos" class="landing-section landing-section--light section"><div class="landing-container"><p class="eyebrow">EXPLORE OS RECURSOS</p><h2>Muito mais que disparar mensagens</h2>
    <div class="explorer"><div class="demo-selectors" aria-label="Escolha um recurso"><button v-for="(item, index) in landingFeatures" :key="item.label" type="button" :aria-pressed="selectedFeature === index" @click="selectedFeature = index">{{ item.label }} <span aria-hidden="true">→</span></button></div>
      <div aria-live="polite" aria-atomic="true"><Transition name="feature-panel" mode="out-in"><div :key="selectedFeature" class="explorer-panel"><span class="eyebrow">EXEMPLO DEMONSTRATIVO</span><h3>{{ feature.title }}</h3><p>{{ feature.text }}</p><AppIcon v-if="selectedFeature === 3" name="qrCode" :size="64" /><dl class="demo-rows"><div v-for="row in feature.rows" :key="row[0] + row[1]"><dt>{{ row[0] }}</dt><dd>{{ row[1] }}</dd></div></dl></div></Transition></div>
    </div>
  </div></section>
  <section id="para-sua-empresa" class="landing-section landing-section--dark section"><div class="landing-container"><p class="eyebrow">EXPERIMENTE UM CENÁRIO</p><h2 class="section-title">Veja como uma automação pode nascer de uma situação comum.</h2>
    <div class="scenario-buttons" aria-label="Escolha uma situação"><button v-for="(item, index) in landingScenarios" :key="item.label" type="button" :aria-pressed="selectedScenario === index" @click="selectedScenario = index">{{ item.label }}</button></div>
    <div class="scenario-panel" aria-live="polite" aria-atomic="true"><span class="eyebrow">EXEMPLO DEMONSTRATIVO</span><dl class="scenario-flow"><div v-for="row in scenario.rows" :key="row[0]"><dt>{{ row[0] }}</dt><dd>{{ row[1] }}</dd></div></dl></div><p class="scenario-note">O processo segue a estratégia definida pela empresa, sem depender exclusivamente da memória da equipe.</p>
  </div></section>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { landingFeatures, landingScenarios, scenarioAt } from '@/features/landing/landing-demos'
const selectedFeature = ref(0)
const selectedScenario = ref(0)
const feature = computed(() => landingFeatures[selectedFeature.value] ?? landingFeatures[0])
const scenario = computed(() => scenarioAt(selectedScenario.value))
</script>
