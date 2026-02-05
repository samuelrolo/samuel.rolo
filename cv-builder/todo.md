# SHARE2INSPIRE - CV Builder TODO

## ✅ Fase 1: Configuração da Base de Dados e Estrutura de Dados (CONCLUÍDA)
- [x] Criar schema da base de dados para currículos (resumes)
- [x] Criar schema para templates
- [x] Criar schema para exportações (exports)
- [x] Criar schema para pagamentos (payments)
- [x] Criar schema para subscrições (subscriptions)
- [x] Executar migração da base de dados (pnpm db:push)
- [x] Criar tipos TypeScript para toda a estrutura
- [x] Criar helpers de base de dados
- [x] Popular templates iniciais

## ✅ Fase 2: Sistema de Personalização Visual (CONCLUÍDA)
- [x] Criar sistema de packs de design pré-configurados (4 packs)
- [x] Implementar personalização granular de cores (6 esquemas + custom)
- [x] Implementar seleção de tipografia (5 opções)
- [x] Implementar seleção de estilos de ícones (6 opções)
- [x] Implementar seleção de layouts (3 opções)
- [x] Criar sistema de formas geométricas decorativas (rectangular/circular/hybrid)
- [x] Implementar configuração de fotografia (formas, tamanhos, bordas)
- [x] Implementar sistema de background image (marca de água)
- [x] Criar hierarquia de camadas (z-index) para legibilidade
- [x] Implementar validação de contraste automática

## ✅ Fase 3: Templates e Componentes (CONCLUÍDA)
- [x] Criar template modular com renderização dinâmica
- [x] Implementar 3 layouts (1 coluna, 2 colunas, sidebar)
- [x] Criar 10 componentes de secções reutilizáveis
- [x] Integrar sistema de cores e tipografia
- [x] Adicionar suporte para ícones personalizáveis
- [x] Criar modelo base pré-preenchido com placeholders

## ✅ Fase 4: Landing Page e Navegação Inicial (CONCLUÍDA)
- [x] Criar landing page com 2 opções principais
- [x] Implementar opção "Criar currículo online"
- [x] Implementar opção "Pedir revisão profissional" (link externo)
- [x] Criar página de personalização visual
- [x] Implementar preview em tempo real (escala 50%)
- [x] Criar rotas e navegação

## ✅ Fase 5: Backend API (CONCLUÍDA)
- [x] Criar procedimentos tRPC para currículos (list, get, create, update, delete)
- [x] Criar procedimentos tRPC para templates (list, get)
- [x] Implementar verificação de utilizador premium
- [x] Integrar com sistema de autenticação Manus

## 🔄 Fase 6: Editor Completo com Formulários (EM PROGRESSO)
- [ ] Criar layout do editor (sidebar formulário + preview)
- [ ] Implementar formulário de informação pessoal
- [ ] Implementar formulário de perfil profissional
- [ ] Implementar formulário de experiência (adicionar/remover/editar)
- [ ] Implementar formulário de educação (adicionar/remover/editar)
- [ ] Implementar formulário de skills com níveis
- [ ] Implementar formulário de idiomas
- [ ] Implementar formulário de certificações
- [ ] Implementar formulário de cursos
- [ ] Implementar formulário de referências
- [ ] Implementar formulário de informação adicional
- [ ] Implementar upload e crop de fotografia
- [ ] Implementar persistência automática
- [ ] Criar rota /editor/:id

## 📋 Fase 7: Sistema Drag-and-Drop
- [x] Implementar drag-and-drop de secções (@dnd-kit)
- [x] Criar sistema de reordenação visual
- [ ] Implementar drag-and-drop de formas geométricas
- [ ] Adicionar controles de edição de formas (redimensionar, mover, remover)
- [x] Implementar feedback visual durante drag
- [x] Sincronizar estado com backend

## 📥 Fase 8: Três Métodos de Importação
- [x] Criar página de escolha de método
- [x] Implementar LinkedIn OAuth 2.0 (UI pronta, requer credenciais)
- [x] Criar mapeamento de dados LinkedIn → estrutura interna
- [x] Implementar upload de PDF do LinkedIn
- [x] Criar parser de PDF (pdf-parse)
- [x] Implementar extração de dados estruturados do PDF
- [x] Criar procedimentos tRPC para importação
- [x] Testar importação LinkedIn OAuth funcional
- [x] Testar importação LinkedIn PDF funcional
- [x] Testar preenchimento manual funcional

## 📄 Fase 9: Sistema de Exportação
- [ ] Implementar geração de PDF (jsPDF ou puppeteer)
- [ ] Implementar geração de Word (.docx)
- [ ] Criar sistema de watermark para versão gratuita
- [ ] Implementar exportação premium sem watermark
- [ ] Upload de ficheiros exportados para S3
- [ ] Criar procedimentos tRPC para exportação

## 💳 Fase 10: Integração Stripe e Paywall
- [ ] Configurar Stripe (webdev_add_feature stripe)
- [ ] Criar produtos Stripe (pay-per-export, subscrição mensal, anual)
- [ ] Implementar checkout para exportação premium
- [ ] Implementar checkout para subscrições
- [ ] Criar webhooks Stripe
- [ ] Implementar verificação de status premium
- [ ] Criar UI de paywall transparente

## 🎨 Fase 11: Sistema de Sugestões Contextuais (Opcional)
- [ ] Integrar LLM para sugestões de texto
- [ ] Criar sugestões por secção (experiência, skills, etc.)
- [ ] Implementar UI de sugestões não-intrusiva
- [ ] Criar procedimentos tRPC para sugestões

