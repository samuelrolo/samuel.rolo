# 🚀 Instruções de Deploy - Coach AI Agent

## ✅ Status Atual

**Frontend:** ✅ Deployado no GitHub  
**Backend:** ⏳ Aguarda configuração do Supabase  

---

## 📋 Próximos Passos

### 1. Configurar Base de Dados Supabase (5 minutos)

#### Aceder ao Supabase Dashboard
1. Ir para: https://app.supabase.com
2. Login com as credenciais
3. Selecionar projeto: `cvlumvgrbuolrnwrtrgz`

#### Executar Script SQL
1. No menu lateral, clicar em **SQL Editor**
2. Clicar em **New Query**
3. Copiar todo o conteúdo do ficheiro `supabase-coach-setup.sql`
4. Colar no editor
5. Clicar em **Run** (ou pressionar Ctrl+Enter)

#### Verificar Criação
```sql
-- Executar esta query para verificar
SELECT * FROM coach_conversations LIMIT 1;
```

Se retornar "Success. No rows returned", está correto! ✅

---

### 2. Aguardar GitHub Pages Rebuild (2-3 minutos)

O GitHub Pages está a fazer rebuild automático após o push.

**URL do Site:** https://samuelrolo.github.io/samuel.rolo/

Aguardar ~2-3 minutos e depois aceder ao site.

---

### 3. Testar o Coach Agent

#### No Desktop:
1. Aceder a: https://samuelrolo.github.io/samuel.rolo/
2. Verificar se o botão lateral **"COACH AI"** aparece no lado direito
3. Clicar no botão para abrir o chat
4. Testar as ações rápidas:
   - 📋 Serviços
   - 💼 Coaching
   - 📄 Análise CV
   - 📧 Contacto
5. Enviar mensagens personalizadas

#### No Mobile:
1. Abrir o site no telemóvel
2. O botão deve aparecer menor mas visível
3. Ao abrir, o chat ocupa a tela inteira
4. Testar funcionalidades

---

### 4. Verificar Logging no Supabase

Após enviar algumas mensagens no chat:

1. Ir para Supabase Dashboard
2. Clicar em **Table Editor** no menu lateral
3. Selecionar tabela `coach_conversations`
4. Verificar se as conversas aparecem

**Colunas esperadas:**
- `id`: ID único
- `session_id`: Identificador da sessão
- `user_message`: Mensagem do utilizador
- `bot_response`: Resposta do bot
- `timestamp`: Data/hora
- `page_url`: URL da página
- `user_agent`: Navegador usado

---

## 🎨 Aparência do Coach Agent

### Botão Lateral
- **Posição:** Lado direito da tela, centro vertical
- **Cor:** Gradiente dourado (#BF9A33 → #D4AF37)
- **Texto:** "COACH AI" vertical
- **Ícone:** 🤖 com animação pulse verde
- **Hover:** Desliza 5px para a esquerda

### Chat Widget
- **Header:** Fundo escuro (#1A1A1A) com texto dourado
- **Avatar:** "S2I" em círculo dourado
- **Mensagens Bot:** Fundo branco, texto escuro
- **Mensagens User:** Fundo dourado, texto escuro
- **Input:** Borda arredondada, focus dourado
- **Botão Enviar:** Círculo dourado com ícone

---

## 📊 Analytics Disponíveis

### Queries Úteis no Supabase SQL Editor

#### Conversas Recentes
```sql
SELECT * FROM coach_conversations 
ORDER BY timestamp DESC 
LIMIT 50;
```

#### Estatísticas Diárias
```sql
SELECT * FROM coach_conversation_stats 
WHERE conversation_date > CURRENT_DATE - INTERVAL '7 days';
```

#### Tópicos Populares
```sql
SELECT * FROM coach_popular_topics;
```

#### Total de Conversas
```sql
SELECT 
    COUNT(*) as total_messages,
    COUNT(DISTINCT session_id) as unique_sessions,
    DATE(MIN(timestamp)) as first_conversation,
    DATE(MAX(timestamp)) as last_conversation
FROM coach_conversations;
```

---

## 🔧 Personalização

### Alterar Respostas do Bot

Editar ficheiro: `js/coach-agent.js`

Procurar método `getAIResponse()` e adicionar novos padrões:

```javascript
// Exemplo: Adicionar resposta sobre preços
if (lowerMsg.includes('preço') || lowerMsg.includes('valor')) {
    return 'Sua resposta personalizada sobre preços aqui...';
}
```

Depois fazer commit e push:
```bash
git add js/coach-agent.js
git commit -m "update: Personalizar respostas do coach agent"
git push origin main
```

### Alterar Cores

Editar ficheiro: `css/coach-agent.css`

Procurar variáveis de cor e alterar:
```css
background: linear-gradient(135deg, #BF9A33 0%, #D4AF37 100%);
```

---

## ✅ Checklist Final

### Configuração
- [ ] Script SQL executado no Supabase
- [ ] Tabela `coach_conversations` criada
- [ ] Policies RLS configuradas
- [ ] Views de analytics criadas

### Testes Frontend
- [ ] Botão lateral visível em todas as páginas
- [ ] Chat abre e fecha corretamente
- [ ] Ações rápidas funcionam
- [ ] Mensagens são enviadas e recebidas
- [ ] Design responsivo funciona no mobile

### Testes Backend
- [ ] Conversas são gravadas no Supabase
- [ ] Session ID é gerado corretamente
- [ ] Timestamp está correto
- [ ] Page URL é capturado

### Performance
- [ ] Sem erros no console do navegador
- [ ] CSS e JS carregam corretamente
- [ ] Animações são suaves
- [ ] Não há conflitos com outros scripts

---

## 🐛 Resolução de Problemas

### Botão não aparece
**Causa:** CSS não carregou  
**Solução:** Verificar DevTools > Network > coach-agent.css

### Chat não abre
**Causa:** JavaScript não carregou ou erro  
**Solução:** Verificar Console > Procurar erros

### Mensagens não gravam no Supabase
**Causa:** RLS policies ou tabela não criada  
**Solução:** Executar script SQL novamente

### Erro de CORS
**Causa:** Domínio não autorizado  
**Solução:** Adicionar domínio no Supabase Settings > API

---

## 📞 Suporte

**Documentação Completa:** Ver `COACH_AGENT_SETUP.md`  
**Repositório:** https://github.com/samuelrolo/samuel.rolo  
**Supabase Dashboard:** https://app.supabase.com  

---

## 🎯 URLs Importantes

- **Site Produção:** https://share2inspire.pt (ou GitHub Pages)
- **GitHub Repo:** https://github.com/samuelrolo/samuel.rolo
- **Supabase Project:** https://app.supabase.com/project/cvlumvgrbuolrnwrtrgz
- **Supabase API:** https://cvlumvgrbuolrnwrtrgz.supabase.co

---

**Deploy realizado em:** 2026-01-14  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para uso após configuração Supabase
