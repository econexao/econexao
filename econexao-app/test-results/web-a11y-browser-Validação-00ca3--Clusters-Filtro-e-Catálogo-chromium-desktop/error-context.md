# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: web-a11y-browser.spec.ts >> Validação em Navegador Real & Acessibilidade WCAG 2.1 AA (ECO-2101 / ECO-2307 / ECO-2315) >> Jornada 2: Mapa, 175 Pins, 3 Origens Reais, Teclado nos Clusters, Filtro e Catálogo
- Location: e2e\web-a11y-browser.spec.ts:446:7

# Error details

```
Error: UNKNOWN: unknown error, open 'C:\Users\Bruno\Downloads\eco-nexao-v3\econexao-app\screenshots\chromium-desktop_04_map_initial.png'
```

# Page snapshot

```yaml
- generic [ref=e9]:
  - generic [ref=e17]:
    - generic [ref=e18]:
      - generic [ref=e19]:
        - button "Voltar" [ref=e20] [cursor=pointer]:
          - generic [ref=e21]: 
        - generic [ref=e22]: Mapa da Rota
      - 'button "Região atual: não selecionada" [ref=e23] [cursor=pointer]':
        - generic [ref=e24]: 
        - generic [ref=e25]: Selecionar região
    - toolbar "Modos de visualização do mapa" [ref=e26]:
      - button "Modo de visualização da rota" [pressed] [ref=e27]: Ver rota
      - button "Modo de visualização da cidade" [ref=e28]: Ver cidade
    - generic [ref=e31]:
      - button "Filtro Tudo" [ref=e32] [cursor=pointer]:
        - generic [ref=e33]: 
        - generic [ref=e34]: Tudo
      - button "Filtro Alimentação (22)" [ref=e35] [cursor=pointer]:
        - generic [ref=e36]: 
        - generic [ref=e37]: Alimentação (22)
      - button "Filtro Atrativos (22)" [ref=e38] [cursor=pointer]:
        - generic [ref=e39]: 
        - generic [ref=e40]: Atrativos (22)
      - button "Filtro Hospedagem (22)" [ref=e41] [cursor=pointer]:
        - generic [ref=e42]: 
        - generic [ref=e43]: Hospedagem (22)
      - button "Filtro Artesanato (22)" [ref=e44] [cursor=pointer]:
        - generic [ref=e45]: 
        - generic [ref=e46]: Artesanato (22)
      - button "Filtro Transporte (22)" [ref=e47] [cursor=pointer]:
        - generic [ref=e48]: 
        - generic [ref=e49]: Transporte (22)
      - button "Filtro Saúde (22)" [ref=e50] [cursor=pointer]:
        - generic [ref=e51]: 
        - generic [ref=e52]: Saúde (22)
      - button "Filtro Segurança (22)" [ref=e53] [cursor=pointer]:
        - generic [ref=e54]: 
        - generic [ref=e55]: Segurança (22)
      - button "Filtro Outros (21)" [ref=e56] [cursor=pointer]:
        - generic [ref=e57]: 
        - generic [ref=e58]: Outros (21)
    - generic [ref=e59]: "Visualização da rota: 175 pontos visíveis."
    - region "Mapa interativo da rota" [ref=e60]:
      - generic "Mapa interativo da rota, com percurso e pontos selecionáveis" [ref=e61]:
        - region "Mapa interativo da Rota" [ref=e62]:
          - generic:
            - generic:
              - img:
                - generic [ref=e63] [cursor=pointer]
            - generic:
              - button "Grupo com 55 locais de Alimentação. Toque para aproximar e visualizar cada ponto no mapa." [ref=e64] [cursor=pointer]:
                - generic [ref=e65]: "55"
              - button "Grupo com 65 locais de Outros. Toque para aproximar e visualizar cada ponto no mapa." [ref=e67] [cursor=pointer]:
                - generic [ref=e68]: "65"
              - button "Grupo com 55 locais de Alimentação. Toque para aproximar e visualizar cada ponto no mapa." [ref=e70] [cursor=pointer]:
                - generic [ref=e71]: "55"
          - generic "Atribuição dos mapas" [ref=e73]:
            - link "Leaflet" [ref=e74] [cursor=pointer]:
              - /url: https://leafletjs.com
            - text: "| ©"
            - link "OpenStreetMap" [ref=e79] [cursor=pointer]:
              - /url: https://www.openstreetmap.org/copyright
            - text: contributors
        - generic [ref=e80]:
          - button "Aumentar zoom no mapa" [ref=e81] [cursor=pointer]:
            - generic [ref=e82]: 
          - button "Diminuir zoom no mapa" [ref=e83] [cursor=pointer]:
            - generic [ref=e84]: 
          - button "Recentralizar mapa" [ref=e86] [cursor=pointer]:
            - generic [ref=e87]: 
  - tablist [ref=e89]:
    - tab "  Inicial" [selected] [ref=e91] [cursor=pointer]:
      - generic [ref=e92]:
        - generic [ref=e93]: 
        - generic [ref=e95]: 
      - generic [ref=e97]: Inicial
    - tab "  Rotas" [ref=e99] [cursor=pointer]:
      - generic [ref=e100]:
        - generic [ref=e101]: 
        - generic [ref=e103]: 
      - generic [ref=e105]: Rotas
    - tab "  Perfil" [ref=e107] [cursor=pointer]:
      - generic [ref=e108]:
        - generic [ref=e109]: 
        - generic [ref=e111]: 
      - generic [ref=e113]: Perfil
```

