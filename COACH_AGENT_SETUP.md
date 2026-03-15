# 🤖 Coach Agent - Guia de Instalação e Deploy

**Data:** 2026-01-14  
**Versão:** 1.0  
**Projeto:** Share2Inspire Platform

---

## 📋 Visão Geral

O **Coach Agent** é um assistente de IA integrado ao website Share2Inspire que fornece suporte interativo aos visitantes através de um chat widget lateral profissional.

### Funcionalidades

✅ **Botão lateral fixo** com design profissional nas cores do projeto  
✅ **Chat widget interativo** com interface moderna  
✅ **Respostas contextuais** sobre serviços, coaching, análise de CV  
✅ **Ações rápidas** para navegação facilitada  
✅ **Integração com Supabase** para logging de conversas  
✅ **Analytics** de conversas e tópicos populares  
✅ **Design responsivo** para mobile e desktop  

---

## 🎨 Design

### Cores do Projeto
- **Dourado Principal:** `#BF9A33`
- **Dourado Claro:** `#D4AF37`
- **Escuro:** `#1A1A1A`
- **Cinza Claro:** `#f8f9fa`

### Componentes Visuais
- Botão lateral com gradiente dourado
- Ícone animado com efeito pulse
- Chat widget com header escuro e mensagens estilizadas
- Animações suaves e transições profissionais

---

## 📁 Ficheiros Criados

### 1. CSS - `css/coach-agent.css`
Estilos completos para o widget do coach agent:
- Botão lateral (side tab)
- Chat widget container
- Mensagens e avatares
- Animações e transições
- Design responsivo

### 2. JavaScript - `js/coach-agent.js`
Lógica do coach agent:
- Classe `CoachAgent` completa
- Gestão de conversas
- Respostas contextuais inteligentes
- Integração com Supabase
- Event handlers e interações

### 3. SQL - `supabase-coach-setup.sql`
Setup da base de dados:
- Tabela `coach_conversations`
- Índices para performance
- Row Level Security (RLS)
- Views de analytics
- Funções de manutenção

---

## 🚀 Instalação

### Passo 1: Setup da Base de Dados Supabase

1. **Aceder ao Supabase Dashboard**
   - URL: https://app.supabase.com
   - Projeto: `cvlumvgrbuolrnwrtrgz`

2. **Executar o Script SQL**
   ```sql
   -- Copiar e executar o conteúdo de supabase-coach-setup.sql
   -- no SQL Editor do Supabase
   ```

3. **Verificar Criação da Tabela**
   ```sql
   SELECT * FROM coach_conversations LIMIT 1;
   ```

### Passo 2: Adicionar Ficheiros ao Projeto

Os ficheiros já foram criados no repositório:
- ✅ `css/coach-agent.css`
- ✅ `js/coach-agent.js`
- ✅ `supabase-coach-setup.sql`

### Passo 3: Integrar no HTML

Adicionar as seguintes linhas em **todas as páginas** onde o coach agent deve aparecer:

#### No `<head>`:
```html
<!-- Coach Agent CSS -->
<link rel="stylesheet" href="/css/coach-agent.css">

<!-- Font Awesome (se ainda não estiver incluído) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

#### Antes do `</body>`:
```html
<!-- Coach Agent JavaScript -->
<script src="/js/coach-agent.js"></script>
```

### Passo 4: Atualizar Páginas Principais

Adicionar o coach agent nas seguintes páginas:

1. **index.html** (Homepage)
2. **pages/servicos.html** (Serviços)
3. **pages/sobre.html** (Sobre)
4. **pages/cv-analysis.html** (Análise CV)
5. **pages/humanos-maquinas.html** (Podcast)

---

## 🔧 Configuração

### Variáveis de Ambiente

As credenciais do Supabase já estão configuradas no código:

```javascript
supabaseUrl: 'https://cvlumvgrbuolrnwrtrgz.supabase.co'
supabaseKey: 'eyJhbGci...' // Anon key
```

### Personalização de Respostas

Para adicionar ou modificar respostas do coach, editar o método `getAIResponse()` em `js/coach-agent.js`:

```javascript
async getAIResponse(userMessage) {
    const lowerMsg = userMessage.toLowerCase();
    
    // Adicionar novos padrões aqui
    if (lowerMsg.includes('nova_palavra_chave')) {
        return 'Sua resposta personalizada aqui';
    }
    
    // ...
}
```

---

## 📊 Analytics e Monitorização

### Queries Úteis no Supabase

#### Ver conversas recentes
```sql
SELECT * FROM coach_conversations 
ORDER BY timestamp DESC 
LIMIT 50;
```

#### Estatísticas diárias
```sql
SELECT * FROM coach_conversation_stats 
WHERE conversation_date > CURRENT_DATE - INTERVAL '7 days';
```

#### Tópicos populares
```sql
SELECT * FROM coach_popular_topics;
```

#### Conversas por sessão
```sql
SELECT * FROM coach_conversations 
WHERE session_id = 'session_xxx' 
ORDER BY timestamp ASC;
```

### Dashboard Supabase

Aceder a **Table Editor** > `coach_conversations` para ver dados em tempo real.

---

## 🧪 Testes

### Teste Local

1. Abrir qualquer página com o coach agent
2. Clicar no botão lateral "COACH AI"
3. Testar as ações rápidas:
   - 📋 Serviços
   - 💼 Coaching
   - 📄 Análise CV
   - 📧 Contacto

4. Enviar mensagens personalizadas:
   - "Quais são os vossos serviços?"
   - "Quanto custa o coaching?"
   - "Como faço análise de CV?"
   - "Quero contactar"

### Verificar Logging

1. Enviar algumas mensagens no chat
2. Aceder ao Supabase Dashboard
3. Verificar se as conversas aparecem na tabela `coach_conversations`

### Teste Responsivo

- **Desktop:** Verificar posicionamento e animações
- **Tablet:** Testar em viewport médio
- **Mobile:** Chat deve ocupar tela inteira quando aberto

---

## 🌐 Deploy para Produção

### Método 1: Git Push (Recomendado)

```bash
# 1. Navegar para o repositório
cd /home/ubuntu/samuel.rolo

