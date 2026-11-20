<template>
  <footer class="institutional-footer">
    <div class="footer-columns">
      <div><RouterLink to="/" aria-label="AylaFlow — início"><AylaFlowLogo /></RouterLink><p>Automação de relacionamento para transformar clientes em novas oportunidades.</p><a class="footer-site-link" href="https://www.aylaflow.com.br">www.aylaflow.com.br</a></div>
      <div>
        <div class="lfweb-brand"><img :src="lfwebLogo" alt="LFWeb Studio" class="lfweb-footer-logo"></div>
        <p class="lfweb-attribution">Uma solução LFWeb Studio</p>
        <p class="company-id">CNPJ 62.510.089/0001-93</p>
        <a class="footer-site-link" href="https://www.lfwebstudio.com.br">www.lfwebstudio.com.br</a>
      </div>
      <nav aria-label="Institucional"><h2>Institucional</h2><RouterLink to="/privacidade">Política de Privacidade</RouterLink><RouterLink to="/termos">Termos de Uso</RouterLink><RouterLink to="/login">Entrar</RouterLink></nav>
    </div>
    <div class="footer-bottom"><small>© {{ new Date().getFullYear() }} AylaFlow</small><small>Uma solução LFWeb Studio <span class="bottom-company-id">· CNPJ 62.510.089/0001-93</span></small></div>
  </footer>
</template>
<script setup lang="ts">
import AylaFlowLogo from '@/components/ui/AylaFlowLogo.vue'
import lfwebLogo from '@/assets/brand/LOGO-LFWEBstudioSF.png'
</script>
<style scoped>
.institutional-footer { padding: 48px max(24px, calc((100% - 1200px) / 2)) 24px; background: linear-gradient(180deg, var(--bg-surface), var(--bg-page)); color: var(--text-secondary); border-top: 1px solid var(--border-default); font-size: 14px; }
.institutional-footer .footer-columns { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(220px, .9fr) minmax(180px, .7fr); align-items: start; gap: 56px; }
.institutional-footer .footer-columns > * { min-width: 0; }
.institutional-footer .aylaflow-logo { --aylaflow-logo-width: 110px; }
.institutional-footer .lfweb-brand { display: inline-flex; align-items: center; justify-content: center; width: 190px; max-width: 100%; min-height: 78px; padding: 10px 18px; border-radius: 16px; background: #002333; border: 1px solid rgba(30,212,199,.18); box-shadow: 0 3px 10px rgba(0,0,0,.06); }
.institutional-footer .lfweb-footer-logo { display: block; width: 150px; max-width: 100%; height: auto; object-fit: contain; }
.institutional-footer .lfweb-attribution { margin-top: 14px; font-size: 14px; font-weight: 600; color: var(--text-primary); }
.institutional-footer .company-id { font-size: 13px; color: var(--text-muted); }
.institutional-footer h2 { color: var(--text-primary); font-size: 16px; line-height: 1.4; letter-spacing: normal; margin: 0 0 12px; }
.institutional-footer p { max-width: 330px; margin: 0 0 10px; font-size: 14px; line-height: 1.6; }
.institutional-footer a { max-width: 100%; font-size: 14px; line-height: 1.5; overflow-wrap: normal; word-break: normal; }
.institutional-footer .footer-site-link { position: relative; display: inline-flex; align-items: center; min-height: 44px; padding-block: 8px; color: var(--brand-light); font-size: .9rem; font-weight: 650; letter-spacing: -.01em; text-decoration: none; }
.institutional-footer .footer-site-link::after { content: ''; position: absolute; bottom: 5px; left: 0; width: 28%; height: 2px; border-radius: 999px; background: var(--brand-primary); transition: width .25s ease; }
.institutional-footer .footer-site-link:hover::after, .institutional-footer .footer-site-link:focus-visible::after { width: 100%; }
.institutional-footer nav { display: flex; align-items: flex-start; flex-direction: column; gap: 0; }
.institutional-footer nav h2, .institutional-footer nav a { white-space: nowrap; }
.institutional-footer nav a { position: relative; display: flex; align-items: center; min-height: 44px; color: var(--text-secondary); text-decoration: none; transition: color .15s; }
.institutional-footer nav a::after { content: ''; position: absolute; left: 0; bottom: 6px; width: 0; height: 1px; background: var(--brand-primary); transition: width .2s ease; }
.institutional-footer nav a:hover, .institutional-footer nav a:focus-visible { color: var(--brand-light); }
.institutional-footer nav a:hover::after, .institutional-footer nav a:focus-visible::after { width: 100%; }
.institutional-footer a:focus-visible { outline: 2px solid var(--brand-light); outline-offset: 4px; }
.institutional-footer .footer-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px 24px; margin-top: 36px; padding-top: 18px; border-top: 1px solid var(--border-default); color: var(--text-muted); }
.institutional-footer .footer-bottom small { font-size: 13px; line-height: 1.5; }
@media(max-width: 760px) { .institutional-footer .footer-columns { grid-template-columns: 1fr; gap: 32px; } .institutional-footer .footer-bottom { flex-direction: column; } .institutional-footer .bottom-company-id { display: block; } }
@media(prefers-reduced-motion: reduce) { .institutional-footer a, .institutional-footer a::after { transition: none; } }
</style>
