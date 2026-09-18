# Motion design ECOnexão — pacote de execução

Planejamento solicitado em 17/09/2026. Entrega desta sessão: documentação; nenhuma implementação ou publicação foi realizada.

## Como executar

1. Começar pelo [prompt ECO-2700](prompts/ECO-2700.md), em outra sessão de IA.
2. Ler o [plano de implementação](implementation_plan.md) e o [protocolo](execution_protocol.md).
3. Executar uma única task por sessão. Entregar evidências e passar por revisão independente antes da próxima.
4. Consultar e atualizar os estados exclusivamente em [project_status.md](../project_status.md). Este diretório define escopo e procedimentos, não um segundo backlog.
5. Encerrar a iniciativa somente com a ECO-2709 homologada em https://econexao-app-staging.vercel.app/ e com o SHA servido comprovado.

## Sequência

| Task | Resultado | Prompt |
|---|---|---|
| ECO-2700 | Baseline reproduzível, inventário e integração isolada | [Executar](prompts/ECO-2700.md) |
| ECO-2701 | Tokens, movimento reduzido e cancelamento centralizados | [Executar](prompts/ECO-2701.md) |
| ECO-2702 | Pins e card selecionado com motion e posição preservada | [Executar](prompts/ECO-2702.md) |
| ECO-2703 | Traçado e câmera com transições seguras | [Executar](prompts/ECO-2703.md) |
| ECO-2704 | Galerias e carrosséis acessíveis e suaves | [Executar](prompts/ECO-2704.md) |
| ECO-2705 | Entradas de elementos e navegação consistentes | [Executar](prompts/ECO-2705.md) |
| ECO-2706 | Modais, painéis e feedback de ações | [Executar](prompts/ECO-2706.md) |
| ECO-2707 | Regressão, acessibilidade e desempenho comprovados | [Executar](prompts/ECO-2707.md) |
| ECO-2708 | Candidato final atualizado, PR e release preparados | [Executar](prompts/ECO-2708.md) |
| ECO-2709 | Merge, deploy e homologação do staging canônico | [Executar](prompts/ECO-2709.md) |

## Baseline observada, não promessa de estado remoto

- Checkout: `C:\Users\Bruno\Downloads\eco-nexao-v3`, branch `staging`.
- HEAD observado: `2d62f2724bc3f180e3e98638ad353f9dd94c3e32`; árvore limpa antes da criação deste pacote.
- Correções recentes que devem permanecer: separação de pins corredor/município (#67), quatro origens/geometrias Pedral (#68), correção de migration de vínculos fora do corredor (#69).
- Expo SDK 54, React Native 0.81.5, Leaflet 1.9.4 e react-native-maps 1.20.1 declarados no package.json. Reanimated não está declarado.
- Web: pin selecionado transforma-se em card no próprio mapa. Não substituir esse fluxo por abertura automática de sheet.
- Galerias de rota e ator são rolagens horizontais; carrosséis de categorias já têm controles anterior/próximo.
- `AccessibleModal.web.tsx` não executa `animationType`; desmonta imediatamente ao fechar. A versão nativa consome essa prop.
- `.github/workflows/staging-deploy.yml` reage a qualquer push em staging, com gates e deploy Render. Não é um pipeline exclusivamente frontend.
- O vínculo Vercel local da raiz é da landing de **produção**. O vínculo em `econexao-app/.vercel/project.json` é do app staging. Não publicar a partir da raiz nem presumir identidade pelo nome.
- Configuração Vercel remota, SHA remoto servido, proteções de branch e credenciais não foram auditados nesta sessão. A ECO-2708 deve verificá-los.

## Limites

Web mobile e desktop são o alvo de publicação. Preservar compilação/contratos nativos e fornecer estados estáticos seguros; só declarar homologação Android/iOS com evidência em aparelho/emulador. Nenhum upgrade de Expo, mudança de provedor, alteração de dados, migrations ou produção pertence a esta iniciativa.

A publicação em staging é parte obrigatória do resultado solicitado. A execução futura deve respeitar os gates operacionais do repositório, aproveitando autorizações explícitas já concedidas para o mesmo artefato e ação. Não solicitar GO para leitura ou testes locais.
