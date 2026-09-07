# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: web-a11y-browser.spec.ts >> Validação em Navegador Real & Acessibilidade WCAG 2.1 AA (ECO-2101 / ECO-2307 / ECO-2315) >> Jornada 2: Mapa, 175 Pins, 3 Origens Reais, Teclado nos Clusters, Filtro e Catálogo
- Location: e2e\web-a11y-browser.spec.ts:446:7

# Error details

```
Error: UNKNOWN: unknown error, open 'C:\Users\Bruno\Downloads\eco-nexao-v3\econexao-app\screenshots\chromium-mobile_06_category_filtered.png'
```

# Page snapshot

```yaml
- generic [ref=f1e9]:
  - generic [ref=f1e17]:
    - generic [ref=f1e18]:
      - generic [ref=f1e19]:
        - button "Voltar" [ref=f1e20] [cursor=pointer]:
          - generic [ref=f1e21]: 
        - generic [ref=f1e22]: Mapa da Rota
      - 'button "Região atual: não selecionada" [ref=f1e23] [cursor=pointer]':
        - generic [ref=f1e24]: 
        - generic [ref=f1e25]: Selecionar região
    - toolbar "Modos de visualização do mapa" [ref=f1e26]:
      - button "Modo de visualização da rota" [pressed] [ref=f1e27]: Ver rota
      - button "Modo de visualização da cidade" [ref=f1e28]: Ver cidade
    - generic [ref=f1e31]:
      - button "Filtro Tudo" [ref=f1e32] [cursor=pointer]:
        - generic [ref=f1e33]: 
        - generic [ref=f1e34]: Tudo
      - button "Filtro Alimentação (22)" [ref=f1e35] [cursor=pointer]:
        - generic [ref=f1e36]: 
        - generic [ref=f1e37]: Alimentação (22)
      - button "Filtro Atrativos (22)" [ref=f1e38] [cursor=pointer]:
        - generic [ref=f1e39]: 
        - generic [ref=f1e40]: Atrativos (22)
      - button "Filtro Hospedagem (22)" [active] [ref=f1e41] [cursor=pointer]:
        - generic [ref=f1e42]: 
        - generic [ref=f1e43]: Hospedagem (22)
      - button "Filtro Artesanato (22)" [ref=f1e44] [cursor=pointer]:
        - generic [ref=f1e45]: 
        - generic [ref=f1e46]: Artesanato (22)
      - button "Filtro Transporte (22)" [ref=f1e47] [cursor=pointer]:
        - generic [ref=f1e48]: 
        - generic [ref=f1e49]: Transporte (22)
      - button "Filtro Saúde (22)" [ref=f1e50] [cursor=pointer]:
        - generic [ref=f1e51]: 
        - generic [ref=f1e52]: Saúde (22)
      - button "Filtro Segurança (22)" [ref=f1e53] [cursor=pointer]:
        - generic [ref=f1e54]: 
        - generic [ref=f1e55]: Segurança (22)
      - button "Filtro Outros (21)" [ref=f1e56] [cursor=pointer]:
        - generic [ref=f1e57]: 
        - generic [ref=f1e58]: Outros (21)
    - generic [ref=f1e59]: "Visualização da rota: 22 pontos visíveis."
    - region "Mapa interativo da rota" [ref=f1e60]:
      - generic "Mapa interativo da rota, com percurso e pontos selecionáveis" [ref=f1e61]:
        - region "Mapa interativo da Rota" [ref=f1e62]:
          - generic:
            - generic:
              - img:
                - generic [ref=f1e63] [cursor=pointer]
            - generic:
              - button "Grupo com 7 locais de Hospedagem. Toque para aproximar e visualizar cada ponto no mapa." [ref=f1e64] [cursor=pointer]:
                - generic [ref=f1e65]: "7"
              - button "Grupo com 15 locais de Hospedagem. Toque para aproximar e visualizar cada ponto no mapa." [ref=f1e67] [cursor=pointer]:
                - generic [ref=f1e68]: "15"
          - generic "Atribuição dos mapas" [ref=f1e70]:
            - link "Leaflet" [ref=f1e71] [cursor=pointer]:
              - /url: https://leafletjs.com
            - text: "| ©"
            - link "OpenStreetMap" [ref=f1e76] [cursor=pointer]:
              - /url: https://www.openstreetmap.org/copyright
            - text: contributors
        - generic [ref=f1e77]:
          - button "Aumentar zoom no mapa" [ref=f1e78] [cursor=pointer]:
            - generic [ref=f1e79]: 
          - button "Diminuir zoom no mapa" [ref=f1e80] [cursor=pointer]:
            - generic [ref=f1e81]: 
          - button "Recentralizar mapa" [ref=f1e83] [cursor=pointer]:
            - generic [ref=f1e84]: 
  - tablist [ref=f1e86]:
    - tab "  Inicial" [selected] [ref=f1e88] [cursor=pointer]:
      - generic [ref=f1e89]:
        - generic [ref=f1e90]: 
        - generic [ref=f1e92]: 
      - generic [ref=f1e94]: Inicial
    - tab "  Rotas" [ref=f1e96] [cursor=pointer]:
      - generic [ref=f1e97]:
        - generic [ref=f1e98]: 
        - generic [ref=f1e100]: 
      - generic [ref=f1e102]: Rotas
    - tab "  Perfil" [ref=f1e104] [cursor=pointer]:
      - generic [ref=f1e105]:
        - generic [ref=f1e106]: 
        - generic [ref=f1e108]: 
      - generic [ref=f1e110]: Perfil
```

