# UI Update Workflow

Este workflow cobre atualizações de componentes compartilhados e primitives copiadas de UI.
Ele existe para reduzir risco de regressão nos fluxos P0 da aplicação: intake, leads e inbox.

## Quando usar

Use este fluxo quando alterar:

- `packages/ui/src/components/`
- `packages/ui/src/patterns/`
- `packages/ui/src/lib/utils.ts`
- dependencias compartilhadas de UI em `package.json`, `apps/web/package.json`, `packages/ui/package.json` ou `bun.lock`
- composicoes do shell que reutilizam primitives compartilhadas ou a base de layout da aplicacao

## Ordem sugerida

1. Identifique o componente, pattern ou dependencia que mudou.
2. Busque todos os consumidores diretos em `apps/web/src/features/`.
3. Atualize o componente copiado ou shared primitive.
4. Verifique se a API publica continua consistente.
5. Valide os fluxos P0 afetados.

## Arquivos comumente tocados

- `packages/ui/src/components/*.tsx`
- `packages/ui/src/patterns/*.ts`
- `packages/ui/src/lib/utils.ts`
- `packages/ui/docs/DEPENDENCIES.md`
- `packages/ui/docs/UPDATE_WORKFLOW.md`
- `packages/ui/package.json`

## Como atualizar

### `packages/ui/src/components/`

- preserve contratos de props e slots quando possivel;
- mantenha a semantica acessivel dos elementos;
- revise estados `disabled`, `focus-visible`, `aria-*` e interacoes por teclado;
- prefira mudancas pequenas e compostas em vez de reescrever primitives inteiras.

### `packages/ui/src/patterns/`

- trate patterns como blocos compartilhados e previsiveis;
- avalie se a mudanca afeta copies, estados vazios ou surfaces de erro;
- valide se o texto da copia continua distinto entre superficies.

### `packages/ui/src/lib/utils.ts`

- mantenha helpers pequenos e deterministicos;
- verifique se a mudanca afeta classnames, merge de classes ou interoperabilidade com Tailwind.

## Como verificar

Antes do review, rode:

```bash
bun run lint:ci
bun run typecheck
bun test apps/web/src/features/home/forms/workspace-intake-form.test.tsx
bun test apps/web/src/features/leads/lead-detail.test.tsx
bun test apps/web/src/features/inbox/conversation-list.test.tsx
```

Se a mudanca tocar primitives compartilhadas ou layout base, valide tambem o resto da superficie afetada no browser.

## Checklist de review

- Acessibilidade revisada para teclado, foco e semantica;
- Regressao visual verificada nos fluxos intake, leads e inbox;
- Compatibilidade de API confirmada para consumers existentes;
- Impactos em componentes copiados mapeados e justificados;
- Impactos no layout base da aplicacao revisados;
- Dependencias alteradas somente com motivacao clara e revisao explicita;

## Relação com dependencias

As dependencias pinadas e a politica de manutencao ficam em [DEPENDENCIES.md](./DEPENDENCIES.md).
Consulte esse documento antes de fazer bumps ou trocar primitives copiadas.
