# Share2Inspire — Área de Cliente: Redesign UX

## Princípio Fundamental
**2 páginas âncora. Zero duplicação. Conteúdo diferenciado por tier.**

---

## Arquitectura de Navegação

```
Header: Logo · [Início] · [Planos] · [Área de Membro] ····· [Meu Perfil] · [Sair]
```

| Rota | Página | Conteúdo | Acesso |
|------|--------|----------|--------|
| `/perfil` | Meu Perfil | Dados pessoais + CV + Subscrição | Autenticado |
| `/membros` | Área de Membro | Ferramentas + Análises + Score + Vagas + Conteúdos | Autenticado |
| `/planos` | Planos | Página de pricing | Público |
| `/` | Home | Landing page | Público |

---

## Jornadas de Utilizador por Tier

### Jornada 1: FREE (sem subscrição)
```
Login → /membros → Vê preview das ferramentas (locked) + CTA upgrade
                  → Pode ver Career Score (básico)
                  → Não tem análises, vagas, conteúdos
       → /perfil → Dados pessoais + CV upload + "Sem subscrição activa" + CTA upgrade
```

### Jornada 2: ESSENTIAL
```
Login → /membros → Tab "Ferramentas": CV Analyser ✓, LinkedIn Roaster ✓, Career Bot ✓
                  → Tab "As minhas análises": últimas análises em destaque, restantes colapsáveis
                  → Career Score visível
                  → Tab "Vagas": 🔒 locked (CTA upgrade para Growth)
                  → Tab "Conteúdos": 🔒 locked (CTA upgrade para Growth)
       → /perfil → Dados + CV + Subscrição Essential (dias restantes, renovação)
```

### Jornada 3: GROWTH
```
Login → /membros → Tab "Ferramentas": tudo do Essential + Career Path (desconto)
                  → Tab "As minhas análises": todas as análises guardadas
                  → Career Score visível
                  → Tab "Vagas": Feed de vagas ✓
                  → Tab "Conteúdos": Ebooks, templates, AI templates ✓
       → /perfil → Dados + CV + Subscrição Growth
```

### Jornada 4: PRO
```
Login → /membros → Tab "Ferramentas": tudo + Career Path (1 incluído/mês) + Career Intelligence (1 incluído/mês)
                  → Tab "As minhas análises": todas, ilimitadas
                  → Career Score visível
                  → Tab "Vagas": Feed de vagas ✓
                  → Tab "Conteúdos": Tudo ✓
       → /perfil → Dados + CV + Subscrição Pro
```

---

## Estrutura de Ecrãs

### /perfil — "Meu Perfil"
Layout simples, 2 colunas em desktop:

```
┌─────────────────────────────────────────────────┐
│  MEU PERFIL                                     │
├──────────────────────┬──────────────────────────┤
│  DADOS PESSOAIS      │  SUBSCRIÇÃO              │
│  Nome                │  Plano: Pro / Active      │
│  Email               │  ████████░░ 1742 dias     │
│  Telefone            │  Renova: 31/12/2030       │
│  LinkedIn            │                           │
│  Morada              │  CV                       │
│  [Editar]            │  samuel_cv.pdf  [Ver]     │
│                      │  [Substituir CV]          │
└──────────────────────┴──────────────────────────┘
```

**Não contém**: ferramentas, análises, career score, vagas, conteúdos.

### /membros — "Área de Membro"

**Tabs diferenciados por tier:**

| Tab | Free | Essential | Growth | Pro |
|-----|------|-----------|--------|-----|
| Ferramentas | Preview (locked) | CV Analyser, LinkedIn Roaster, Career Bot | + Career Path (desconto) | + Career Path (incl.), Career Intelligence (incl.) |
| As minhas análises | — | ✓ (última em destaque) | ✓ | ✓ |
| Vagas | 🔒 | 🔒 | ✓ | ✓ |
| Conteúdos | 🔒 | 🔒 | ✓ | ✓ |

**Layout da tab "As minhas análises":**
```
┌─────────────────────────────────────────────────┐
│  CV ANALYSER (8)                                │
│  ┌─────────────────────────────────────────────┐│
│  │ ★ ÚLTIMA: Score ATS 80/100 · 26/03/2026    ││
│  │   [Ver detalhes]  [Apagar]                  ││
│  └─────────────────────────────────────────────┘│
│  ▸ Ver 7 análises anteriores                    │
│                                                 │
│  LINKEDIN ROASTER (4)                           │
│  ┌─────────────────────────────────────────────┐│
│  │ ★ ÚLTIMA: Perfil avaliado · 26/03/2026     ││
│  │   [Ver detalhes]  [Apagar]                  ││
│  └─────────────────────────────────────────────┘│
│  ▸ Ver 3 análises anteriores                    │
│                                                 │
│  CAREER PATH (2)  ·  CAREER INTELLIGENCE (1)    │
│  (mesma lógica)                                 │
└─────────────────────────────────────────────────┘
```

---

## Design System — "Luxo com Vida"

### Problema actual
O esquema `#FAFAF9` + `#999` + `#e5e5e5` cria uma experiência "morta" — sem contraste, sem hierarquia visual, sem energia.

### Nova direcção
Manter a elegância da marca mas injectar **calor e profundidade**:

| Token | Actual (morto) | Novo (com vida) |
|-------|---------------|-----------------|
| Background | `#FAFAF9` | `#FAFAF9` (manter, é a base) |
| Card bg | `#fafaf9` | `#FFFFFF` com sombra suave |
| Borders | `#e5e5e5` flat | Sombras suaves em vez de borders |
| Text primary | `#1a1a1a` | `#1a1a1a` (manter) |
| Text secondary | `#999` | `#6b7280` (mais legível) |
| Gold (brand) | `#BFA14A` | `#BFA14A` mas usado com mais presença — gradientes, badges, hover states |
| Accent warm | — | `#F59E0B` (amber) para badges e indicadores |
| Success | — | `#10B981` para estados activos |
| Cards | Border flat | `shadow-sm hover:shadow-md` + `border-l-4 border-gold` para destaque |
| Active tab | Texto gold | Background gold/10 + border-bottom gold |

### Tipografia
- **Títulos**: font-semibold, tracking-tight (não font-light)
- **Corpo**: font-normal (não font-light em todo o lado)
- **Labels**: font-medium, uppercase tracking-wider (para categorias)
- **Tamanhos**: mínimo 12px para texto legível (não 10px)

### Interacções
- Cards com `hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`
- Tabs com indicador animado (não só cor)
- Análise em destaque com `border-l-4 border-gold bg-white shadow-sm`
- Locked items com overlay blur suave, não apenas opacity-50
