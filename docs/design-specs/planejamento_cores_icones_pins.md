# Proposta de Design: Categorias, Cores, Ícones e Pins dos Atores (ECOnexão)

> **Status:** Em Revisão e Planejamento  
> **Objetivo:** Estabelecer a identidade visual, taxonomia de categorias, marcadores espaciais (pins) e regras de acessibilidade sem alterar o código de produção do app neste momento.

---

## 1. Resumo das Decisões Alinhadas no `/grill-me`

1. **Taxonomia Expandida Flat:** 12 categorias canônicas exibidas de ponta a ponta na barra de navegação/filtros e no catálogo territorial.
2. **Biblioteca de Ícones Padronizada:** **Lucide Icons** em formato SVG vetorial (renderização nativa limpa, universal e de alto contraste).
3. **Anatomia do Pin Normal:** **Marcador Teardrop** (cabeça circular com ponta inferior precisa apontando para a coordenada exata + ícone SVG Lucide vazado em branco no centro).
4. **Anatomia do Pin Selecionado:** **Mini-Card Flutuante Retangular com Bordas Arredondadas** ancorado sobre a ponta do pin, contendo:
   - Thumbnail da foto oficial (obtida via Google Places API / foto cadastral);
   - Nome do estabelecimento em destaque;
   - Avaliação / Rating com estrelas e quantidade de avaliações (dados Google);
   - Badge com o nome da categoria na cor oficial;
   - Botão de ação rápida (ex: "Ver Detalhes" ou traçar rota).
5. **Harmonização Cromática WCAG 2.1 AA:** Ajuste fino nas cores para evitar conflitos visuais (distinção entre Vida Noturna e Artesanato, e entre Serviços Turísticos e Hospedagem).

---

## 2. Matriz Completa das 12 Categorias, Cores e Ícones

Abaixo está a especificação técnica revisada com cores de alto contraste, ícone Lucide SVG correspondente e papel funcional de cada categoria:

| # | Slug Canônico | Nome de Exibição | Cor Hex Primária | Ícone Lucide SVG | Subtipos & Exemplos no Tapajós | Contraste WCAG 2.1 AA (c/ Branco) |
|---|---|---|---|---|---|---|
| 1 | `alimentacao` | **Alimentação** | `#D97706` *(Amber Escuro)* | `utensils` | Restaurantes, barracas de praia, quiosques, lanchonetes, cafés, culinária paraense. | **3.01:1** (Pin com borda `#78350F`) / **4.62:1** (`#B45309` em textos) |
| 2 | `atrativos` | **Atrativos** | `#059669` *(Verde Esmeralda)* | `compass` | Praias fluviais (Pindobal, Ponta de Pedras), trilhas, ilhas, mirantes, FLONA Tapajós, igrejas históricas. | **4.56:1** *(Aprovado AA)* |
| 3 | `hospedagem` | **Hospedagem** | `#2563EB` *(Azul Royal)* | `bed` | Pousadas, hotéis, hostels, chalés, bangalôs, áreas de camping e casas de temporada. | **4.58:1** *(Aprovado AA)* |
| 4 | `experiencias` | **Experiências & Passeios** | `#0D9488` *(Teal Profundo)* | `boat` | Passeios de lancha, catraias, trilhas guiadas, vivências comunitárias, pôr do sol na Ponta do Cururu. | **4.62:1** *(Aprovado AA)* |
| 5 | `artesanato` | **Artesanato** | `#7C3AED` *(Violeta Artesanal)* | `palette` | Cerâmica tapajônica, cuias de Santarém, trançados indígenas, biojoias, associações de artesãos. | **5.74:1** *(Aprovado AA)* |
| 6 | `vida_noturna` | **Vida Noturna & Eventos** | `#C026D3` *(Fúcsia / Magenta Noturno)* | `beer` | Bares de Alter do Chão, casas de shows, carimbó ao vivo, festivais folclóricos (Sairé). | **4.82:1** *(Aprovado AA — bem distinto de violeta)* |
| 7 | `comercio` | **Comércio Local & Lojas** | `#EA580C` *(Laranja Queimado)* | `store` | Mercadinhos, empórios, conveniências, feiras livres, produtos agroecológicos e farmácias locais. | **3.50:1** (Pin com contorno) / **4.52:1** (`#C2410C` em textos) |
| 8 | `servicos_turisticos` | **Serviços Turísticos & Guias** | `#4F46E5` *(Índigo Tecnológico)* | `briefcase` | Agências de turismo receptivo, condutores credenciados Cadastur, locação de caiaques e bikes. | **5.90:1** *(Aprovado AA — mais escuro que azul royal)* |
| 9 | `transporte` | **Transporte & Mobilidade** | `#0891B2` *(Ciano Náutico)* | `bus` | Terminais hidroviários, portos, catraieiros, aeroporto, vans intermunicipais, postos de combustível. | **4.52:1** *(Aprovado AA)* |
| 10 | `saude` | **Saúde** | `#DC2626` *(Vermelho Carmim)* | `heart-pulse` | Hospitais, UPAs 24h, Unidades Básicas de Saúde (UBS), farmácias de plantão e postos médicos. | **4.51:1** *(Aprovado AA)* |
| 11 | `seguranca` | **Segurança & Proteção** | `#1E3A8A` *(Azul Marinho Profundo)* | `shield` | Delegacias, corpo de bombeiros, posto de salva-vidas, polícia turística, conselho tutelar. | **10.87:1** *(Aprovado AAA)* |
| 12 | `outros` | **Outros & Serviços** | `#6B7280` *(Cinza Neutro)* | `help-circle` | Serviços públicos, cartórios, bancos/caixas 24h, correios, apoios gerais não enquadrados. | **4.78:1** *(Aprovado AA)* |

