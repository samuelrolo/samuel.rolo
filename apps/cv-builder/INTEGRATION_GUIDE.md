# Guia de Integração - CV Builder no Share2Inspire

## 📋 Visão Geral

Este guia explica como integrar o CV Builder na página de serviços do Share2Inspire (https://share2inspire.pt/pages/servicos.html).

---

## 🎯 Opção 1: Integração Simples (Recomendada)

### Passo 1: Adicionar Card na Página de Serviços

1. Abra o ficheiro `/pages/servicos.html` no repositório `samuelrolo/samuel.rolo`
2. Localize a grid de serviços (procure por `<div class="row">` que contém os cards de serviços)
3. Adicione o código do ficheiro `INTEGRATION_CARD.html` após o card "CV Analyzer"
4. Guarde o ficheiro

### Passo 2: Atualizar URL do CV Builder

No card HTML, substitua o URL temporário:
```html
<a href="https://3000-icfbu2rtsy1e2upggg7bi-80c751b5.us2.manus.computer" target="_blank" class="mural-btn">
```

Por um dos seguintes:
- **Opção A (Manus Hosting):** URL do projeto publicado via Manus
- **Opção B (Vercel):** Fazer deploy via Vercel connector e usar URL do Vercel
- **Opção C (Subdomínio):** `https://cv.share2inspire.pt` (requer configuração DNS)

### Passo 3: Commit e Push

```bash
cd /path/to/samuel.rolo
git add pages/servicos.html
git commit -m "Adicionar CV Builder aos serviços"
git push origin main
```

---

## 🚀 Opção 2: Deploy do CV Builder

### A) Deploy via Manus (Recomendado)

1. No Management UI do projeto, clique em "Publish"
2. Copie o URL gerado (ex: `https://share2inspire-cv-builder.manus.space`)
3. Use este URL no card HTML

### B) Deploy via Vercel

1. No Management UI, vá a Settings → GitHub
2. Exporte o código para um repositório GitHub
3. Use o conector Vercel para fazer deploy
4. Copie o URL do Vercel (ex: `https://cv-builder.vercel.app`)
5. Use este URL no card HTML

### C) Subdomínio Personalizado

1. Faça deploy via Manus ou Vercel
2. No painel da dominios.pt, adicione um registo DNS:
   - Tipo: CNAME
   - Nome: cv
   - Valor: URL do deploy (sem https://)
3. Aguarde propagação DNS (até 24h)
4. Use `https://cv.share2inspire.pt` no card HTML

---

## 🎨 Personalização do Card

O card está estilizado para corresponder aos outros serviços na página. Se precisar ajustar:

### Alterar Cor do Ícone:
```html
<div class="mural-icon" style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);">
```

### Alterar Preços:
```html
<div class="mural-price">Grátis</div>
<small>Premium: 2,49€ (1 modelo) • 5€ (3 modelos) • 10€ (5 modelos)</small>
```

### Alterar Funcionalidades:
Edite a lista `<ul class="mural-features">` conforme necessário.

---

## 🔗 Integração com Backend IFTHENPay

O CV Builder já está configurado para usar o backend Share2Inspire existente para pagamentos:

- **Endpoint:** `https://share2inspire-beckend.lm.r.appspot.com/api/payment/`
- **Métodos:** MB Way e Multibanco
- **Planos:** 2,49€ / 5€ / 10€

Não é necessária configuração adicional.

---

## ✅ Checklist de Integração

- [ ] Adicionar card HTML em `servicos.html`
- [ ] Fazer deploy do CV Builder (Manus/Vercel)
- [ ] Atualizar URL no card HTML
- [ ] Testar link do card
- [ ] Testar fluxo completo (criar CV → exportar)
- [ ] Testar pagamentos (MB Way / Multibanco)
- [ ] Commit e push para GitHub
- [ ] Verificar site em produção

---

## 🆘 Suporte

Se tiver problemas:

1. **CV Builder não carrega:** Verificar se o deploy está ativo
2. **Pagamentos não funcionam:** Verificar backend Share2Inspire
3. **Estilo quebrado:** Verificar se CSS está carregado corretamente

---

## 📝 Notas Técnicas

### Tecnologias Usadas:
- **Frontend:** React 19 + Tailwind 4 + TypeScript
- **Backend:** Express + tRPC + MySQL
- **Autenticação:** Manus OAuth
- **Pagamentos:** IFTHENPay (via backend Share2Inspire)
- **Exportação:** jsPDF + html2canvas

### Compatibilidade:
- ✅ Chrome, Firefox, Safari, Edge (versões recentes)
- ✅ Desktop e Mobile
- ✅ Tablets

### Limitações:
- Navegadores muito antigos podem ter problemas
- Safari Private Browsing pode bloquear cookies (autenticação)
- Exportação PDF funciona melhor em Chrome/Firefox

---

## 🎯 Próximos Passos Sugeridos

1. **Integração LinkedIn OAuth:** Criar aplicação no LinkedIn Developer Portal
2. **Analytics:** Adicionar Google Analytics ou similar
3. **A/B Testing:** Testar diferentes CTAs e preços
4. **Feedback:** Adicionar formulário de feedback dos utilizadores
