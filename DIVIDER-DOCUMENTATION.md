# Componente Separador - Share2Inspire.pt

## Visão Geral

O componente separador é um elemento visual reutilizável e otimizado para o projeto Share2Inspire.pt, desenvolvido em conformidade com os padrões de design existentes (Bootstrap 5.3, Poppins Font, paleta de cores: ouro #bf9a33, escuro #212529, claro #f8f9fa).

## Características

- **Totalmente responsivo** - Adapta-se a todos os tamanhos de ecrã
- **Múltiplas variações** - 6 tipos principais + variações temáticas
- **Acessível** - Suporte para modo escuro e redução de movimento
- **Otimizado** - Código CSS minimalista e JavaScript opcional
- **Compatível** - Integra-se perfeitamente com Bootstrap 5.3
- **Animações suaves** - Transições elegantes e performance otimizada

## Estrutura de Ficheiros

```
css/
  └─ divider.css              # Estilos do componente separador
js/
  └─ divider.js               # Funcionalidades JavaScript (opcional)
```

## Tipos de Separadores

### 1. Separador Simples com Ícone (Padrão)

**Uso:** Separação visual elegante entre secções com ícone decorativo.

```html
<div class="divider-simple">
    <div class="divider-line"></div>
    <div class="divider-icon">
        <i class="fas fa-star"></i>
    </div>
    <div class="divider-line"></div>
</div>
```

**Variações de ícones:**
- `fa-star` - Estrela (padrão)
- `fa-check-circle` - Círculo com check
- `fa-chart-line` - Gráfico
- `fa-lightbulb` - Lâmpada
- `fa-rocket` - Foguete
- `fa-heart` - Coração

### 2. Separador com Texto

**Uso:** Separação com label descritivo da próxima secção.

```html
<div class="divider-with-text">
    <span class="divider-text">Análise de Mercado</span>
</div>
```

### 3. Separador com Gradiente

**Uso:** Separação minimalista com gradiente elegante.

```html
<div class="divider-gradient"></div>
```

### 4. Separador Minimalista

**Uso:** Separação simples e discreta.

```html
<div class="divider-minimal"></div>
```

### 5. Separador com Espaçamento

**Uso:** Separação com espaçamento customizável.

```html
<div class="divider-spacing" style="margin: 60px 0;"></div>
```

### 6. Separador com Animação

**Uso:** Separação com animação de entrada ao carregar.

```html
<div class="divider-simple divider-animated">
    <div class="divider-line"></div>
    <div class="divider-icon">
        <i class="fas fa-check-circle"></i>
    </div>
    <div class="divider-line"></div>
</div>
```

## Variações Temáticas

### Tema Escuro (para secções claras)

```html
<div class="divider-simple divider-dark">
    <div class="divider-line"></div>
    <div class="divider-icon">
        <i class="fas fa-chart-line"></i>
    </div>
    <div class="divider-line"></div>
</div>
```

### Tema Claro (para secções escuras)

```html
<div class="divider-simple divider-light">
    <div class="divider-line"></div>
    <div class="divider-icon">
        <i class="fas fa-lightbulb"></i>
    </div>
    <div class="divider-line"></div>
</div>
```

### Tema Secundário

```html
<div class="divider-simple divider-secondary">
    <div class="divider-line"></div>
    <div class="divider-icon">
        <i class="fas fa-info-circle"></i>
    </div>
    <div class="divider-line"></div>
</div>
```

### Tema Sucesso

```html
<div class="divider-simple divider-success">
    <div class="divider-line"></div>
    <div class="divider-icon">
        <i class="fas fa-check-circle"></i>
    </div>
    <div class="divider-line"></div>
</div>
```

### Tema Informação

```html
<div class="divider-simple divider-info">
    <div class="divider-line"></div>
    <div class="divider-icon">
        <i class="fas fa-info-circle"></i>
    </div>
    <div class="divider-line"></div>
</div>
```

## Guia de Integração

### Passo 1: Incluir os Ficheiros CSS

Adicionar no `<head>` do HTML (após o Bootstrap):

```html
<!-- Estilos do componente separador -->
<link href="css/divider.css" rel="stylesheet">
```

### Passo 2: Incluir o Script JavaScript (Opcional)

Adicionar antes do `</body>`:

```html
<!-- Funcionalidades JavaScript do separador (opcional) -->
<script src="js/divider.js"></script>
```

### Passo 3: Usar o Componente

Inserir o separador entre secções:

```html
<!-- Secção 1 -->
<section class="intro-section">
    <!-- Conteúdo -->
</section>

<!-- Separador -->
<div class="divider-simple">
    <div class="divider-line"></div>
    <div class="divider-icon">
        <i class="fas fa-star"></i>
    </div>
    <div class="divider-line"></div>
</div>

<!-- Secção 2 -->
<section class="what-moves-us-section">
    <!-- Conteúdo -->
</section>
```

## Uso Avançado com JavaScript

### Criar um Separador Dinamicamente

```javascript
// Criar um separador simples com ícone personalizado
const divider = DividerManager.createDivider('simple', {
    icon: 'fa-check-circle',
    theme: 'success',
    animated: true
});

// Inserir no DOM
document.getElementById('my-container').appendChild(divider);
```

### Inserir em um Elemento Específico

```javascript
// Inserir após um elemento
const targetElement = document.getElementById('my-section');
DividerManager.insertDivider(targetElement, 'after', 'with-text', {
    text: 'Próxima Secção'
});
```

### Criar com Estilos Customizados

```javascript
const divider = DividerManager.createDivider('simple', {
    icon: 'fa-rocket',
    theme: 'primary',
    animated: true,
    styles: {
        marginTop: '80px',
        marginBottom: '80px'
    }
});
```

## Paleta de Cores

| Nome | Código | Uso |
|------|--------|-----|
| Ouro (Primária) | #bf9a33 | Separadores padrão, ícones |
| Escuro (Secundária) | #212529 | Tema escuro, texto |
| Claro | #f8f9fa | Fundo de secções |
| Sucesso | #28a745 | Tema sucesso |
| Informação | #17a2b8 | Tema informação |
| Erro | #dc3545 | Tema erro |

## Responsividade

O componente é totalmente responsivo com breakpoints:

- **Desktop** (> 768px) - Tamanho padrão
- **Tablet** (576px - 768px) - Redução de 20%
- **Mobile** (< 576px) - Redução de 30%

## Acessibilidade

- **Modo Escuro:** Suporte automático para `prefers-color-scheme: dark`
- **Redução de Movimento:** Respeita `prefers-reduced-motion: reduce`
- **Contraste:** Cores em conformidade com WCAG AA

## Exemplos de Integração

### Exemplo 1: Análise de Mercado (Samuel Rolo)

```html
<!-- Secção de Introdução -->
<section class="intro-section">
    <h2>Análise de Mercado</h2>
    <p>Consultoria e Coaching em Capital Humano</p>
</section>

<!-- Separador com Animação -->
<div class="divider-simple divider-animated">
    <div class="divider-line"></div>
    <div class="divider-icon">
        <i class="fas fa-chart-line"></i>
    </div>
    <div class="divider-line"></div>
</div>

<!-- Secção de Forças -->
<section class="what-moves-us-section">
    <h2>Forças Estratégicas</h2>
    <!-- Conteúdo -->
</section>

<!-- Separador com Texto -->
<div class="divider-with-text">
    <span class="divider-text">Oportunidades de Mercado</span>
</div>

<!-- Secção de Oportunidades -->
<section class="opportunities-section">
    <!-- Conteúdo -->
</section>
```

### Exemplo 2: Separadores em Grid Bootstrap

```html
<div class="container">
    <div class="row">
        <div class="col-md-6">
            <!-- Conteúdo -->
        </div>
        <div class="col-md-6">
            <!-- Conteúdo -->
        </div>
    </div>
    
    <!-- Separador em largura total -->
    <div class="divider-gradient"></div>
    
    <div class="row">
        <!-- Mais conteúdo -->
    </div>
</div>
```

## Customização

### Alterar Cores

Para customizar as cores, editar as variáveis CSS em `divider.css`:

```css
/* Separador Simples com Ícone - Cores Customizadas */
.divider-custom .divider-line {
    background: linear-gradient(90deg, transparent, #your-color, transparent);
}

.divider-custom .divider-icon {
    background: rgba(your-color, 0.1);
    color: #your-color;
}

.divider-custom .divider-text {
    color: #your-color;
}
```

### Alterar Espaçamento

```css
.divider-custom {
    margin: 5rem 0;  /* Customizar margem */
    padding: 3rem 0; /* Customizar padding */
}
```

### Alterar Tamanho do Ícone

```css
.divider-custom .divider-icon {
    width: 60px;     /* Largura customizada */
    height: 60px;    /* Altura customizada */
    font-size: 1.8rem; /* Tamanho da fonte do ícone */
}
```

## Performance

- **CSS:** ~3KB (minificado)
- **JavaScript:** ~2KB (minificado)
- **Sem dependências externas** (além de Bootstrap e Font Awesome)
- **Animações otimizadas** com `transform` e `opacity`

## Compatibilidade

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Troubleshooting

### Separador não aparece

**Solução:** Verificar se `divider.css` está incluído no HTML.

### Ícone não aparece

**Solução:** Verificar se Font Awesome está incluído:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
```

### Animação não funciona

**Solução:** Verificar se `divider.js` está incluído e se o navegador suporta Intersection Observer API.

### Cores não correspondem

**Solução:** Verificar se as variáveis CSS estão sendo sobrescritas por outros estilos. Usar `!important` se necessário.

## Suporte

Para questões ou sugestões, contactar através do repositório GitHub do projeto Share2Inspire.pt.

---

**Versão:** 1.0  
**Última atualização:** Outubro 2026  
**Autor:** Manus AI  
**Projeto:** Share2Inspire.pt

