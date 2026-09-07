# Política de Privacidade de Localização e Rotas — ECOnexão

**Versão:** `2026-09-04`  
**Aprovação interna e jurídica:** owner e responsável jurídico da empresa, em 04/09/2026  
**Status:** aprovada para orientar desenvolvimento, testes e homologação controlada  
**Dados cadastrais:** serão preenchidos antes da publicação definitiva

## 1. Identificação do controlador

- **Controlador:** [PREENCHER ANTES DA PUBLICAÇÃO]
- **CPF/CNPJ:** [PREENCHER ANTES DA PUBLICAÇÃO]
- **Endereço:** [PREENCHER ANTES DA PUBLICAÇÃO]
- **Canal de privacidade e encarregado:** `privacidade@econexao.app`

Os campos cadastrais pendentes não bloqueiam desenvolvimento, testes ou homologação
controlada. Eles devem ser preenchidos antes da publicação definitiva em produção ou
nas lojas de aplicativos.

## 2. Uso da localização

O ECOnexão pode utilizar a localização fornecida pelo dispositivo ou um ponto
escolhido manualmente no mapa para calcular um trajeto entre essa origem e o destino
oficial de uma rota turística.

O uso da localização dinâmica é opcional. Quem não fornecer consentimento pode
continuar utilizando as rotas e as origens fixas oficiais oferecidas pelo ECOnexão.

## 3. Dados tratados e finalidade

Quando o usuário solicita um trajeto dinâmico, são tratados temporariamente:

- latitude e longitude da origem;
- destino oficial da rota escolhida;
- modalidade de deslocamento selecionada;
- identificadores técnicos estritamente necessários à segurança e ao funcionamento
  da requisição.

Esses dados são usados exclusivamente para calcular e apresentar o trajeto, sua
distância e sua duração estimada, além de proteger o serviço contra abuso. O ECOnexão
não utiliza a localização para publicidade comportamental, perfilamento, criação de
histórico de deslocamentos ou monitoramento contínuo e não acessa a localização em
segundo plano para essa funcionalidade.

## 4. Base legal e maioridade

O owner, atuando também como responsável jurídico da empresa, aprovou como base
legal o **consentimento explícito, livre, informado e inequívoco**, nos termos dos
artigos 7º, I, e 8º da Lei nº 13.709/2018 (LGPD).

A permissão de localização concedida pelo sistema operacional não substitui o
consentimento para o tratamento descrito nesta política. Antes do acesso ao GPS ou
do envio de uma coordenada escolhida no mapa, o usuário deve declarar que:

1. possui 18 anos ou mais; e
2. concorda com o tratamento temporário da localização para calcular trajetos.

Menores de 18 anos não podem utilizar localização dinâmica, mas podem usar as
origens fixas e as demais funcionalidades que não dependam desse tratamento.

## 5. Compartilhamento com o Google

Para calcular o trajeto, o backend do ECOnexão envia temporariamente as coordenadas
de origem e destino à **Google Routes API**, serviço da Google Maps Platform. A chave
de acesso permanece no servidor e não é disponibilizada no aplicativo ou navegador.

O processamento pelo Google pode envolver infraestrutura fora do Brasil. Esse
compartilhamento foi aprovado juridicamente para a finalidade específica descrita
nesta política e deverá ser revisto caso o fluxo, o provedor ou os termos aplicáveis
sejam alterados.

Aplicam-se também:

- [Termos Adicionais do Google Maps/Google Earth](https://maps.google.com/help/terms_maps/)
- [Política de Privacidade do Google](https://policies.google.com/privacy)

## 6. Transporte, retenção e segurança

As coordenadas:

- trafegam por HTTPS no corpo de requisições `POST`, nunca em parâmetros da URL;
- são processadas pelo ECOnexão somente durante a requisição;
- não são gravadas em banco de dados, arquivos, filas persistentes, logs, métricas ou
  ferramentas de telemetria do ECOnexão;
- são descartadas pelo ECOnexão após a conclusão ou falha do cálculo.

O registro local do consentimento contém somente a versão da política, o instante do
aceite e as confirmações de consentimento e maioridade. Ele não contém coordenadas,
data de nascimento, CPF ou histórico de localização. Resultados fornecidos pelo
Google não devem ser armazenados ou reutilizados além do permitido pelos termos
vigentes da Google Maps Platform.

## 7. Revogação e direitos do titular

O consentimento pode ser revogado gratuitamente na tela **Termos & Privacidade**.
A revogação remove o aceite armazenado no dispositivo e impede novos cálculos
dinâmicos até uma nova manifestação. A alteração material desta política também
exige novo aceite.

Nos termos da LGPD e quando aplicável, o titular pode solicitar confirmação e acesso
ao tratamento, correção, informações sobre compartilhamento, revogação do
consentimento, oposição e eliminação dos dados tratados com consentimento. Como as
coordenadas não são persistidas pelo ECOnexão, normalmente não haverá histórico de
localização a consultar, exportar ou excluir.

Solicitações e dúvidas devem ser enviadas para `privacidade@econexao.app`.

## 8. Alterações

Esta política pode ser atualizada para refletir mudanças legais, técnicas ou nos
serviços utilizados. Uma alteração material receberá nova versão e exigirá novo
consentimento antes de outro uso da localização dinâmica.