# Test source

```ts
  374 |       const root = document.getElementById('root');
  375 |       return root ? root.getAttribute('aria-hidden') : null;
  376 |     });
  377 |     expect(rootAriaHidden).toBe('true');
  378 | 
  379 |     // Salvar Screenshot 02: Modal Aberto
  380 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${testInfo.project.name}_02_modal_open.png`) });
  381 | 
  382 |     // 5. Testar Focus Trap Completo com Tab, Shift+Tab e Contenção Estrita
  383 |     const isInitiallyInside = await modalDialog.evaluate((d) => d.contains(document.activeElement));
  384 |     expect(isInitiallyInside).toBe(true);
  385 | 
  386 |     const focusableElements = await modalDialog.locator(
  387 |       'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  388 |     ).all();
  389 |     expect(focusableElements.length).toBeGreaterThanOrEqual(2);
  390 | 
  391 |     // Percorrer elementos com Tab e verificar contenção em CADA passo
  392 |     for (let step = 0; step < focusableElements.length; step++) {
  393 |       await page.keyboard.press('Tab');
  394 |       const isInside = await modalDialog.evaluate((d) => d.contains(document.activeElement));
  395 |       expect(isInside).toBe(true);
  396 |     }
  397 | 
  398 |     // Ciclagem do último elemento para o primeiro com Tab
  399 |     await focusableElements[focusableElements.length - 1].focus();
  400 |     await page.keyboard.press('Tab');
  401 |     const isFirstElementFocused = await focusableElements[0].evaluate((first) => document.activeElement === first);
  402 |     expect(isFirstElementFocused).toBe(true);
  403 | 
  404 |     // Ciclagem do primeiro elemento para o último com Shift+Tab
  405 |     await focusableElements[0].focus();
  406 |     await page.keyboard.press('Shift+Tab');
  407 |     const isLastElementFocused = await focusableElements[focusableElements.length - 1].evaluate((last) => document.activeElement === last);
  408 |     expect(isLastElementFocused).toBe(true);
  409 | 
  410 |     // 6. Fechar o diálogo com a tecla Escape
  411 |     await page.keyboard.press('Escape');
  412 |     await page.waitForTimeout(150);
  413 | 
  414 |     // 7. Diálogo deve ter desaparecido
  415 |     await expect(modalDialog).not.toBeVisible();
  416 | 
  417 |     // Verificar que aria-hidden foi removido do #root
  418 |     const rootAriaHiddenAfter = await page.evaluate(() => {
  419 |       const root = document.getElementById('root');
  420 |       return root ? root.getAttribute('aria-hidden') : null;
  421 |     });
  422 |     expect(rootAriaHiddenAfter).toBeNull();
  423 | 
  424 |     // 8. Foco deve estar restaurado exatamente no disparador da região
  425 |     const isTriggerFocused = await page.evaluate(() => {
  426 |       const active = document.activeElement;
  427 |       const trigger = document.querySelector('[aria-label*="Região atual"]');
  428 |       return Boolean(active === trigger || trigger?.contains(active));
  429 |     });
  430 |     expect(isTriggerFocused).toBe(true);
  431 | 
  432 |     // Salvar Screenshot 03: Foco Restaurado
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
> 474 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${testInfo.project.name}_04_map_initial.png`) });
      |     ^ Error: UNKNOWN: unknown error, open 'C:\Users\Bruno\Downloads\eco-nexao-v3\econexao-app\screenshots\chromium-desktop_04_map_initial.png'
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
  533 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${testInfo.project.name}_06_category_filtered.png`) });
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
```