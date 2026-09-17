# Correção das Geometrias da Rota do Pedral

Branch `codex/fix-pedral-geometries`, baseada em `staging` (`258d7ec`).

Esta correção conclui a resolução definitiva das geometrias da Rota do Pedral
para as quatro origens oficiais de Altamira:
1. Terminal Rodoviário de Altamira (`rodoviaria`)
2. Aeroporto de Altamira (`aeroporto`)
3. Terminal Fluvial / Cais da Orla (`terminal_fluvial`)
4. Centro / Praça da Matriz (`centro`)

Todas as quatro geometrias são LineStrings viárias contínuas baseadas no grafo
OpenStreetMap (perfil OSRM driving) e terminam no destino canônico oficial:
**Balneário Luiz do Pedral** (`[-52.2194072, -3.255088]`).

A nova migration versionada e idempotente
`20260917160415_pedral_four_origins_coherent_geometries.sql` atualiza as origens,
insere/atualiza as 4 geometrias com bounds e hashes calculados, e recalcula as
flags de corredor de 1.000 m (`origin_flags`) e distâncias em `app_private.route_actors`.
A separação de camadas da PR #67 é rigorosamente preservada: somente atores dentro
de 1.000 m da geometria selecionada aparecem no modo rota; serviços municipais fora
do corredor permanecem restritos ao modo cidade. A importação dos 765 registros
produz 384 atores no corredor viário expandido de 1 km até o balneário.
