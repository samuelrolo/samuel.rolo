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
