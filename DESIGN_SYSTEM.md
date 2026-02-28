# 🎨 MetaFin Design System v1.0
> Última atualização: 27/02/2026
> Mantido por: Felipe Martin

---

## 📋 Índice
1. [Princípios de Design](#princípios-de-design)
2. [Paleta de Cores](#paleta-de-cores)
3. [Tipografia](#tipografia)
4. [Espaçamentos](#espaçamentos)
5. [Bordas e Raios](#bordas-e-raios)
6. [Sombras](#sombras)
7. [Componentes](#componentes)
8. [Estados Interativos](#estados-interativos)
9. [Ícones](#ícones)
10. [Responsividade](#responsividade)
11. [Animações](#animações)
12. [Regras Obrigatórias](#regras-obrigatórias)

---

## 🎯 Princípios de Design

| Princípio | Descrição |
|-----------|-----------|
| **Premium** | Visual sofisticado, escuro, com profundidade e elegância |
| **Consistente** | Mesmo padrão em todas as 15+ páginas |
| **Acessível** | Contraste mínimo 4.5:1 em todos os textos |
| **Performático** | Animações leves, sem bloqueio de render |
| **Glass Morphism** | Efeito vidro translúcido nos cards com backdrop-blur |

---

## 🎨 Paleta de Cores

### Fundos (Backgrounds)

| Token | Tailwind | Hex | Uso |
|-------|----------|-----|-----|
| `--bg-primary` | `bg-[#06060a]` | `#06060a` | Fundo principal do body |
| `--bg-secondary` | `bg-gray-900/80` | `rgba(17,24,39,0.8)` | Sidebar, painéis laterais |
| `--bg-card` | `bg-gray-800/40` | `rgba(31,41,55,0.4)` | Cards padrão |
| `--bg-card-hover` | `bg-gray-800/60` | `rgba(31,41,55,0.6)` | Cards em hover |
| `--bg-card-elevated` | `bg-gray-800/70` | `rgba(31,41,55,0.7)` | Cards destacados/modais |
| `--bg-input` | `bg-gray-800/60` | `rgba(31,41,55,0.6)` | Campos de formulário |
| `--bg-overlay` | `bg-black/50` | `rgba(0,0,0,0.5)` | Overlay de modais |

### Cores de Destaque (Brand)

| Token | Tailwind | Hex | Uso |
|-------|----------|-----|-----|
| `--brand-primary` | `purple-500` | `#a855f7` | Cor principal da marca |
| `--brand-secondary` | `fuchsia-500` | `#d946ef` | Cor secundária da marca |
| `--brand-gradient` | `from-purple-600 to-fuchsia-600` | — | Gradiente principal |
| `--brand-gradient-hover` | `from-purple-500 to-fuchsia-500` | — | Gradiente hover |
| `--brand-gradient-soft` | `from-purple-500/10 to-fuchsia-500/10` | — | Gradiente sutil (fundos) |
| `--brand-glow` | `shadow-purple-500/20` | — | Brilho sutil nos destaques |

### Cores Semânticas (Status)

| Token | Tailwind | Hex | Uso |
|-------|----------|-----|-----|
| `--success` | `emerald-400` | `#34d399` | Receitas, positivo, sucesso |
| `--success-bg` | `emerald-500/10` | — | Fundo de badge sucesso |
| `--danger` | `red-400` | `#f87171` | Despesas, erros, alertas |
| `--danger-bg` | `red-500/10` | — | Fundo de badge erro |
| `--warning` | `amber-400` | `#fbbf24` | Atenção, pendente |
| `--warning-bg` | `amber-500/10` | — | Fundo de badge warning |
| `--info` | `blue-400` | `#60a5fa` | Informação, neutro |
| `--info-bg` | `blue-500/10` | — | Fundo de badge info |

### Textos

| Token | Tailwind | Hex | Uso |
|-------|----------|-----|-----|
| `--text-primary` | `text-white` | `#ffffff` | Títulos, valores, destaque |
| `--text-secondary` | `text-gray-400` | `#9ca3af` | Subtítulos, descrições |
| `--text-muted` | `text-gray-500` | `#6b7280` | Placeholders, hints |
| `--text-disabled` | `text-gray-600` | `#4b5563` | Elementos desabilitados |
| `--text-brand` | `text-purple-400` | `#c084fc` | Links, destaques da marca |

### Bordas

| Token | Tailwind | Hex | Uso |
|-------|----------|-----|-----|
| `--border-default` | `border-gray-700/40` | — | Borda padrão dos cards |
| `--border-subtle` | `border-gray-700/20` | — | Borda muito sutil |
| `--border-hover` | `border-purple-500/40` | — | Borda em hover |
| `--border-focus` | `border-purple-500` | `#a855f7` | Borda em focus (inputs) |
| `--border-divider` | `border-gray-800` | `#1f2937` | Linhas divisórias |

---

## 📝 Tipografia

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Escala Tipográfica

| Nome | Tailwind | Tamanho | Peso | Uso |
|---|---|---|---|---|
| Display | `text-4xl font-bold` | 36px | 700 | Títulos de página |
| Heading 1 | `text-2xl font-bold` | 24px | 700 | Títulos de seção |
| Heading 2 | `text-xl font-semibold` | 20px | 600 | Subtítulos |
| Heading 3 | `text-lg font-semibold` | 18px | 600 | Títulos de card |
| Body | `text-base font-normal` | 16px | 400 | Texto principal |
| Body Small | `text-sm font-normal` | 14px | 400 | Texto secundário |
| Caption | `text-xs font-medium` | 12px | 500 | Labels, badges |
| Overline | `text-xs font-semibold uppercase tracking-wider` | 12px | 600 | Categorias |

### Valores Monetários
- R$ 1.234,56 → `text-2xl font-bold text-white` (positivo)
- R$ 1.234,56 → `text-2xl font-bold text-emerald-400` (receita)
- -R$ 1.234,56 → `text-2xl font-bold text-red-400` (despesa)

---

## 📐 Espaçamentos

### Sistema de 4px

| Token | Tailwind | Pixels | Uso |
|---|---|---|---|
| `--space-1` | `p-1` / `m-1` | 4px | Micro espaço |
| `--space-2` | `p-2` / `m-2` | 8px | Espaço interno mínimo |
| `--space-3` | `p-3` / `m-3` | 12px | Padding de badges |
| `--space-4` | `p-4` / `m-4` | 16px | Padding padrão de cards |
| `--space-5` | `p-5` / `m-5` | 20px | Espaçamento médio |
| `--space-6` | `p-6` / `m-6` | 24px | Padding de cards grandes |
| `--space-8` | `p-8` / `m-8` | 32px | Seções internas |
| `--space-10` | `p-10` | 40px | Padding de páginas |
| `--space-12` | `gap-12` | 48px | Gap entre seções |

### Layout

| Elemento | Valor |
|---|---|
| Sidebar largura | `w-64` (256px) expandida / `w-20` (80px) colapsada |
| Container máximo | `max-w-7xl` (1280px) |
| Gap entre cards | `gap-4` (16px) ou `gap-6` (24px) |
| Padding da página | `p-6` mobile / `p-8` desktop |
| Grid colunas | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` |

---

## 🔲 Bordas e Raios

| Elemento | Tailwind | Valor |
|---|---|---|
| Cards | `rounded-xl` | 12px |
| Botões | `rounded-lg` | 8px |
| Inputs | `rounded-lg` | 8px |
| Badges | `rounded-full` | 9999px |
| Modais | `rounded-2xl` | 16px |
| Avatares/Ícones | `rounded-full` | 50% |
| Tooltips | `rounded-md` | 6px |

---

## 🌑 Sombras

| Nome | Tailwind | Uso |
|---|---|---|
| Nenhuma | `shadow-none` | Cards padrão (usam borda) |
| Sutil | `shadow-lg shadow-black/10` | Cards elevados |
| Brand Glow | `shadow-lg shadow-purple-500/10` | Botões primários |
| Brand Glow Forte | `shadow-xl shadow-purple-500/20` | Elementos em destaque |
| Danger Glow | `shadow-lg shadow-red-500/10` | Alertas de erro |
| Success Glow | `shadow-lg shadow-emerald-500/10` | Confirmações |

---

## 🧩 Componentes

### Card Padrão
```jsx
<div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/40 
                rounded-xl p-6 hover:bg-gray-800/60 hover:border-purple-500/30
                transition-all duration-300">
  {/* conteúdo */}
</div>
```

### Card Destaque (KPI/Resumo)
```jsx
<div className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 
                backdrop-blur-sm border border-purple-500/20 rounded-xl p-6
                shadow-lg shadow-purple-500/5">
  <p className="text-sm text-gray-400">Saldo Total</p>
  <p className="text-3xl font-bold text-white mt-1">R$ 12.450,00</p>
</div>
```

### Botão Primário
```jsx
<button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 
                   hover:from-purple-500 hover:to-fuchsia-500
                   text-white font-semibold px-6 py-3 rounded-lg
                   shadow-lg shadow-purple-500/20
                   transition-all duration-300 hover:shadow-purple-500/40
                   active:scale-[0.98]">
  + Adicionar
</button>
```

### Botão Secundário
```jsx
<button className="bg-gray-800/60 border border-gray-700/40 
                   hover:bg-gray-700/60 hover:border-purple-500/30
                   text-gray-300 hover:text-white font-medium px-5 py-2.5 
                   rounded-lg transition-all duration-300">
  Cancelar
</button>
```

### Botão Ghost/Outline
```jsx
<button className="border border-purple-500/40 text-purple-400 
                   hover:bg-purple-500/10 hover:border-purple-500/60
                   font-medium px-5 py-2.5 rounded-lg
                   transition-all duration-300">
  Ver Detalhes
</button>
```

### Botão Danger
```jsx
<button className="bg-red-500/10 border border-red-500/30 text-red-400
                   hover:bg-red-500/20 hover:border-red-500/50
                   font-medium px-5 py-2.5 rounded-lg
                   transition-all duration-300">
  Excluir
</button>
```

### Input Padrão
```jsx
<input className="w-full bg-gray-800/60 border border-gray-700/40 
                  rounded-lg px-4 py-3 text-white placeholder-gray-500
                  focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50
                  focus:outline-none transition-all duration-200"
       placeholder="Digite aqui..." />
```

### Select/Dropdown
```jsx
<select className="w-full bg-gray-800/60 border border-gray-700/40 
                   rounded-lg px-4 py-3 text-white
                   focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50
                   focus:outline-none appearance-none cursor-pointer">
  <option>Selecione...</option>
</select>
```

### Badge/Tag
```jsx
{/* Sucesso */}
<span className="inline-flex items-center px-2.5 py-1 rounded-full 
                 text-xs font-medium bg-emerald-500/10 text-emerald-400 
                 border border-emerald-500/20">
  ● Pago
</span>

{/* Pendente */}
<span className="inline-flex items-center px-2.5 py-1 rounded-full 
                 text-xs font-medium bg-amber-500/10 text-amber-400 
                 border border-amber-500/20">
  ● Pendente
</span>

{/* Erro/Vencido */}
<span className="inline-flex items-center px-2.5 py-1 rounded-full 
                 text-xs font-medium bg-red-500/10 text-red-400 
                 border border-red-500/20">
  ● Vencido
</span>
```

### Modal
```jsx
{/* Overlay */}
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 
                flex items-center justify-center p-4">
  {/* Modal */}
  <div className="bg-gray-900 border border-gray-700/50 rounded-2xl 
                  p-8 w-full max-w-lg shadow-2xl shadow-purple-500/5
                  animate-in fade-in zoom-in-95">
    <h2 className="text-xl font-bold text-white">Título do Modal</h2>
    <p className="text-gray-400 mt-2">Descrição...</p>
    {/* conteúdo */}
  </div>
</div>
```

### Tabela
```jsx
<table className="w-full">
  <thead>
    <tr className="border-b border-gray-800">
      <th className="text-left text-xs font-semibold text-gray-400 
                     uppercase tracking-wider pb-3 px-4">
        Nome
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 
                   transition-colors duration-200">
      <td className="py-4 px-4 text-sm text-white">Valor</td>
    </tr>
  </tbody>
</table>
```

### Sidebar Item
```jsx
{/* Ativo */}
<a className="flex items-center gap-3 px-4 py-3 rounded-lg
              bg-gradient-to-r from-purple-500/20 to-fuchsia-500/10
              border border-purple-500/20 text-white font-medium">
  <Icon className="w-5 h-5 text-purple-400" />
  <span>Dashboard</span>
</a>

{/* Inativo */}
<a className="flex items-center gap-3 px-4 py-3 rounded-lg
              text-gray-400 hover:text-white hover:bg-gray-800/50
              transition-all duration-200">
  <Icon className="w-5 h-5" />
  <span>Transações</span>
</a>
```

### Barra de Progresso
```jsx
<div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
  <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 
                  rounded-full transition-all duration-500"
       style={{ width: '65%' }} />
</div>
```

### Toast/Notificação
```jsx
{/* Sucesso */}
<div className="bg-gray-900 border border-emerald-500/30 rounded-xl p-4 
                shadow-lg shadow-emerald-500/10 flex items-center gap-3">
  <div className="bg-emerald-500/20 rounded-full p-2">
    <CheckIcon className="w-4 h-4 text-emerald-400" />
  </div>
  <p className="text-sm text-white">Transação salva com sucesso!</p>
</div>
```

---

## 🔄 Estados Interativos

| Estado | Efeito |
|---|---|
| Default | Cores base conforme tokens |
| Hover | Fundo +20% opacidade, borda muda para `purple-500/30` |
| Focus | `ring-1 ring-purple-500/50 border-purple-500` |
| Active/Pressed | `scale-[0.98]` + sombra reduzida |
| Disabled | `opacity-50 cursor-not-allowed pointer-events-none` |
| Loading | `animate-pulse` ou spinner com `animate-spin` |
| Selected | Gradiente brand sutil + borda purple |
| Error | `border-red-500 ring-1 ring-red-500/50` |

---

## 🎭 Ícones

| Biblioteca | `lucide-react` |
|---|---|
| Tamanho padrão | `w-5 h-5` (20px) |
| Tamanho pequeno | `w-4 h-4` (16px) |
| Tamanho grande | `w-6 h-6` (24px) |
| Cor padrão | `text-gray-400` |
| Cor ativa | `text-purple-400` |
| Stroke width | `1.5` (padrão Lucide) |

---

## 📱 Responsividade

| Breakpoint | Tailwind | Largura | Layout |
|---|---|---|---|
| Mobile | default | < 640px | 1 coluna, sidebar oculta |
| Tablet | `sm:` | 640px+ | 1-2 colunas |
| Desktop | `md:` | 768px+ | Sidebar visível, 2 colunas |
| Desktop L | `lg:` | 1024px+ | 3 colunas |
| Desktop XL | `xl:` | 1280px+ | 3-4 colunas, máximo conteúdo |
| Ultra Wide | `2xl:` | 1536px+ | Container centralizado |

---

## ✨ Animações

```css
/* Entrada de elementos */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Transições padrão */
transition-all duration-200  → Inputs, botões
transition-all duration-300  → Cards, containers
transition-all duration-500  → Barras de progresso, charts

/* Evitar */
- Animações maiores que 500ms
- transform: scale() maior que 1.05
- Animações em elementos grandes (layout shift)
```

---

## 🚫 Regras Obrigatórias (NUNCA QUEBRE)

### ❌ PROIBIDO
- `bg-white` em qualquer contexto
- `bg-gray-50`, `bg-gray-100`, `bg-gray-200` como fundo
- `text-black` ou `text-gray-900` como texto principal
- Cores sólidas sem transparência em cards (`bg-gray-800` sem `/opacity`)
- Bordas brancas ou muito claras
- Sombras genéricas sem cor (`shadow-lg` sozinho sem cor)
- Misturar temas light e dark na mesma página

### ✅ OBRIGATÓRIO
- Todo card DEVE ter `backdrop-blur-sm` ou `backdrop-blur`
- Todo card DEVE ter border com opacidade
- Gradientes brand APENAS `purple → fuchsia`
- Valores positivos = `emerald-400`, negativos = `red-400`
- Hover SEMPRE com `transition-all duration-200` ou `300`
- Inputs SEMPRE com estado `focus:` definido
- Mínimo contraste 4.5:1 para acessibilidade
