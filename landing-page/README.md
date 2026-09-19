# ECOnexão — landing page

Landing page incorporada a partir de
[`Raixu01/econexao-landing-page`](https://github.com/Raixu01/econexao-landing-page),
commit de origem `aab12cb`.

O site é estático e não exige instalação ou build. Para visualizar localmente,
sirva esta pasta com um servidor HTTP.

## Apresentação `/Play`

Oito slides, com estilo em `play.css`. As variantes `/play`, `/Play/` e `/play/`
estão em `vercel.json`. Teclado (setas, Home/End, PageUp/PageDown), indicadores,
swipe e QR code continuam disponíveis. No celular, slides longos permitem rolagem.

As quatro capturas em `assets/screens/*-app.PNG` e `info-rota*.PNG` foram
fornecidas pelo owner; `home-app.PNG` é a Home atual. Os oito WebPs de paisagens em
`assets/images/play/` são derivados das imagens de mesmo nome em
`econexao-app/assets/images/`, listadas nas galerias de `routeCoverImage.ts`:
Pedral, Massanori, Ambé (hero e 02), Pindobal (4), Queda D'água e Raízes do Xingu
(hero e 02). Conversão com Pillow, RGB, limite 1600×1600, WebP quality=85,
method=6; originais preservados. Total dos WebPs: 2.96 MB.

Validação: `node landing-page/tests/test-landing-page.mjs`, executado na raiz.
Requer Playwright disponível no `econexao-app/node_modules`. A suíte usa API local
simulada, cobre a landing e os oito slides em 1440/1024/390/320 px, imagens,
teclado, swipe, movimento reduzido e aliases. `PLAY_SCREENSHOT_DIR` opcional
grava as capturas fora do código.

### Publicação — identidade conferida em 19/09/2026

- Projeto Vercel: `econexao-landing-production` (`prj_fORfN8BxAKSrKGsCZGYiEId4lZtt`).
- Domínio: `econexaoturismo.com`, separado do aplicativo.
- Sem vínculo Git ou production branch configurados (`link: null`). O deploy
  ativo `dpl_CixQ5tfJYuxL5CQWDnjwCrjV5UEF` veio de CLI, branch
  `codex/landing-play`, commit `c0fd7c5`, diretório `landing-page`.
- Base deste refinamento: `staging`, `4845028`. A landing nessa base é idêntica
  à `main` (`53159a8`) e ao commit publicado acima.
- Push em `staging` dispara o workflow do app; não publica automaticamente a
  landing. Publicar somente esta pasta no projeto acima exige GO separado e
  nova conferência de identidade. Não promover todo staging a main para esta
  mudança pontual. Nenhum DNS/configuração do app é necessário.
- Rollback proposto: republicar o artefato anterior da landing, mediante GO.

Estado deste refinamento: validado localmente; GO recebido do owner em 19/09/2026
para commit, integração/push em staging e publicação manual da landing.
Resultado remoto será confirmado após a execução.

Ajustes editoriais do owner: fontes ampliadas, Home e telas em destaque; slide 6
apresenta Brasil Novo sob Região Xingu (Altamira), com foco no mapeamento; slide 7
convida empreendedores a enviar dados para cadastro; slide 8 inclui contato por
mailto e QR ampliado. Capturas mobile do slide 4 empilhadas para leitura.

Segunda revisão editorial: slide 1 exibe a URL do app; slide 6 convida a sugerir
destinos no Instagram com `#econexaoturismo`; slide 7 destaca produtos e serviços,
mostra o e-mail na caixa amarela e resume as informações necessárias para cadastro.
`produto-app.webp` e `servico-app.webp` derivam dos PNGs homônimos fornecidos pelo
owner na raiz do checkout original (WebP quality=85, method=6, 1254×1254).
Os originais permanecem intactos.

Terceira revisão editorial: slide 6 recomposto com foto em destaque, texto curto e convite pela hashtag em faixa inferior; slide 1 mostra app.econexaoturismo.com como link amigável. Suíte local desktop/mobile revalidada.

Slide 6 final: foco em 'Que destino você colocaria nesse mapa?', com cascata das fotos 02, 04 e 03 da galeria Raízes do Xingu. Novos WebPs 03/04 derivados dos PNGs do app, quality=85/method=6; crédito visual da foto 03 preservado. Card branco do slide 1 removido. Validação local desktop/mobile passou.

Ajuste final do slide 6: cascata ampliada e hashtag em card dourado clicável; legenda com fundo escuro para legibilidade. Checks desktop/mobile passaram.