# Test source

```ts
  433 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${testInfo.project.name}_03_after_modal.png`) });
  434 | 
  435 |     // 9. Auditoria Axe-core no estado da Home
  436 |     const axeResults = await new AxeBuilder({ page })
  437 |       .withTags(['wcag2a', 'wcag2aa'])
  438 |       .analyze();
  439 |     expect(axeResults.violations).toHaveLength(0);
  440 | 
  441 |     // 10. Assert rigoroso de console
  442 |     expect(ariaHiddenWarnings).toHaveLength(0);
  443 |     expect(consoleErrors).toHaveLength(0);
  444 |   });
  445 | 
  446 |   test('Jornada 2: Mapa, 175 Pins, 3 Origens Reais, Teclado nos Clusters, Filtro e Catálogo', async ({ page }, testInfo) => {
  447 |     const consoleErrors: string[] = [];
  448 |     const ariaHiddenWarnings: string[] = [];
  449 | 
  450 |     page.on('console', (msg) => {
  451 |       const text = msg.text();
  452 |       if (msg.type() === 'error') {
  453 |         console.log('BROWSER ERROR:', text);
  454 |         consoleErrors.push(text);
  455 |       }
  456 |       if (text.includes('Blocked aria-hidden') || text.includes('aria-hidden because its descendant retained focus')) {
  457 |         ariaHiddenWarnings.push(text);
  458 |       }
  459 |     });
  460 |     page.on('pageerror', (err) => {
  461 |       console.log('PAGE ERROR:', err.message, err.stack);
  462 |       consoleErrors.push(err.message);
  463 |     });
  464 | 
  465 |     // 1. Navegar diretamente para a tela de mapa da rota
  466 |     await page.goto('/route/rota-santarem-pindobal/map');
  467 |     await page.waitForLoadState('networkidle');
  468 | 
  469 |     // Esperar pelo container do Leaflet e pelos clusters
  470 |     const mapContainer = page.locator('.leaflet-container');
  471 |     await expect(mapContainer).toBeVisible({ timeout: 10000 });
  472 | 
  473 |     // Salvar Screenshot 04: Mapa Inicial com Clusters
  474 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${testInfo.project.name}_04_map_initial.png`) });
  475 | 
  476 |     // 2. Verificar que 175 pins da fixture foram agrupados em clusters não sobrepostos
  477 |     const clusterMarkers = page.locator('.leaflet-marker-icon.econexao-cluster-icon-wrapper');
  478 |     await expect(clusterMarkers.first()).toBeVisible({ timeout: 10000 });
  479 |     const clusterCount = await clusterMarkers.count();
  480 |     expect(clusterCount).toBeGreaterThanOrEqual(2);
  481 |     expect(clusterCount).toBeLessThanOrEqual(10);
  482 | 
  483 |     // Métrica visual estrita: Verificar que NENHUM cluster tem bounding box sobreposto na tela
  484 |     await page.waitForTimeout(400); // Aguardar posicionamento inicial do Leaflet
  485 |     const clusterBoxes = await clusterMarkers.evaluateAll((elements) =>
  486 |       elements.map((el) => {
  487 |         const rect = el.getBoundingClientRect();
  488 |         return {
  489 |           left: rect.left,
  490 |           right: rect.right,
  491 |           top: rect.top,
  492 |           bottom: rect.bottom,
  493 |           width: rect.width,
  494 |           height: rect.height,
  495 |           x: rect.x,
  496 |           y: rect.y,
  497 |         };
  498 |       })
  499 |     );
  500 |     expect(clusterBoxes.length).toBeGreaterThanOrEqual(2);
  501 |     expect(clusterBoxes.length).toBeLessThanOrEqual(10);
  502 | 
  503 |     let overlapCount = 0;
  504 |     for (let i = 0; i < clusterBoxes.length; i++) {
  505 |       for (let j = i + 1; j < clusterBoxes.length; j++) {
  506 |         const b1 = clusterBoxes[i];
  507 |         const b2 = clusterBoxes[j];
  508 |         const overlaps =
  509 |           !(b1.right < b2.left || b1.left > b2.right || b1.bottom < b2.top || b1.top > b2.bottom);
  510 |         if (overlaps) overlapCount++;
  511 |       }
  512 |     }
  513 |     expect(overlapCount).toBe(0);
  514 | 
  515 |     // 3. Testar Operabilidade do Cluster por TECLADO (Focus + Enter)
  516 |     const targetCluster = clusterMarkers.first();
  517 |     await targetCluster.focus();
  518 |     await page.keyboard.press('Enter');
  519 |     await page.waitForTimeout(600); // Esperar transição de zoom do Leaflet
  520 | 
  521 |     // Salvar Screenshot 05: Cluster Expandido
  522 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${testInfo.project.name}_05_cluster_expanded.png`) });
  523 | 
  524 |     // 4. Testar Filtro de Categoria Temática
  525 |     await page.goto('/route/rota-santarem-pindobal/map');
  526 |     await page.waitForLoadState('networkidle');
  527 |     const hospedagemChip = page.locator('text=Hospedagem').first();
  528 |     await expect(hospedagemChip).toBeVisible({ timeout: 5000 });
  529 |     await hospedagemChip.click();
  530 |     await page.waitForTimeout(400);
  531 | 
  532 |     // Salvar Screenshot 06: Mapa Filtrado por Categoria
