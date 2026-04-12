# Evidência de reprodução no browser

## Contexto
Teste real no browser em produção a partir de `https://www.share2inspire.pt/`.

## Resultado observado
Ao clicar na entrada **Serviços** do header, a navegação foi para:

- `https://www.share2inspire.pt/servicos`

A página carregada apresentou:

- título: `Share2Inspire`
- markdown extraído: `# Share2Inspire` seguido de `(No article found, please use visual navigation.)`
- screenshot: página totalmente branca, sem elementos detetados no viewport

## Conclusão provisória
O problema reportado pelo utilizador é real e reproduzível no browser: a rota **/servicos** em produção está a devolver um ecrã branco.
