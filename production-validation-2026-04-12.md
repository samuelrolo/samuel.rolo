# Validação de produção — 2026-04-12

## `/estudante`

Após o `git push` do commit `a154ea269`, a rota `https://www.share2inspire.pt/estudante` continua em branco.

Observações confirmadas no browser:

- O título continua a ser `Share2Inspire — Pack para Estudiantes`.
- O `#root` existe, mas só contém o elemento de notificações do Sonner e não renderiza conteúdo visível.
- O HTML em produção continua a carregar os artefactos antigos:
  - `https://www.share2inspire.pt/cv-analyser/assets/index-DyJm7OA7.js`
  - `https://www.share2inspire.pt/cv-analyser/assets/index-y4EI18us.css`
- Isto mostra que o domínio customizado ainda não está a servir o HTML/artefactos esperados para a app React do Student Pack.

Conclusão provisória: o push foi bem-sucedido, mas o domínio `www.share2inspire.pt` ainda está preso ao build antigo ou a uma configuração de output/publicação diferente da branch agora publicada.

## Atualização posterior

Uma verificação posterior confirmou que a situação entretanto foi corrigida em produção.

### Estado atual de `/estudante`

- `https://www.share2inspire.pt/estudante` já renderiza corretamente o **Student Pack**.
- O título observado no browser é `Student Pack | CV Analyser + LinkedIn Roaster | Share2Inspire`.
- O deployment ativo e o domínio customizado estão a servir o bundle novo com `index-BQgW69nG.js` e `index-CiNYY8mh.css`.
- O conteúdo visível inclui hero, preço promocional, CTA e secções do pack, pelo que a página deixou de ficar em branco.

### Próximo passo

Validar EN e ES, com foco especial em confirmar se em espanhol resta apenas um problema de slug canónico (`/es/pack-estudiante` vs `/es/student-pack`).

## Validação multilingue após o commit `0a18061dc`

### PT

A rota `https://www.share2inspire.pt/estudante` renderiza corretamente o **Student Pack** em produção, com hero, preço, CTA e secções completas.

### EN

A rota `https://www.share2inspire.pt/en/student-pack` renderiza corretamente em produção e está alinhada com o deployment atualizado.

### ES

Falta apenas confirmar a variante canónica `https://www.share2inspire.pt/es/pack-estudiante` após o último push, bem como comparar com `https://www.share2inspire.pt/es/student-pack`.

### ES — resultado final da validação

A rota canónica `https://www.share2inspire.pt/es/pack-estudiante` continua a devolver **404 NOT_FOUND** em produção.

Em contrapartida, a rota alternativa `https://www.share2inspire.pt/es/student-pack` renderiza corretamente o **Student Pack** em espanhol, com conteúdo completo e sem página em branco.

Conclusão: o problema remanescente já não é o bundle nem o rendering da app; é especificamente a indisponibilidade do slug canónico espanhol no deployment atualmente servido pelo domínio.

### ES — atualização final após propagação

Uma verificação HTTP posterior passou a devolver `200 OK` para `https://www.share2inspire.pt/es/pack-estudiante`, e a validação no browser confirmou que a rota canónica já renderiza corretamente o **Student Pack** em espanhol.

## Estado final

Todas as rotas críticas do Student Pack ficaram validadas em produção:

| Idioma | Rota | Estado |
| --- | --- | --- |
| PT | `https://www.share2inspire.pt/estudante` | OK |
| EN | `https://www.share2inspire.pt/en/student-pack` | OK |
| ES | `https://www.share2inspire.pt/es/pack-estudiante` | OK |

## Conclusão

A causa raiz foi uma combinação de artefactos estáticos desatualizados e atraso de propagação do deployment após o push. Depois da correção do pipeline de build/sincronização e da publicação do commit `0a18061dc`, o domínio passou a servir o bundle correto e as três variantes ficaram operacionais.
