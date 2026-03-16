# Área de Cliente - Código Fonte (React + Vite)

## Stack
- React 19 + TypeScript
- Tailwind CSS 4
- shadcn/ui
- Supabase (auth + database)
- Vite (build tool)

## Setup
```bash
pnpm install
pnpm build
```

## Build
O build é gerado na pasta `dist/` e deve ser copiado para `/area-cliente/` no repositório principal.

## Estrutura
- `client/src/pages/` — Páginas (Dashboard, Auth, Plans, etc.)
- `client/src/components/` — Componentes reutilizáveis
- `client/src/contexts/` — Contextos React (Auth, I18n, Theme)
- `client/src/lib/` — Utilitários (Supabase, i18n)
