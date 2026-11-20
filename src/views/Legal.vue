<template>
  <div class="landing legal-page">
    <LandingHeader :contact="contact" institutional />
    <main>
      <section class="legal-hero"><div class="legal-content">
        <nav class="breadcrumbs" aria-label="Localização"><RouterLink to="/">AylaFlow</RouterLink><span aria-hidden="true">/</span><span aria-current="page">{{ title }}</span></nav>
        <p class="legal-eyebrow">INSTITUCIONAL</p><h1>{{ title }}</h1><p class="legal-intro">{{ intro }}</p>
      </div></section>
      <article class="legal-content legal-document" :aria-label="title">
        <nav class="legal-index" aria-label="Nesta página"><h2>Nesta página</h2><ul><li v-for="(item, index) in sections" :key="item.title"><a :href="'#legal-section-' + index">{{ item.title }}</a></li><li><a href="#legal-contact">{{ privacy ? 'Contato sobre privacidade' : 'Contato' }}</a></li></ul></nav>
        <section v-for="(item, index) in sections" :id="'legal-section-' + index" :key="item.title" class="legal-section"><h2>{{ item.title }}</h2><p v-for="paragraph in item.paragraphs" :key="paragraph">{{ paragraph }}</p><ul v-if="item.items.length"><li v-for="entry in item.items" :key="entry">{{ entry }}</li></ul><p v-for="paragraph in item.after" :key="paragraph">{{ paragraph }}</p><p v-if="!privacy && item.title === 'Dados pessoais'"><RouterLink to="/privacidade">Consulte a Política de Privacidade</RouterLink>.</p></section>
        <section id="legal-contact" class="legal-section"><h2>{{ privacy ? 'Contato sobre privacidade' : 'Contato' }}</h2><p v-if="privacy">Para dúvidas sobre esta Política ou solicitações relacionadas à proteção de dados pessoais, entre em contato com a LFWeb Studio:</p><p>LFWeb Studio<br>CNPJ 62.510.089/0001-93<br><a href="mailto:luiz.wagner@lfwebstudio.com.br">luiz.wagner@lfwebstudio.com.br</a><br><a href="https://www.lfwebstudio.com.br">www.lfwebstudio.com.br</a></p><p v-if="privacy">Caso a solicitação esteja relacionada a dados tratados em nome de uma empresa usuária do AylaFlow, poderá ser necessário envolver essa empresa para atendimento adequado do pedido.</p></section>
        <nav class="legal-related" aria-label="Documentos legais"><RouterLink to="/privacidade">Política de Privacidade</RouterLink><RouterLink to="/termos">Termos de Uso</RouterLink></nav>
      </article>
    </main><LandingFooter /><LandingFloatingActions />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LandingHeader from '@/components/landing/LandingHeader.vue'