> 533 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${testInfo.project.name}_06_category_filtered.png`) });
      |     ^ Error: UNKNOWN: unknown error, open 'C:\Users\Bruno\Downloads\eco-nexao-v3\econexao-app\screenshots\chromium-mobile_06_category_filtered.png'
  534 | 
  535 |     // 5. Testar as Três Origens Reais do Contrato (Porto, Aeroporto, Rodoviária) com Asserções Estritas
  536 |     for (const origin of MOCK_ORIGINS) {
  537 |       await page.goto(`/route/rota-santarem-pindobal/map?originId=${origin.id}&actorId=actor-126`);
  538 |       await page.waitForLoadState('networkidle');
  539 |       await expect(mapContainer).toBeVisible();
  540 | 
  541 |       // Verificar que o URL preservou o originId
  542 |       const currentUrl = new URL(page.url());
  543 |       expect(currentUrl.searchParams.get('originId')).toBe(origin.id);
  544 |       expect(currentUrl.searchParams.get('actorId')).toBe('actor-126');
  545 | 
  546 |       // Verificar que a distância da origem é renderizada na folha do ator selecionado
  547 |       const distanceText = page.locator('text=Distância da origem:').first();
  548 |       await expect(distanceText).toBeVisible({ timeout: 5000 });
  549 | 
  550 |       // Verificar que o traçado de geometria OSRM no Leaflet está visível
  551 |       const polyline = page.locator('.leaflet-overlay-pane svg path').first();
  552 |       await expect(polyline).toBeVisible({ timeout: 5000 });
  553 |     }
  554 | 
  555 |     // 6. Testar Seleção de Ator, Sheet e Navegação para o Catálogo com Preservação de Contexto
  556 |     await page.goto('/route/rota-santarem-pindobal/map?originId=origin-rodoviaria&actorId=actor-126');
  557 |     await page.waitForLoadState('networkidle');
  558 |     await page.waitForTimeout(400);
  559 | 
  560 |     const actorPin = page.locator('.econexao-map-marker').first();
  561 |     await expect(actorPin).toBeVisible({ timeout: 5000 });
  562 | 
  563 |     const catalogButton = page.locator('[aria-label*="no catálogo"]').first();
  564 |     await expect(catalogButton).toBeVisible({ timeout: 5000 });
  565 | 
  566 |     // Salvar Screenshot 07: Ator Selecionado e Sheet Acessível
  567 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${testInfo.project.name}_07_actor_sheet_opened.png`) });
  568 | 
  569 |     // Click the catalog button and wait for navigation to the catalog page
  570 |     await catalogButton.click();
  571 |     // Verify URL contains '/catalog'
  572 |     await expect(page).toHaveURL(/catalog/);
  573 |     // Give the app a moment to render the new screen
  574 |     await page.waitForTimeout(5000);
  575 |     // Wait for the catalog header to appear (extended timeout)
  576 |     const catalogHeader = page.getByText('Catálogo de Atores');
  577 |     await expect(catalogHeader).toBeVisible({ timeout: 60000 });
  578 |     // Wait for the search input to appear (extended timeout)
  579 |     const searchInput = page.getByLabel('Campo de pesquisa');
  580 |     await expect(searchInput).toBeVisible({ timeout: 40000 });
  581 |     // Verify the actor card is rendered (extended timeout)
  582 |     const actorCard = page.getByText('Pousada Pindobal Encanto').first();
  583 |     await expect(actorCard).toBeVisible({ timeout: 30000 });
  584 | 
  585 |     // 7. Retornar ao Mapa e Executar Auditoria Axe-core WCAG 2.1 AA SEM NENHUMA EXCLUSÃO (Incluindo todo o Leaflet)
  586 |     await page.goto('/route/rota-santarem-pindobal/map?originId=origin-porto');
  587 |     await page.waitForLoadState('networkidle');
  588 |     await expect(mapContainer).toBeVisible();
  589 | 
  590 |     const axeMapResults = await new AxeBuilder({ page })
  591 |       .withTags(['wcag2a', 'wcag2aa'])
  592 |       .analyze();
  593 |     expect(axeMapResults.violations).toHaveLength(0);
  594 | 
  595 |     // 8. Assert rigoroso de console
  596 |     expect(ariaHiddenWarnings).toHaveLength(0);
  597 |     expect(consoleErrors).toHaveLength(0);
  598 |   });
  599 | });
  600 | 
```