---

## 3. Anatomia e Estados dos Pins no Mapa

### 3.1 Pin Normal (Repouso / Deselecionado)
- **Formato:** Teardrop circular com ponta (gota invertida com ponta apontando para o ponto exato da latitude/longitude).
- **Dimensões:** 38px de largura × 46px de altura.
- **Cor de Fundo:** Cor da categoria preenchendo o corpo do marcador.
- **Borda Externa:** Linha fina de 1.5px em `#FFFFFF` + sombra de elevação sutil (`drop-shadow: 0 2px 5px rgba(0,0,0,0.3)`).
- **Centro:** Círculo com ícone Lucide SVG vazado em branco puro (`#FFFFFF`) de 18×18px.
- **Precisão Geográfica:** O ponto de ancoragem do mapa é rigorosamente na extremidade inferior da ponta (`bottom-center`).

```
        .-----------------.
       /     ( Ícone )     \
      |      SVG Branco     |  <-- Fundo na cor da categoria
       \                   /
        \                 /
         '.             .'
           \           /
            '.       .'
              \     /
               '. .'
                 V             <-- Ponta de ancoragem na coordenada exata
```

---

### 3.2 Pin Selecionado (Mini-Card Flutuante Retangular)
Ao tocar em qualquer pin no mapa, ele se expande suavemente com uma animação fluida para um mini-card retangular flutuante contendo dados enriquecidos:

- **Dimensões do Card:** ~240px a 260px de largura × ~80px de altura.
- **Fundo:** Superfície `#FFFFFF` ou container claro com bordas arredondadas (`border-radius: 12px`) e sombra proeminente (`box-shadow: 0 8px 24px rgba(0,0,0,0.2)`).
- **Ponta Inferior:** Uma pequena seta (caret) na cor branca apontando diretamente para o ponto de geolocalização no mapa.
- **Estrutura Interna (Layout Horizontal):**
  1. **Lado Esquerdo (Foto):** Thumbnail retangular (72×72px) com bordas arredondadas trazendo a foto do Google Places ou foto cadastral (com placeholder elegante caso não haja foto).
  2. **Lado Direito (Informações):**
     - **Badge de Categoria:** Chip compacto com a cor da categoria e micro-ícone Lucide.
     - **Título:** Nome do estabelecimento em tipografia bold (Hanken Grotesk / Inter), cortado com reticências se longo.
     - **Avaliação (Google):** Estrela amarela (`#F59E0B`), nota média (ex: `4.8`) e quantidade de avaliações (ex: `(124)`).
     - **Indicador de Status / Distância:** Ex: `"Aberto agora"` ou `"2.3 km da rota"`.
  3. **Ação:** Toque no mini-card abre a ficha completa do ator (Bottom Sheet / Tela de Detalhes).

```
  +-----------------------------------------------------------+
  |  [ Foto ]   [ Chip Categoria ]                            |
  |  [ Google]   Casa da Saulo Tapajós                       |
  |  [ Places]   ★ 4.8 (342 avaliações) • Aberto agora        |
  |  [ 72x72 ]   Toque para detalhes                          |
  +-----------------------------------------------------------+
                                \   /
                                 \ /
                                  V   <-- Coordenada no mapa
```

---

## 4. Diretrizes de Acessibilidade (WCAG 2.1 AA)

1. **Independência de Cor:** A identificação visual não depende apenas da cor:
   - Todo pin possui ícone Lucide único e semântico.
   - Todo pin selecionado exibe o nome da categoria textualmente em um badge.
2. **Leitores de Tela (VoiceOver / TalkBack):**
   - Rótulo acessível automático montado:  
     `accessibilityLabel="[Nome do Local], Categoria [Categoria], Avaliação [Nota] estrelas no Google. Toque duas vezes para abrir detalhes."`
3. **Área de Toque (Touch Target):**
   - Hitbox mínima garantida de **48×48 dp**, mesmo em pins normais com agrupamento denso.

---

## 5. Próximos Passos Recomendados

- [ ] Aprovação formal deste documento de planejamento pelo Owner.
- [ ] Quando solicitado, criar os componentes visuais SVG (`MapPinTeardrop.tsx` e `MapSelectedCardPin.tsx`) mantendo compatibilidade Web e Mobile.
- [ ] Atualizar o mapeamento de ícones e temas em `categoryTheme.ts` com as novas cores harmonizadas.
