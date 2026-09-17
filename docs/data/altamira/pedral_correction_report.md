# Correção local da Rota do Pedral

Branch `codex/fix-pedral-map`, baseada em `staging` (`fa9076f`).

Esta correção fixa o corredor em 1.000 m, calcula distância ao segmento da
geometria (e não somente aos vértices), filtra pins `both` fora do corredor no
modo rota, usa o destino confirmado no preview dinâmico e reconcilia vínculos
antigos por arquivamento antes do upsert idempotente. A importação local dos
765 registros produz 369 atores no corredor de 1 km.

Pendência explícita: as quatro geometrias versionadas ainda terminam em
`(-3.206021, -52.250432)` e não no destino confirmado
`(-3.255088, -52.2194072)`. Nenhum trecho viário novo foi inventado. A geração
ou substituição dessas geometrias depende de dados reais validados e da
autorização de provedor prevista no ADR 0013; por isso a entrega é PARTIAL até
essa evidência existir.
