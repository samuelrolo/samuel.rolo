# CV Analyser v2 - Todo List

## Frontend (Análise Gratuita)

### Componentes Visuais
- [x] Copiar componentes do Lovable para cv-analyser-v2
  - [x] ATSRejectionBlock.tsx
  - [x] DimensionBar.tsx (com transparência no benchmark)
  - [ ] QuadrantCard.tsx
  - [x] AnalysisResults.tsx
- [ ] Adicionar 1 característica cativante por dimensão (em vez de análise completa)
- [ ] Implementar secções locked com blur/transparência
- [ ] Adicionar preview de conteúdo premium
- [ ] Criar QuadrantCard component
- [ ] Criar LockedSection component
- [ ] Fix TypeScript errors (ScoreGauge, imports)

### Barras de Benchmark
- [ ] Barra principal com score do candidato
- [ ] Linha vertical de benchmark (50% transparência)
- [ ] Mostrar apenas 1 insight por dimensão

### Integração API
- [ ] Conectar com Supabase Edge Function (análise gratuita)
- [ ] Conectar com backend Python (análise paga)
- [ ] Modal de pagamento MB WAY

## Backend (Relatório PDF Completo - 16 páginas)

### Estrutura do PDF
- [ ] Página 1: Capa profissional
- [ ] Página 2: Diagnóstico Crítico (ATS + 4 Quadrantes)
- [ ] Página 3: Análise por Dimensão (barras com benchmarks)
- [ ] Página 4: Explicação de Benchmarks (Top 25%, Média, Bottom 25%)
- [ ] Página 5: Análise ATS Detalhada
- [ ] Página 6: Compatibilidade com Vagas
- [ ] Páginas 7-10: Análise Detalhada por Quadrante (1 página por quadrante)
- [ ] Páginas 11-12: Comparação com Top 25%
- [ ] Páginas 13-14: Sugestões de Reescrita por Secção
- [ ] Página 15: Simulação de Leitura por Recrutador
- [ ] Página 16: Plano de Ação

### Formatação de Comentários
- [ ] Todos os comentários com bullet points (→)
- [ ] Quebras de linha entre temas diferentes
- [ ] Enquadramento da nota (2-3 bullets concisos)

### Barras de Benchmark no PDF
- [ ] Barra visual com score do candidato
- [ ] Linha de benchmark
- [ ] Linha de Top 25%
- [ ] Texto explicativo:
  - [ ] Percentil do candidato
  - [ ] Diferença vs benchmark
  - [ ] Como atingir Top 25%

## Testes
- [ ] Testar upload de CV
- [ ] Testar análise gratuita
- [ ] Testar modal de pagamento
- [ ] Testar geração de PDF completo
- [ ] Testar envio de email via Brevo

## Deploy
- [ ] Criar checkpoint no Manus
- [ ] Testar no preview
- [ ] Publicar
