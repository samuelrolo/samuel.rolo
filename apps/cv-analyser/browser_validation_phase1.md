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

## Validação em produção após o deploy corrigido

| URL de produção | Resultado observado no browser |
| --- | --- |
| `https://www.share2inspire.pt/sobre` | A página já renderiza conteúdo institucional visível em vez de ecrã branco. O markdown extraído mostra título, logótipo, texto introdutório e secções do ecossistema. |

Incidente de ferramenta durante a validação: ao abrir `https://www.share2inspire.pt/en/about`, o browser excedeu o tempo limite e a página ficou indisponível na sessão atual. Será retomada a validação numa nova navegação.

| URL de produção | Resultado observado no browser |
| --- | --- |
| `https://www.share2inspire.pt/en/about` | A página renderiza corretamente com título `About | Samuel Rolo and the Share2Inspire Mission | Share2Inspire`, header, conteúdo e footer visíveis. |
| `https://www.share2inspire.pt/contactos` | A página renderiza corretamente com título `Contactos | Fala com a Share2Inspire | Share2Inspire`, com texto, contactos e footer visíveis. |

| URL de produção | Resultado observado no browser |
| --- | --- |
| `https://www.share2inspire.pt/es/sobre` | A página renderiza corretamente com título `Sobre | Samuel Rolo y la misión de Share2Inspire | Share2Inspire`, header, conteúdo e footer visíveis. |
| `https://www.share2inspire.pt/en/contact` | A página renderiza corretamente com título `Contact | Talk to Share2Inspire | Share2Inspire`, com conteúdo institucional e footer visíveis. |

| URL de produção | Resultado observado no browser |
| --- | --- |
| `https://www.share2inspire.pt/politica-privacidade` | A página legal em português renderiza corretamente com título `Política de Privacidade | Share2Inspire` e secções legais visíveis. |
| `https://www.share2inspire.pt/es/contacto` | A página de contacto em espanhol renderiza corretamente com título `Contacto | Habla con Share2Inspire | Share2Inspire` e footer visível. |

| URL de produção | Resultado observado no browser |
| --- | --- |
| `https://www.share2inspire.pt/en/politica-privacidade` | A página legal em inglês renderiza corretamente com título `Privacy Policy | Share2Inspire` e secções legais visíveis. |
| `https://www.share2inspire.pt/es/politica-cookies` | A página legal em espanhol renderiza corretamente com título `Política de Cookies | Share2Inspire` e conteúdo legal visível. |

Síntese operacional: após a correção do `deploy.sh`, o deploy publicado para `main` concluiu com sucesso e a verificação automática pós-publicação assinalou como válidas as rotas críticas do menu e do footer em PT, EN e ES, incluindo `sobre/about/sobre`, `contactos/contact/contacto`, `politica-privacidade`, `politica-cookies`, `termos-condicoes` e `tratamento-dados`.

## Reabertura do incidente em produção — 12/04/2026

| URL | Evidência observada |
| --- | --- |
| `https://www.share2inspire.pt/` | A homepage voltou a abrir em branco no browser real, sem elementos interativos visíveis no viewport. |
| Consola do browser na homepage | Erro de runtime/asset: `Failed to load resource: the server responded with a status of 404 ()`. |

Conclusão intermédia: o problema em produção já não está limitado a páginas institucionais isoladas; existe pelo menos uma falha ativa de carregamento de recursos na própria homepage, compatível com um deploy inconsistente ou assets em falta.

## Validação local da correção do entrypoint raiz — 12/04/2026

| Ambiente | URL | Resultado |
| --- | --- | --- |
| Local exposto | `https://33365-ipmay383ufataqxtpyo5e-71a353af.us2.manus.computer/` | A homepage passou a renderizar conteúdo completo, com header, hero e links visíveis. |
| Local exposto | `https://33365-ipmay383ufataqxtpyo5e-71a353af.us2.manus.computer/en` | A homepage em inglês passou a renderizar conteúdo completo, confirmando a correção do entrypoint `/en`. |

Evidência técnica associada: após recompilação e sincronização local, `index.html`, `en/index.html` e `es/index.html` passaram a referenciar o bundle existente `index-Cybi-4-e.js`, deixando de apontar para o ficheiro inexistente `index-D3-vof8r.js`.

## Compatibilidade para browsers com HTML em cache — 12/04/2026

| Verificação | Resultado |
| --- | --- |
| `curl https://www.share2inspire.pt/` | O servidor passou a servir `index.html` com o bundle atual `/assets/index-Cybi-4-e.js`. |
| Browser real na mesma URL | A sessão ainda pedia o bundle antigo `/assets/index-D3-vof8r.js`, sem service worker ativo, revelando uma situação de HTML em cache do lado do cliente. |
| Estado inicial após publicação do alias | A homepage deixou de ficar totalmente branca e passou a mostrar `A carregar...`, sinal de que o 404 crítico foi eliminado. |
| Estado após nova verificação | A homepage PT passou a renderizar conteúdo completo com header, hero, CTAs e footer visíveis. |

Ação corretiva adicional publicada: foi criado e publicado um **alias de compatibilidade** `assets/index-D3-vof8r.js` apontando para o bundle atual, para garantir que sessões com HTML em cache deixam de falhar com 404.

## Nova evidência crítica durante a revalidação — 12/04/2026

| Origem da navegação | Link clicado | URL aberta | Resultado |
| --- | --- | --- | --- |
| Homepage ES / página Sobre ES | Footer `Privacidad` | `https://www.share2inspire.pt/es/politica-privacidad` | **404 NOT_FOUND** em produção. |

Conclusão intermédia: a correção do bundle antigo resolveu o problema de homepage em branco, mas persiste pelo menos uma falha real de navegação no footer em espanhol. O problema atual já não é apenas de asset em falta; existe também pelo menos um **href localizado incorreto ou sem entrypoint publicado** para a política de privacidade em espanhol.

## Revalidação após deploy dos entrypoints legais localizados — 12/04/2026

| Fluxo validado | URL final | Resultado observado |
| --- | --- | --- |
| Acesso direto à privacidade ES | `https://www.share2inspire.pt/es/politica-privacidad` | A rota deixou de devolver **404**. Primeiro mostrou loading e depois carregou corretamente a página **Política de Privacidad**. |
| Navegação pelo footer ES para `Información Legal` | `https://www.share2inspire.pt/es/informacion-legal` | Carregamento correto da página **Información Legal** sem ecrã branco. |
| Navegação pelo header ES para `Acerca de` | `https://www.share2inspire.pt/es/sobre` | Carregamento correto da página **Sobre Share2Inspire** sem ecrã branco. |

Conclusão intermédia: depois da publicação do commit `fe2b3277a`, a falha remanescente encontrada no footer espanhol passou a estar corrigida, e a navegação real por **footer** e **header/menu** em espanhol voltou a renderizar conteúdo normal em produção.

## Nova evidência crítica em EN após a correção das rotas ES — 12/04/2026

| URL testada | Comportamento observado | Impacto |
| --- | --- | --- |
| `https://www.share2inspire.pt/en/privacy-policy` | A navegação acabou em `https://www.share2inspire.pt/en/pages/privacy-policy`, com **ecrã totalmente em branco** no browser. | A rota legal canónica em inglês continua com comportamento incorreto em produção. |

Conclusão intermédia: embora a correção anterior tenha resolvido a rota espanhola de privacidade e a navegação via header/footer em ES, existe ainda pelo menos uma falha remanescente na camada EN. O problema aparenta envolver uma **reescrita/redirecionamento para `/en/pages/...`** que não está a renderizar conteúdo.
