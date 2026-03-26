# Redesign Área de Cliente — TODO

## Fase 1: Auditoria
- [x] Mapear jornadas de utilizador por tier
- [x] Definir estrutura de ecrãs e tabs
- [x] Definir design system "luxo com vida"
- [ ] Ler código actual para inventariar reutilizáveis

## Fase 2: ProfilePage.tsx
- [ ] Reescrever — só dados pessoais + CV + subscrição
- [ ] Remover career progress, análises, ferramentas
- [ ] Layout 2 colunas desktop, stack mobile
- [ ] Aplicar novo design system (sombras, cores vivas)

## Fase 3: MemberArea.tsx
- [ ] Header da página: saudação + badge tier + quota semanal
- [ ] Tabs: Ferramentas · As minhas análises · Vagas · Conteúdos
- [ ] Tab Ferramentas: cards inline diferenciados por tier
- [ ] Tab Análises: última em destaque por tipo, restantes colapsáveis
- [ ] Tab Vagas: locked para Free/Essential, feed para Growth/Pro
- [ ] Tab Conteúdos: locked para Free/Essential, conteúdos para Growth/Pro
- [ ] Free users: UpgradePage ou preview com locks
- [ ] Remover duplicação com ProfilePage (sem dados pessoais, sem subscrição detalhada)

## Fase 4: Header + App.tsx
- [ ] Header: Início · Planos · Área de Membro · Meu Perfil (sem Dashboard, sem Painel)
- [ ] App.tsx: /perfil → ProfilePage, /membros → MemberArea
- [ ] Remover setas de navegação junto aos tabs
- [ ] Remover "Dashboard" de todo o lado

## Fase 5: Build + Push
- [ ] TypeScript sem erros nos ficheiros alterados
- [ ] Push para develop