## ✅ Fase 12: Testes e Ajustes Finais
- [ ] Criar testes vitest para procedimentos críticos
- [ ] Testar fluxo completo de criação
- [ ] Testar todos os métodos de importação
- [ ] Testar exportação PDF/Word
- [ ] Testar sistema de pagamento
- [ ] Verificar responsividade mobile
- [ ] Ajustar estilos e UX
- [ ] Criar checkpoint final

## 🚀 Funcionalidades Futuras
- [ ] Sistema de análise ATS
- [ ] Mais templates
- [ ] Versionamento de currículos
- [ ] Partilha via link público
- [ ] Estatísticas de visualizações
- [ ] Integração com plataformas de emprego


## 🎨 Ajustes de Identidade Visual SHARE2INSPIRE
- [x] Atualizar paleta de cores para dourado/preto/branco
- [ ] Ajustar tipografia para corresponder ao site principal
- [ ] Atualizar componentes de UI (botões, cards, inputs)
- [ ] Ajustar landing page com identidade SHARE2INSPIRE
- [ ] Atualizar página de personalização com novas cores

## 💳 Integração IFTHENPay/MB Way
- [x] Remover referências ao Stripe
- [x] Implementar integração IFTHENPay API (via backend Share2Inspire)
- [x] Criar procedimentos tRPC para pagamentos MB Way
- [x] Criar procedimentos tRPC para pagamentos Multibanco
- [x] Implementar webhooks IFTHENPay
- [x] Criar UI de checkout com MB Way
- [x] Criar UI de checkout com Multibanco (alternativa)
- [x] Implementar validação de créditos antes de exportação sem watermark
- [ ] Testar fluxo completo de pagamento

## 🔗 Exportação para GitHub
- [ ] Configurar repositório GitHub
- [ ] Exportar código completo
- [ ] Adicionar README com instruções
- [ ] Configurar CI/CD se necessário


## 💰 Sistema de Planos de Preços
- [ ] Implementar estrutura de planos (1 modelo 2,49€, 3 modelos 5€, 5 modelos 10€)
- [ ] Criar tabela de subscriptions/credits na base de dados
- [ ] Sistema de créditos por utilizador
- [ ] UI de seleção de planos
- [ ] Validação de créditos antes de exportação
- [ ] Decrementar créditos após exportação bem-sucedida


## 🎨 Alinhamento de Design e Copywriting com Share2Inspire
- [ ] Analisar site Share2Inspire (cores, tipografia, layout)
- [ ] Capturar tom de comunicação e estilo de copywriting
- [ ] Ajustar paleta de cores para corresponder ao site
- [ ] Ajustar tipografia (fontes) para corresponder ao site
- [ ] Reescrever textos com tom e estilo Share2Inspire
- [ ] Ajustar layout e estrutura visual

## 🔗 Integração com Repositório GitHub Existente
- [ ] Clonar repositório samuel.rolo
- [ ] Integrar código do CV Builder no repositório existente
- [ ] Conectar com serviço de revisão de CVs existente
- [ ] Testar integração completa
- [ ] Fazer commit e push para GitHub


## 📝 Replicação de Templates PowerPoint
- [x] Analisar template "Black Minimalist Engineer"
- [x] Analisar template "Green and Black Business"
- [x] Criar componente React para template Black Minimalist
- [x] Criar componente React para template Green Business
- [x] Sistema de seleção de templates (2 opções fixas)
- [ ] Melhorar preview visual dos templates na página de seleção


## 📏 Standard de Página A4
- [ ] Definir dimensões exatas A4 (210mm x 297mm)
- [ ] Criar preview com régua visual de limites A4
- [ ] Implementar indicador de ocupação de página
- [ ] Sistema de avisos (muito curto / bem preenchido / excede)
- [ ] Espaçamento automático para preencher página
- [ ] Garantir conteúdo padrão ocupa ~90% da página


## 🎨 Ajustes Finais de Layout Share2Inspire
- [x] Revisar e ajustar tipografia (fontes, tamanhos, pesos)
- [x] Ajustar espaçamentos para estilo minimalista
- [x] Refinar paleta de cores (dourado #D4A574)
- [x] Melhorar copywriting com tom Share2Inspire
- [x] Adicionar animações subtis e transições
- [x] Otimizar responsividade mobile

## 🔗 Integração na Página de Serviços
- [x] Clonar repositório samuelrolo/samuel.rolo
- [x] Adicionar card "CV Builder" na página servicos.html (ficheiro INTEGRATION_CARD.html criado)
- [x] Criar link para a aplicação CV Builder
- [x] Criar guia de integração completo (INTEGRATION_GUIDE.md)
- [ ] Fazer commit e push para GitHub (manual)


## 🎨 Ajuste de Cores Exatas Share2Inspire
- [x] Verificar cores exatas do site Share2Inspire
- [x] Aplicar cor dourada exata (#BF9A33)
- [x] Ajustar cor de fundo e textos
- [x] Testar consistência visual


## 📤 Integração GitHub Final
- [x] Ler página servicos.html do repositório samuel.rolo
- [x] Adicionar card CV Builder à página
- [x] Commit das alterações
- [x] Push para GitHub


## 🔧 Correções Urgentes
- [x] Corrigir preview dos templates na página de seleção
- [x] Ajustar layout da página servicos.html para 2+2 (duas linhas de 2 serviços)
- [ ] Testar navegação completa

## 🔄 Implementação LinkedIn OAuth Backend
- [x] Criar endpoint /api/linkedin/callback
- [x] Implementar troca de código por access token
- [x] Integrar com LinkedIn API para obter dados do perfil
- [x] Criar mapeamento de dados LinkedIn → estrutura CV
- [x] Implementar procedimento tRPC getLinkedInAuthUrl
- [x] Atualizar UI para usar fluxo OAuth completo
- [x] Suporte para carregar dados importados no CVEditor
- [ ] Testar fluxo OAuth end-to-end