import LandingFloatingActions from '@/components/landing/LandingFloatingActions.vue'
import { usePageMeta } from '@/features/landing/page-meta'
import { salesContactHref } from '@/features/landing/landing.logic'
import '@/components/landing/landing.css'
import LandingFooter from '@/components/landing/LandingFooter.vue'
const route = useRoute()
const privacy = computed(() => route.path === '/privacidade')
const title = computed(() => privacy.value ? 'Política de Privacidade' : 'Termos de Uso')
const contact = salesContactHref(import.meta.env.VITE_SALES_CONTACT_URL, import.meta.env.VITE_ACTIVATION_CONTACT_URL)
const intro = computed(() => privacy.value ? 'Entenda como tratamos informações e quais são os seus direitos ao utilizar o AylaFlow.' : 'Condições gerais para acesso e utilização dos serviços e recursos do AylaFlow.')
usePageMeta(() => ({
  title: title.value + ' | AylaFlow',
  description: privacy.value ? 'Consulte a Política de Privacidade do AylaFlow e entenda como informações pessoais podem ser tratadas e quais são os direitos dos titulares.' : 'Consulte os Termos de Uso do AylaFlow e as condições gerais aplicáveis ao acesso e utilização da plataforma.',
}))
const sections = computed(() => privacy.value ? [
  {
    "title": "Quem somos",
    "paragraphs": [
      "O AylaFlow é uma plataforma de automação de relacionamento desenvolvida e operada pela LFWeb Studio, inscrita no CNPJ 62.510.089/0001-93.",
      "Esta Política explica como dados pessoais podem ser tratados no site, nos contatos comerciais e na utilização da plataforma AylaFlow.",
      "Os papéis da LFWeb Studio no tratamento de dados podem variar conforme a operação:"
    ],
    "items": [
      "Quando uma pessoa entra em contato diretamente com a LFWeb Studio ou cria uma relação comercial com o AylaFlow, a LFWeb Studio pode atuar como controladora dos dados necessários a esse relacionamento.",
      "Quando uma empresa utiliza o AylaFlow para tratar dados de seus próprios clientes, essa empresa normalmente define as finalidades e os critérios do tratamento, enquanto o AylaFlow poderá atuar como operador, tratando os dados conforme as configurações e instruções da empresa contratante."
    ],
    "after": [
      "A definição final de controlador e operador deve sempre considerar a operação concreta de tratamento."
    ]
  },
  {
    "title": "Quais dados podem ser tratados",
    "paragraphs": [
      "Conforme o recurso e o contexto de utilização, podem ser tratados:"
    ],
    "items": [
      "Dados de identificação, como nome.",
      "Dados de contato, como telefone e e-mail.",
      "Informações cadastrais fornecidas pelo próprio titular ou pela empresa usuária.",
      "Preferências e interesses cadastrados.",
      "Informações relacionadas ao relacionamento entre a empresa usuária e seus clientes.",
      "Registros de utilização, operação e comunicações necessárias ao funcionamento e rastreabilidade da plataforma.",
      "Dados técnicos necessários à autenticação, segurança e funcionamento do serviço."
    ],
    "after": [
      "A visita à página institucional do AylaFlow, por si só, não equivale à criação de uma conta ou ao cadastro em uma base de clientes."
    ]
  },
  {
    "title": "Finalidades do tratamento",
    "paragraphs": [
      "Os dados podem ser tratados, conforme o contexto, para:"
    ],
    "items": [
      "Responder solicitações e contatos.",
      "Realizar demonstrações, implantação e suporte do AylaFlow.",
      "Criar e administrar contas e acessos.",
      "Fornecer as funcionalidades contratadas.",
      "Executar automações e campanhas configuradas pelas empresas usuárias.",
      "Permitir cadastros públicos solicitados pelas empresas usuárias.",
      "Manter registros necessários à operação, segurança e auditoria.",
      "Prevenir uso indevido e proteger a plataforma.",
      "Cumprir obrigações legais e regulatórias quando aplicáveis.",
      "Exercer direitos em processos administrativos, judiciais ou extrajudiciais."
    ],
    "after": [
      "O tratamento realizado por uma empresa usuária do AylaFlow depende também das finalidades, bases legais e configurações definidas por essa empresa."
    ]
  },
  {
    "title": "Bases legais",
    "paragraphs": [
      "O tratamento de dados pessoais não depende necessariamente de consentimento em todas as situações.",
      "Conforme o contexto, poderão ser utilizadas bases legais previstas na LGPD, incluindo, entre outras:"
    ],
    "items": [
      "Execução de contrato ou procedimentos preliminares relacionados a contrato.",
      "Cumprimento de obrigação legal ou regulatória.",
      "Exercício regular de direitos.",
      "Legítimo interesse, quando aplicável e respeitados os direitos e expectativas do titular.",
      "Consentimento, quando esta for a base adequada para a finalidade específica."
    ],
    "after": []
  },
  {
    "title": "Dados tratados em nome das empresas usuárias",
    "paragraphs": [
      "As empresas que utilizam o AylaFlow são responsáveis por avaliar a legitimidade da coleta, importação e utilização das informações de seus clientes e por definir as finalidades de suas comunicações.",
      "Quando o AylaFlow atuar como operador, o tratamento será realizado de acordo com as configurações e instruções da empresa usuária, dentro dos limites técnicos e contratuais aplicáveis.",
      "A empresa usuária deve observar, entre outros aspectos:"
    ],
    "items": [
      "As bases legais aplicáveis.",
      "As preferências dos titulares.",
      "Solicitações de interrupção das comunicações.",
      "Regras aplicáveis ao envio de mensagens.",
      "Suas próprias obrigações de transparência perante os titulares."
    ],
    "after": []
  },
  {
    "title": "WhatsApp e Meta",
    "paragraphs": [
      "O AylaFlow pode utilizar recursos da WhatsApp Business Platform para funcionalidades de comunicação configuradas pelas empresas usuárias.",
      "Nessas situações, determinadas informações necessárias ao envio e processamento das mensagens poderão ser transmitidas aos serviços da Meta conforme o funcionamento da integração e as políticas aplicáveis à plataforma.",
      "Separadamente, botões da página institucional podem direcionar o visitante para uma conversa no WhatsApp com a LFWeb Studio. Nesse caso, a interação também estará sujeita às políticas e condições do próprio WhatsApp/Meta.",
      "Isso não significa que todos os dados armazenados ou tratados internamente pelo AylaFlow sejam enviados à Meta."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Compartilhamento e fornecedores",
    "paragraphs": [
      "A LFWeb Studio poderá utilizar fornecedores necessários à operação do AylaFlow, por exemplo para:"
    ],
    "items": [
      "Infraestrutura e hospedagem.",
      "Banco de dados.",
      "Comunicação e mensageria.",
      "Autenticação e segurança.",
      "Envio de notificações.",
      "Suporte técnico."
    ],
    "after": [
      "Somente informações necessárias à prestação de cada serviço deverão ser disponibilizadas aos respectivos fornecedores.",
      "Dados também poderão ser compartilhados quando necessário para cumprimento de obrigação legal, exercício de direitos ou atendimento de determinação de autoridade competente."
    ]
  },
  {
    "title": "Transferência internacional",
    "paragraphs": [
      "Alguns fornecedores de tecnologia utilizados na operação poderão armazenar ou processar informações fora do Brasil.",
      "Quando houver transferência internacional de dados pessoais, deverão ser observados os requisitos aplicáveis da LGPD e das regulamentações pertinentes."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Por quanto tempo os dados são mantidos",
    "paragraphs": [
      "Os dados pessoais são mantidos pelo período necessário para cumprir as finalidades que justificaram seu tratamento e, quando aplicável, para atender obrigações legais, contratuais, exercício de direitos e requisitos de segurança.",
      "Após o término da necessidade de tratamento, os dados poderão ser eliminados ou anonimizados, observadas as hipóteses legais que autorizem sua conservação."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Segurança",
    "paragraphs": [
      "A LFWeb Studio adota medidas técnicas e administrativas voltadas à proteção das informações contra acessos não autorizados e situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou acesso indevido, considerando a natureza das informações e os riscos envolvidos na operação.",
      "A segurança também depende da atuação dos usuários, que devem proteger suas credenciais e utilizar os acessos de forma adequada."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Direitos dos titulares",
    "paragraphs": [
      "Nos termos da LGPD e conforme aplicável a cada situação, o titular poderá solicitar ao controlador responsável:"
    ],
    "items": [
      "Confirmação da existência de tratamento.",
      "Acesso aos dados.",
      "Correção de dados incompletos, inexatos ou desatualizados.",
      "Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.",
      "Portabilidade, quando aplicável e regulamentada.",
      "Informação sobre entidades públicas e privadas com as quais houve compartilhamento.",
      "Informações sobre a possibilidade de não fornecer consentimento e suas consequências, quando aplicável.",
      "Revogação do consentimento.",
      "Eliminação de dados tratados com fundamento no consentimento, observadas as hipóteses legais de conservação.",
      "Oposição ao tratamento nas hipóteses previstas em lei.",
      "Revisão de decisões tomadas unicamente com base em tratamento automatizado, quando aplicável."
    ],
    "after": [
      "Alguns direitos podem depender da verificação da identidade do solicitante e das circunstâncias concretas do tratamento.",
      "Quando os dados forem tratados pelo AylaFlow em nome de uma empresa usuária, determinadas solicitações poderão precisar ser encaminhadas ou coordenadas com essa empresa, que poderá atuar como controladora."
    ]
  },
  {
    "title": "Cookies e tecnologias semelhantes",
    "paragraphs": [
      "A página institucional do AylaFlow não utiliza atualmente ferramentas de publicidade comportamental ou análise não essencial identificadas na implementação auditada.",
      "Tecnologias estritamente necessárias ao funcionamento, segurança, autenticação ou preferências da aplicação poderão ser utilizadas quando aplicável.",
      "Caso sejam adicionadas futuramente tecnologias não essenciais que dependam de consentimento ou outra forma de gestão de preferências, esta Política e os mecanismos de escolha serão atualizados conforme necessário."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Atualizações da política",
    "paragraphs": [
      "Esta Política poderá ser atualizada para refletir mudanças na plataforma, nas operações de tratamento ou na legislação aplicável.",
      "A versão vigente estará sempre disponível nesta página.",
      "Quando alterações relevantes exigirem comunicação adicional aos titulares ou empresas usuárias, serão adotadas medidas adequadas conforme o contexto."
    ],
    "items": [],
    "after": []
  }
] : [
  {
    "title": "Aceitação dos termos",
    "paragraphs": [
      "Ao acessar ou utilizar o AylaFlow, o usuário declara ter conhecimento destes Termos de Uso.",
      "A utilização de funcionalidades contratadas também poderá estar sujeita a proposta comercial, contrato, plano ou condições específicas celebradas com a LFWeb Studio.",
      "Em caso de divergência, as condições específicas formalmente contratadas prevalecem para os assuntos nelas regulados."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Finalidade",
    "paragraphs": [
      "O AylaFlow é uma plataforma destinada a auxiliar empresas na gestão e automação de relacionamento com seus clientes, incluindo recursos de reativação, segmentação, campanhas, cadastros e comunicações.",
      "O AylaFlow fornece recursos tecnológicos para apoiar essas operações, mas não garante vendas, faturamento, conversões ou outros resultados comerciais específicos."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Identificação institucional",
    "paragraphs": [
      "O AylaFlow é uma solução da LFWeb Studio, CNPJ 62.510.089/0001-93."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Conta e credenciais",
    "paragraphs": [
      "O usuário é responsável por:"
    ],
    "items": [
      "Fornecer informações corretas para criação e manutenção de sua conta.",
      "Manter suas credenciais confidenciais.",
      "Não compartilhar acessos pessoais de forma indevida.",
      "Informar a LFWeb Studio quando identificar acesso não autorizado ou incidente relacionado à sua conta."
    ],
    "after": [
      "A empresa contratante é responsável por gerenciar os acessos concedidos aos seus usuários."
    ]
  },
  {
    "title": "Uso permitido",
    "paragraphs": [
      "O AylaFlow deve ser utilizado de forma lícita e compatível com sua finalidade.",
      "É proibido utilizar a plataforma para:"
    ],
    "items": [
      "Atividades ilícitas ou fraudulentas.",
      "Envio de comunicações que violem legislação aplicável.",
      "Tratamento de dados obtidos de forma ilegítima.",
      "Tentativa de acesso não autorizado a sistemas, contas ou dados.",
      "Interferência intencional na segurança ou funcionamento da plataforma.",
      "Engenharia reversa, exploração de vulnerabilidades ou cópia indevida do software, salvo hipóteses expressamente permitidas por lei."
    ],
    "after": []
  },
  {
    "title": "Responsabilidade sobre a base de clientes",
    "paragraphs": [
      "A empresa usuária é responsável pelas informações que insere, importa ou utiliza no AylaFlow e deve possuir fundamento adequado para seu tratamento.",
      "Cabe à empresa usuária avaliar:"
    ],
    "items": [
      "Origem e legitimidade da base.",
      "Bases legais aplicáveis.",
      "Permissões para comunicação.",
      "Preferências dos clientes.",
      "Solicitações de opt-out.",
      "Conteúdo das campanhas.",
      "Cumprimento das regras aplicáveis ao seu setor."
    ],
    "after": [
      "O AylaFlow não transforma automaticamente uma base irregular em uma base legítima para comunicação."
    ]
  },
  {
    "title": "WhatsApp e comunicações",
    "paragraphs": [
      "Funcionalidades de comunicação podem depender de serviços de terceiros, incluindo provedores relacionados ao WhatsApp.",
      "A empresa usuária deve respeitar:"
    ],
    "items": [
      "Legislação aplicável.",
      "Políticas do canal utilizado.",
      "Regras de templates e mensagens quando existentes.",
      "Solicitações de interrupção de comunicação dos destinatários."
    ],
    "after": [
      "O uso do AylaFlow não dispensa a empresa usuária de suas próprias responsabilidades perante seus clientes e titulares de dados."
    ]
  },
  {
    "title": "Dados pessoais",
    "paragraphs": [
      "O tratamento de dados pessoais relacionado ao AylaFlow deve observar a Política de Privacidade e, quando aplicável, os instrumentos celebrados entre a LFWeb Studio e a empresa contratante.",
      "Quando o AylaFlow atuar como operador, os dados serão tratados conforme as instruções da empresa responsável pela finalidade do tratamento, dentro dos limites técnicos e contratuais aplicáveis."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Disponibilidade",
    "paragraphs": [
      "A LFWeb Studio busca manter o AylaFlow disponível e operacional, mas o serviço poderá sofrer interrupções temporárias decorrentes de:"
    ],
    "items": [
      "Manutenção.",
      "Atualizações.",
      "Falhas técnicas.",
      "Indisponibilidade de infraestrutura.",
      "Falhas ou alterações em integrações externas.",
      "Situações fora do controle razoável da LFWeb Studio."
    ],
    "after": [
      "Não existe garantia de disponibilidade ininterrupta, salvo se condição específica tiver sido formalmente contratada."
    ]
  },
  {
    "title": "Integrações de terceiros",
    "paragraphs": [
      "Algumas funcionalidades dependem de serviços fornecidos por terceiros.",
      "Alterações, limitações, indisponibilidade ou encerramento desses serviços podem afetar determinadas funcionalidades do AylaFlow.",
      "A LFWeb Studio poderá realizar adaptações técnicas razoáveis quando necessárias, sem garantir a continuidade de funcionalidades que dependam exclusivamente de decisões de terceiros."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Propriedade intelectual",
    "paragraphs": [
      "A utilização do AylaFlow não transfere ao usuário direitos de propriedade sobre:"
    ],
    "items": [
      "Software.",
      "Código.",
      "Identidade visual.",
      "Marcas.",
      "Documentação.",
      "Interfaces.",
      "Materiais desenvolvidos pela LFWeb Studio."
    ],
    "after": [
      "O conteúdo e os dados pertencentes às empresas usuárias ou a terceiros permanecem sujeitos aos respectivos direitos de seus titulares."
    ]
  },
  {
    "title": "Suspensão e restrição de acesso",
    "paragraphs": [
      "O acesso poderá ser temporariamente restringido quando necessário para:"
    ],
    "items": [
      "Segurança.",
      "Manutenção.",
      "Investigação de uso indevido.",
      "Descumprimento relevante destes Termos.",
      "Inadimplemento, quando previsto nas condições comerciais aplicáveis.",
      "Cumprimento de obrigação legal ou determinação de autoridade competente."
    ],
    "after": [
      "Sempre que razoavelmente possível, serão considerados o contexto e as condições contratuais aplicáveis."
    ]
  },
  {
    "title": "Condições comerciais",
    "paragraphs": [
      "Planos, preços, limites de uso, implantação, suporte e demais condições comerciais são definidos em proposta, contratação ou instrumento específico.",
      "Estes Termos não substituem condições comerciais formalmente acordadas."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Limitação sobre resultados",
    "paragraphs": [
      "O AylaFlow é uma ferramenta de apoio à operação da empresa.",
      "Resultados comerciais dependem de diversos fatores externos, como qualidade da base, estratégia, ofertas, comunicação, mercado e decisões da própria empresa.",
      "A LFWeb Studio não garante resultados específicos de vendas, faturamento, conversão ou retenção."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Alterações do serviço e destes Termos",
    "paragraphs": [
      "O AylaFlow poderá evoluir, receber novos recursos ou ter funcionalidades alteradas para manutenção, segurança, adequação técnica ou evolução do produto.",
      "Estes Termos também poderão ser atualizados.",
      "A versão vigente permanecerá disponível nesta página.",
      "Mudanças relevantes serão tratadas conforme exigido pela legislação e pelos instrumentos contratuais aplicáveis."
    ],
    "items": [],
    "after": []
  },
  {
    "title": "Legislação aplicável",
    "paragraphs": [
      "Estes Termos são interpretados de acordo com a legislação brasileira aplicável."
    ],
    "items": [],
    "after": []
  }
])
</script>
<style scoped>
.legal-page { background: var(--bg-page); color: var(--text-primary); min-height: 100vh; }
.legal-content { width: min(900px, calc(100% - 40px)); margin-inline: auto; }
.legal-hero { padding-block: 64px; background: radial-gradient(circle at 80% 20%, rgba(30,212,199,.1), transparent 30%), linear-gradient(145deg, #08383d, #062b30); color: #f2f6f7; }
.breadcrumbs { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 28px; font-size: 13px; color: #c5d0d3; }
.breadcrumbs a { color: #1ed4c7; }
.legal-hero .legal-eyebrow { color: #1ed4c7; font-size: 12px; font-weight: 700; letter-spacing: .12em; margin-bottom: 12px; }
.legal-hero h1 { font-size: clamp(2rem, 4vw, 3.2rem); margin-bottom: 18px; }
.legal-hero .legal-intro { color: #c5d0d3; max-width: 650px; line-height: 1.7; }
.legal-document { padding-block: 48px 72px; font-size: 16px; line-height: 1.8; }
.legal-document h2 { font-size: 1.3rem; margin-bottom: 14px; letter-spacing: normal; }
.legal-section { margin-top: 36px; padding-top: 24px; border-top: 1px solid var(--border-default); scroll-margin-top: 110px; }
.legal-document p { color: var(--text-secondary); }
.legal-page a { text-underline-offset: 4px; }
.legal-document a { color: var(--brand-light); overflow-wrap: anywhere; }
.legal-page a:focus-visible { outline: 2px solid var(--brand-light); outline-offset: 4px; }
.legal-index { padding-bottom: 12px; }
.legal-index ul { padding-left: 20px; columns: 2; column-gap: 32px; }
.legal-index li { break-inside: avoid; margin-bottom: 8px; }
.legal-related { margin-top: 36px; display: flex; flex-wrap: wrap; gap: 24px; }
@media(max-width: 600px) { .legal-hero { padding-block: 40px; } .legal-document { padding-block: 32px 48px; } .legal-index ul { columns: 1; } }
</style>
