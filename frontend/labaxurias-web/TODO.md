# TODO - Substituição de tons cinza por marrons + efeitos de movimento

## Etapas

- [x] 1. Analisar todos os CSS e criar plano
- [x] 2. **styles.css** - Adicionar novas variáveis marrons e keyframes de movimento
- [x] 3. **cadastro.component.css** - Substituir cinza/vermelho por marrons + motion effects
- [x] 4. **report.component.css** - Substituir cinza/vermelho por marrons + motion effects
- [x] 5. **atendimentos.component.css** - Substituir cinza/vermelho por marrons + motion effects
- [x] 6. **gira.component.css** - Substituir cinza/vermelho por marrons + motion effects
- [x] 7. **admin-users.component.css** - Substituir cinza/vermelho/purpura por marrons + motion
- [x] 8. **attendance-card.css** - Substituir azul/cinza por marrons
- [x] 9. **page-header.component.css** - Já usa variáveis CSS (sem alterações necessárias)

## Resumo das alterações

### Novas variáveis CSS adicionadas (styles.css):
- `--ember-glow`, `--gold-glow` - Glow effects
- `--brown-900` a `--brown-50` - Escala de marrons
- `--accent`, `--accent-hover`, `--accent-dark`, `--accent-light` - Acentos laranja-queimado
- 7 novas keyframes de animação (shimmer, float, glow, sweep, border-dance, breathe)
- 3 utility classes motion (.motion-float, .motion-glow, .motion-breathe)

### Cores substituídas (todos os arquivos):
- `#ff3333` → `var(--accent)` (`#e2481f` - laranja-queimado)
- `#cc0000` → `var(--accent-dark)` / `#6b1f12`
- `#990000` → `#6b1f12`
- `#ff5555` → `var(--accent)`
- `#ff8888` → `var(--gold)`
- `#4ade80` → `var(--gold-bright)`
- `#2ecc71` → `var(--gold)`
- `#111`, `#0a0a0a`, `#0f0f0f` → `var(--bg-elevated)` / `var(--bg-surface)` / `var(--bg-base)`
- `#222`, `#333`, `#444` borders → `var(--border)` / `var(--brown-500)`
- `#888`, `#aaa`, `#666`, `#555`, `#ccc` textos → `var(--text-secondary)` / `var(--text-muted)`

### Efeitos de movimento adicionados:
- `transform: translateY(-1px)` + `box-shadow glow` em hover de botões
- `glow-pulse` animation em FABs
- `transform: translateX(4px)` em hover de cards/listas
- Hover com glow e translate em entity-cards