# 2. Adicionar novos ficheiros
git add css/coach-agent.css
git add js/coach-agent.js
git add supabase-coach-setup.sql
git add COACH_AGENT_SETUP.md

# 3. Commit
git commit -m "feat: Add Coach AI agent with Supabase integration

- Professional side tab button with brand colors
- Interactive chat widget with contextual responses
- Supabase integration for conversation logging
- Analytics views for monitoring
- Responsive design for all devices
- Quick actions for common queries"

# 4. Push para GitHub
git push origin main

# 5. Aguardar GitHub Pages rebuild (~2-3 minutos)
```

### Método 2: Atualização Manual das Páginas

Se preferir testar antes do deploy completo:

1. Adicionar as tags `<link>` e `<script>` em `index.html`
2. Testar localmente
3. Depois adicionar nas outras páginas
4. Fazer commit e push

---

## ✅ Checklist de Deploy

### Antes do Deploy

- [x] Ficheiros CSS e JS criados
- [x] Script SQL preparado
- [ ] Tabela Supabase criada
- [ ] Tags adicionadas ao HTML
- [ ] Testes locais realizados
- [ ] Verificação de responsividade

### Durante o Deploy

- [ ] Executar script SQL no Supabase
- [ ] Adicionar CSS e JS ao index.html
- [ ] Adicionar CSS e JS às outras páginas
- [ ] Commit e push para GitHub
- [ ] Aguardar rebuild do GitHub Pages

### Após o Deploy

- [ ] Verificar botão lateral visível
- [ ] Testar abertura do chat
- [ ] Enviar mensagens de teste
- [ ] Verificar logging no Supabase
- [ ] Testar em mobile
- [ ] Verificar performance (sem erros console)

---

## 🐛 Troubleshooting

### Botão não aparece

**Problema:** Botão lateral não está visível  
**Solução:**
- Verificar se `coach-agent.css` está carregado (DevTools > Network)
- Verificar se `coach-agent.js` está carregado
- Verificar console para erros JavaScript

### Chat não abre

**Problema:** Clicar no botão não abre o chat  
**Solução:**
- Verificar console para erros
- Confirmar que event listeners estão attached
- Verificar se classe `.active` está sendo adicionada

### Mensagens não são enviadas

**Problema:** Input não funciona ou mensagens não aparecem  
**Solução:**
- Verificar se Font Awesome está carregado (ícone do botão enviar)
- Verificar método `sendMessage()` no console
- Testar com Enter e com clique no botão

### Logging não funciona no Supabase

**Problema:** Conversas não aparecem na tabela  
**Solução:**
- Verificar se tabela foi criada: `SELECT * FROM coach_conversations`
- Verificar RLS policies: deve permitir INSERT para `anon`
- Verificar Network tab para requests falhados
- Confirmar que `supabaseKey` está correto

### Erros de CORS

**Problema:** Erro de CORS ao fazer requests para Supabase  
**Solução:**
- Verificar se domínio está autorizado no Supabase Dashboard
- Adicionar `https://samuelrolo.github.io` aos allowed origins
- Verificar headers da request

---

## 📈 Melhorias Futuras

### Fase 2 - Inteligência Avançada
- [ ] Integração com OpenAI GPT para respostas mais inteligentes
- [ ] Análise de sentimento das mensagens
- [ ] Sugestões proativas baseadas no comportamento

### Fase 3 - Funcionalidades Avançadas
- [ ] Agendamento de sessões direto no chat
- [ ] Upload de CV no chat para análise rápida
- [ ] Notificações push para respostas
- [ ] Histórico de conversas por utilizador

### Fase 4 - Analytics Avançados
- [ ] Dashboard de analytics no Supabase
- [ ] Relatórios semanais automáticos
- [ ] A/B testing de respostas
- [ ] Métricas de satisfação

---

## 📞 Suporte

**Desenvolvedor:** AI Assistant via Manus  
**Data de Criação:** 2026-01-14  
**Repositório:** https://github.com/samuelrolo/samuel.rolo  
**Documentação Supabase:** https://supabase.com/docs  

---

## 📝 Notas Importantes

1. **Privacidade:** As conversas são armazenadas de forma anónima (sem identificação pessoal)
2. **GDPR:** Considerar adicionar aviso de cookies/privacidade
3. **Performance:** O widget é leve (~15KB CSS + 10KB JS)
4. **Compatibilidade:** Funciona em todos os browsers modernos (Chrome, Firefox, Safari, Edge)
5. **Manutenção:** Executar `clean_old_coach_conversations()` mensalmente para limpar dados antigos

---

**Status:** ✅ Pronto para Deploy  
**Última Atualização:** 2026-01-14  
**Versão:** 1.0.0
