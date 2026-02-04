# 🧪 Guia de Testes - Integrações Share2Inspire

## ✅ STATUS DAS INTEGRAÇÕES NO CÓDIGO

### 1. **Brevo API** (Emails) ✅ CONFIGURADO
**Localização**: `kickstart-pro-form.js`, `ifthenpay-integration.js`
- Integração presente em múltiplos ficheiros JS
- Referências ao `window.brevoIntegration`
- Backend usa SDK Brevo (`sib_api_v3_sdk`)

**Como testar**:
```bash
# No browser console após submeter formulário:
window.brevoIntegration // deve existir
```

---

### 2. **Ifthenpay API** (Pagamentos) ✅ CONFIGURADO
**Localização**: `ifthenpay-integration.js`
- `window.ifthenpayIntegration` está definido
- Suporta MB WAY
- Backend URL: `/api/payment/mbway`

**Como testar**:
```bash
# No browser console:
window.ifthenpayIntegration.checkHealth()
# Deve retornar status da conexão com backend
```

---

### 3. **Google Calendar** (Kickstart Pro) ⚠️ PRECISA VERIFICAÇÃO

**Procura no código**: Vou verificar se iframe está presente...

---

## 🔍 TESTES MANUAIS RECOMENDADOS

### Teste 1: Kickstart Pro - Pagamento (30€)
1. Abre `servicos.html` no browser
2. Clica em "Marcar Sessão" (Kickstart Pro)
3. **Verifica**:
   - ✅ Modal abre
   - ✅ Google Calendar iframe carrega
   - ✅ Preço mostra "30€" com badge "-25%"
   - ✅ Texto "Campanha de Lançamento - Primeiros 30 Dias"
4. Preenche formulário e submete
5. **Console**: Verifica logs de pagamento Ifthenpay
6. **Email**: Confirma receção de email via Brevo

---

### Teste 2: CV Review - Pagamento (20€)
1. Clica em "Solicitar Revisão" (CV Review)
2. **Verifica**:
   - ✅ Modal abre
   - ✅ Preço mostra "20€" com badge "-20%"
   - ✅ Texto "🎉 Oferta de Lançamento"
3. Submete formulário
4. **Console**: Verifica integração backend
5. **Email**: Confirma emails transacionais

---

### Teste 3: Backend APIs
```bash
# 1. Testar endpoint Brevo (se backend estiver live)
curl -X POST https://share2inspire-backend-1n.r.appspot.com/api/services/kickstart-confirm \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","phone":"912345678"}'

# 2. Testar endpoint Ifthenpay
curl https://share2inspire-backend-1n.r.appspot.com/api/payment/health

# Esperado: {"status": "ok"}
```

---

## ⚠️ CHECKLIST PRÉ-DEPLOY

- [ ] **Brevo API Key** configurada no backend (.env ou Secret Manager)
- [ ] **Ifthenpay Credentials** configuradas
- [ ] **Backend deployed** com novos preços (30€ / 20€)
- [ ] **Google Calendar URL** presente no iframe do Kickstart modal
- [ ] **Email templates** testados manualmente via Brevo dashboard
- [ ] **Pagamento teste** MB WAY com 0.01€

---

## 🚨 PONTOS DE ATENÇÃO

1. **Google Calendar**: Confirma se iframe tem `src` válido
2. **CORS**: Backend deve permitir requests do domínio frontend
3. **Webhooks Ifthenpay**: URL configurada para receber confirmações
4. **Emails Brevo**: Verificar spam folder nos primeiros testes
5. **Valores**: Backend já tem 30€/20€ mas precisa deploy

---

## 📝 COMO REPORTAR ERROS

Se algo falhar, captura:
1. **Screenshot** do erro visual
2. **Console log** completo (F12 → Console)
3. **Network tab** (F12 → Network) - requests falhados
4. **Mensagem de erro** exata

---

## ⚡ TESTES RÁPIDOS (5 min)

```javascript
// No browser console em servicos.html:

// 1. Verifica integrações carregadas
console.log('Brevo:', typeof window.brevoIntegration);
console.log('Ifthenpay:', typeof window.ifthenpayIntegration);
console.log('Coupon:', typeof window.CouponSystem);

// 2. Testa sistema de cupões
window.CouponSystem.validateAndApply('NEWS2I10', 30);
// Esperado: { valid: true, finalAmount: "27.00", ... }

// 3. Verifica preços nos modais (inspeciona elementos)
document.querySelector('#kickstartModal input[name="amount"]').value; // "30.00"
```

---

## ✅ TUDO OK SE...

- ✅ Modais abrem sem erros JavaScript
- ✅ Preços corretos visíveis (30€, 20€)
- ✅ Badges de desconto presentes (-25%, -20%)
- ✅ Google Calendar iframe carrega (se esperado)
- ✅ Console sem erros críticos
- ✅ Formulários submetem sem crash
