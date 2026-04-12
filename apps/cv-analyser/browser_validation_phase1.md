# Evidência inicial de validação no browser

## Produção Share2Inspire — páginas institucionais

Foi confirmada navegação real em produção com ecrã branco total nas seguintes rotas:

| Idioma | URL | Resultado observado |
| --- | --- | --- |
| PT | `https://www.share2inspire.pt/sobre` | Página abre com título "Share2Inspire" mas sem conteúdo visível nem elementos interativos; screenshot totalmente branca. |
| EN | `https://www.share2inspire.pt/en/about` | Página abre com título "Share2Inspire" mas sem conteúdo visível nem elementos interativos; screenshot totalmente branca. |
| ES | `https://www.share2inspire.pt/es/acerca-de` | A navegação resolve para `/es/sobre` e abre com título "Share2Inspire" mas sem conteúdo visível nem elementos interativos; screenshot totalmente branca. |

## Conclusão provisória

O problema não está limitado a uma rota isolada. Já existe evidência objetiva de falha transversal em PT, EN e ES, compatível com o relato do utilizador de que o mesmo ocorre no menu mobile e também nos links do footer.

## Próximo passo técnico

Inspecionar a aplicação React/Vite para identificar uma causa comum de renderização em branco nas páginas institucionais, com especial atenção a:

1. definições de rotas e aliases localizados;
2. componentes de header e footer;
3. rewrites de SPA em `vercel.json`;
4. erros de importação dinâmica, assets ou i18n que possam rebentar em runtime.

## Evidência adicional de runtime

Após nova validação no browser:

| Verificação | Resultado |
| --- | --- |
| Rota ES | `https://www.share2inspire.pt/es/acerca-de` redireciona para `/es/sobre` e mantém o mesmo ecrã branco total. |
| Consola do browser | Foi observado pelo menos um erro de runtime/carregamento: `Failed to load resource: the server responded with a status of 404 ()`. |

Esta evidência reforça a hipótese de que existe um problema comum de asset, importação dinâmica, ou referência de ficheiro em produção, e não apenas um erro de mapeamento de um link isolado.

## Validação local após correção do deploy

Foi iniciado um servidor estático local sobre o monorepo sincronizado com o build atual.

| URL local validada | Resultado |
| --- | --- |
| `/sobre` | A página renderiza corretamente com título `Sobre | Samuel Rolo e a missão Share2Inspire | Share2Inspire`, header, conteúdo completo, CTAs e footer visíveis. Já não existe ecrã branco. |

Conclusão intermédia: a aplicação e os chunks atuais estão funcionais; o problema estava no empacotamento/publicação dos entrypoints institucionais em produção.

| URL local validada | Resultado |
| --- | --- |
| `/en/about` | A página renderiza corretamente com título `About | Samuel Rolo and the Share2Inspire Mission | Share2Inspire` e conteúdo completo visível. |
| `/es/sobre` | A página renderiza corretamente com título `Sobre | Samuel Rolo y la misión de Share2Inspire | Share2Inspire` e conteúdo completo visível. |

Conclusão da validação local: os entrypoints institucionais PT, EN e ES passam a apontar para o build atual (`index-Cybi-4-e.js` + `index-CiNYY8mh.css`) e deixam de referenciar bundles obsoletos.
