# Plano de Implementação: Cores, Ícones Lucide e Pins dos Atores no Mapa e Mini-Mapa

> **Branch de Trabalho:** `feature/map-pins-and-categories` (a partir de `staging`)  
> **Alvo de Deploy:** `staging` → Vercel (https://econexao-app-staging.vercel.app/)  
> **Referência de Design:** `docs/design-specs/planejamento_cores_icones_pins.md`  

---

## 1. Visão Geral e Arquitetura

O objetivo é implementar a nova taxonomia visual, paleta cromática harmonizada (WCAG 2.1 AA), ícones universais Lucide em SVG e novos marcadores interativos (pins) no app Expo/Web:
- **Mapa da Rota (Tela Cheia `/route/[routeId]/map`):**
  - Pin em formato *Teardrop* (gota invertida com ponta apontando para a coordenada exata e ícone Lucide SVG vazado em branco).
  - Pin Selecionado em formato **Mini-Card Flutuante Retangular com Bordas Arredondadas**, ancorado na coordenada exata por um caret inferior, contendo:
    - Thumbnail da foto oficial do local (via cache de query `useActorSummary` / Google Places photo);
    - Badge com chip da categoria e ícone Lucide;
    - Nome do estabelecimento;
    - Nota média e contagem de avaliações do Google (estrelas);
    - Status de funcionamento e botão para abrir a ficha completa.
- **Mini-Mapa da Rota (Tela de Detalhes `/route/[routeId]/index`):**
  - Mesmos pins em formato *Teardrop* de alta legibilidade.
  - Ao tocar no pin: comportamento mais leve e simples com **mini-card simplificado** (apenas nome, badge de categoria e ação de expandir), sem carregar fotos pesadas na tela de detalhes.
- **Barra de Filtros e Catálogo:**
  - 12 categorias canônicas exibidas com ícones Lucide consistentes e paleta com alto contraste.

---

## 2. Componentes e Arquivos a Modificar / Criar

### 2.1 Tema e Mapeamento (`econexao-app/src/theme/categoryTheme.ts`)
- Atualizar a paleta das 12 categorias canônicas:
  - `vida_noturna`: mudar de `#9333EA` para `#C026D3` (fúcsia/magenta noturno, garantindo contraste e distinção clara de artesanato).
  - Atualizar metadados com ícones Lucide SVG correspondentes.

### 2.2 Componentes de Marcadores (`econexao-app/src/components/map/`)
- `MapPinTeardrop.tsx` (ou renderizador SVG embutido nos adaptadores Web e Native):
  - Criar o desenho SVG do teardrop (`path` com curva superior e ponta cônica inferior).
  - Inserir o ícone Lucide SVG centralizado (cor `#FFFFFF`).
  - Adicionar sombra (`box-shadow` / `shadowColor`) e borda branca de 1.5px.
- `MapSelectedCardPin.tsx` / `SelectedPinCard.tsx`:
  - Mini-card flutuante retangular (~240-260px) com cantos arredondados (`border-radius: 12px`).
  - Caret / seta branca inferior apontando para a coordenada.
  - Suporte a dois modos:
    - **Modo Completo (Tela Cheia):** Com thumbnail da foto (Google Places), rating Google, status e badge da categoria.
    - **Modo Simplificado (Mini-Mapa):** Compacto, apenas nome e badge de categoria com botão "Ver no mapa".

### 2.3 Adaptadores de Mapa (`MapAdapter.web.tsx` e `MapAdapter.native.tsx`)
- Adaptar a função `createPinIcon` no Web (Leaflet `divIcon`) para renderizar a geometria teardrop e o mini-card flutuante com a ponta perfeitamente ancorada em `iconAnchor: [width/2, height]`.
- Adaptar o `MapAdapter.native.tsx` para usar o componente teardrop nativo e o mini-card no `Marker`.
- Adicionar prop `pinCardVariant?: 'full' | 'simple'` no `MapAdapterProps` (default: `'full'`).

### 2.4 Integração nas Telas
- `econexao-app/src/components/routes/RouteMapPreview.tsx`:
  - Passar `pinCardVariant="simple"` para o `MapAdapter`.
- `econexao-app/app/route/[routeId]/map.tsx`:
  - Utiliza `pinCardVariant="full"`. Ao selecionar um pin, se necessário, busca dados adicionais do ator usando o hook de cache para exibir a foto do Google Places e avaliação.

---

## 3. Plano de Verificação e Testes

1. **Testes Unitários e de Integração:**
   - Rodar a suíte Jest do frontend:
     ```powershell
     cd econexao-app
     npm run test
     ```
   - Verificar testes específicos de mapa:
     ```powershell
     npm run test -- --testPathPattern=map
     ```
2. **Typecheck do TypeScript:**
   - Executar:
     ```powershell
     npm run typecheck
     ```
3. **Build Web (Vercel Ready):**
   - Executar teste de compilação web estática ou export para garantir que o Leaflet e o novo card não quebram SSR/Next/Vercel:
     ```powershell
     npx expo export -p web
     ```

---

## 4. Estratégia de Git, Commits e Deploy em Staging

1. Criar branch a partir de `staging`:
   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feature/map-pins-and-categories
   ```
2. Realizar os commits semânticos por etapa:
   - `docs(design): register colors, icons and pins design proposal`
   - `feat(theme): update canonical categories with Lucide icons and WCAG AA palette`
   - `feat(map): implement teardrop pin markers and selected card pin`
   - `feat(map): integrate simple card in route preview and full card in map screen`
   - `test(map): add tests for new teardrop and card pin components`
3. Merge em `staging` e Push:
   - Fazer checkout de `staging`, merge de `feature/map-pins-and-categories` e push para `origin staging`.
   - O push na branch `staging` dispara automaticamente o workflow de build e deploy no link:
     👉 https://econexao-app-staging.vercel.app/
4. Atualizar a documentação do projeto e backlog conforme necessário.
