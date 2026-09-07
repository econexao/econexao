import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const sourcePath = path.join(root, "docs", "project_status.md");
const outputPath = path.join(root, "docs", "project-dashboard.html");

function cleanMarkdown(value = "") {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseProjectStatus(markdown) {
  const updated = markdown.match(/^Atualizado em:\s*(.+)$/m)?.[1]?.trim() ?? "data não informada";
  const taskPattern = /^####\s+(ECO-\d{4}|RQ-\d{2})\s+—\s+(.+?)\r?\n([\s\S]*?)(?=^####\s+(?:ECO-\d{4}|RQ-\d{2})\s+—|(?![\s\S]))/gm;
  const tasks = [];
  let match;
  while ((match = taskPattern.exec(markdown)) !== null) {
    const body = match[3];
    const statusLine = body.match(/\*\*Estado \/ horizonte \/ alteração:\*\*\s*([^\r\n]+)/)?.[1] ?? "NÃO CLASSIFICADA / — / —";
    const [status = "NÃO CLASSIFICADA", horizon = "—", change = "—"] = statusLine.replace(/\.$/, "").split(" / ").map((item) => item.trim());
    const field = (name) => cleanMarkdown(body.match(new RegExp(`\\*\\*${name}:\\*\\*\\s*([^\\r\\n]+)`))?.[1] ?? "Não informado.");
    const audit = cleanMarkdown(body.match(/\*\*Auditoria[^:]*:\*\*\s*([^\r\n]+)/)?.[1] ?? "");
    tasks.push({
      id: match[1],
      title: cleanMarkdown(match[2]),
      status,
      horizon,
      change,
      dependencies: field("Dependências ou sucessoras"),
      acceptance: field("Conclusão / aceite"),
      evidence: field("Evidência e limite"),
      audit,
      event: /Versão do evento|Opcional no evento/i.test(horizon) || /^ECO-26(?:0\d|1\d|2\d|30)$/.test(match[1]),
    });
  }
  return { updated, tasks };
}

const stateMeta = {
  "CONCLUÍDA LOCAL": ["done", "✓", "Concluída localmente"],
  "CONCLUÍDA DOCUMENTAL": ["docs", "◆", "Decisão/documento concluído"],
  "CONCLUÍDA STAGING LIMITADA": ["staging", "◉", "Validada parcialmente em staging"],
  "EM REVISÃO": ["review", "◌", "Em revisão"],
  "PENDENTE": ["pending", "○", "Pendente"],
  "PARCIAL": ["partial", "◐", "Parcial"],
  "BLOQUEADA": ["blocked", "!", "Bloqueada"],
  "BLOQUEADA POR DADOS": ["blocked", "!", "Aguardando dados"],
  "A RECONCILIAR": ["review", "↻", "Precisa reconciliar"],
  "CONDICIONAL": ["optional", "◇", "Opcional/condicional"],
  "DECISÃO PENDENTE": ["blocked", "?", "Aguardando decisão"],
  "ADIADA": ["later", "→", "Adiada"],
  "SUBSTITUÍDA": ["later", "↪", "Substituída"],
  "CANCELADA NO ESCOPO": ["later", "×", "Fora do escopo"],
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function buildDashboard({ updated, tasks }) {
  const counts = Object.fromEntries([...new Set(tasks.map((task) => task.status))].map((status) => [status, tasks.filter((task) => task.status === status).length]));
  const eventTasks = tasks.filter((task) => task.event);
  const completedTasks = tasks.filter((task) => task.status.startsWith("CONCLUÍDA"));
  const partialTasks = tasks.filter((task) => ["PARCIAL", "EM REVISÃO", "A RECONCILIAR"].includes(task.status));
  const nextId = "ECO-2617";
  const data = JSON.stringify({ updated, tasks, stateMeta }).replace(/</g, "\\u003c");
  const stateButtons = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => `<button type="button" class="filter-chip" data-state="${esc(status)}" aria-pressed="false"><span>${esc(stateMeta[status]?.[1] ?? "•")}</span>${esc(status)} <strong>${count}</strong></button>`)
    .join("");
  const taskSummary = (task) => {
    const item = stateMeta[task.status] ?? ["later", "•", task.status];
    return `<details class="task" data-kind="${esc(item[0])}"><summary><span class="status-icon" aria-hidden="true">${esc(item[1])}</span><span class="task-title"><b><span class="task-id">${esc(task.id)}</span> — ${esc(task.title)}</b><small>${esc(task.horizon)}</small></span><span class="status-label">${esc(item[2])}</span></summary><div class="task-body"><dl><dt>O que foi entregue</dt><dd>${esc(task.acceptance)}</dd><dt>Evidência e limite</dt><dd>${esc(task.evidence)}${task.audit ? `<br><br>${esc(task.audit)}` : ""}</dd></dl></div></details>`;
  };
  const historyGroups = [
    ["Decisões e fundações documentadas", completedTasks.filter((task) => task.status === "CONCLUÍDA DOCUMENTAL")],
    ["Implementações verificadas localmente", completedTasks.filter((task) => task.status === "CONCLUÍDA LOCAL")],
    ["Validação remota limitada", completedTasks.filter((task) => task.status === "CONCLUÍDA STAGING LIMITADA")],
  ].map(([title, items]) => `<section class="history-group"><div class="section-title"><h2>${esc(title)}</h2><span>${items.length} registros</span></div><div class="task-list">${items.map(taskSummary).join("")}</div></section>`).join("");
  const recentWork = eventTasks.filter((task) => ["EM REVISÃO", "PARCIAL", "A RECONCILIAR"].includes(task.status)).map(taskSummary).join("");
  const roadmapGroups = [
    ["1. Consolidar a base", ["ECO-2617", "ECO-2002", "ECO-2201"]],
    ["2. Conta e experiência Web", ["ECO-2607", "ECO-2608", "ECO-2609", "ECO-2610", "ECO-2611", "ECO-2612", "ECO-2613", "ECO-2614"]],
    ["3. Colocar as dez rotas", ["ECO-2621", "ECO-2622", "ECO-2623", "ECO-2624", "ECO-2625", "ECO-2626", "ECO-2627", "ECO-2628", "ECO-2629", "ECO-2630"]],
    ["4. Homologar e publicar", ["ECO-2615", "ECO-2315", "ECO-2513", "ECO-2101", "ECO-2104", "ECO-2202", "ECO-2203", "ECO-2205"]],
  ].map(([title, ids], index) => {
    const items = ids.map((id) => tasks.find((task) => task.id === id)).filter(Boolean);
    return `<section class="roadmap-stage"><div class="stage-number">${index + 1}</div><div><h2>${esc(title.replace(/^\d+\.\s*/, ""))}</h2><p>${items.map((task) => `<span class="mini-state" data-kind="${esc((stateMeta[task.status] ?? ["later"])[0])}"><b>${esc(task.id)}</b> ${esc(stateMeta[task.status]?.[2] ?? task.status)}</span>`).join("")}</p></div></section>`;
  }).join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>ECOnexão — Acompanhamento visual</title>
  <style>
    :root{--bg:#f4f7f2;--surface:#fff;--surface-2:#edf3ea;--text:#183027;--muted:#5c6d65;--line:#cdd9d0;--brand:#176b4a;--brand-2:#d9efe4;--warn:#a85b00;--warn-bg:#fff1d6;--danger:#a63434;--danger-bg:#fde5e2;--info:#315a91;--info-bg:#e5eefb;--shadow:0 8px 24px rgba(24,48,39,.08)}
    *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif} button,input,select{font:inherit} button{cursor:pointer} :focus-visible{outline:3px solid #f0a934;outline-offset:2px}
    .shell{max-width:1180px;margin:auto;padding:24px}.hero{background:linear-gradient(135deg,#165b42,#23835d);color:#fff;border-radius:24px;padding:26px;box-shadow:var(--shadow)}
    .eyebrow{font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.85}.hero h1{font-size:clamp(1.8rem,5vw,3rem);line-height:1.05;margin:.25rem 0}.hero p{max-width:780px;margin:.4rem 0 0}.hero-meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.hero-meta span{background:rgba(255,255,255,.14);padding:7px 11px;border-radius:999px}
    .tabs{display:flex;gap:8px;overflow-x:auto;padding:4px;margin:18px 0 10px}.tab{white-space:nowrap;border:1px solid var(--line);background:var(--surface);color:var(--text);padding:11px 16px;border-radius:999px;font-weight:750}.tab[aria-selected="true"]{background:var(--brand);border-color:var(--brand);color:#fff}.tab-panel[hidden]{display:none}.now{margin:12px 0 18px;display:grid;grid-template-columns:1.3fr .7fr;gap:16px}.panel,.stat{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:var(--shadow)}
    .next{border-left:8px solid #f0a934}.next h2,.panel h2{margin:0 0 8px;font-size:1.2rem}.task-id{font-weight:800;color:var(--brand)}.plain{color:var(--muted);margin:.25rem 0}.action{font-size:1.05rem;font-weight:750;margin:.8rem 0 0}.truth{display:grid;gap:8px}.truth div{display:flex;gap:9px;align-items:flex-start}.truth b{min-width:22px}
    .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}.stat strong{display:block;font-size:1.8rem;line-height:1.1}.stat span{color:var(--muted)}
    .progress-wrap{margin:18px 0}.progress-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.progress-track{height:14px;background:#dfe7e1;border-radius:99px;overflow:hidden;display:flex;margin-top:9px}.progress-track span{height:100%}.seg-done{background:#23835d}.seg-review{background:#3b72ad}.seg-open{background:#e6a637}.seg-blocked{background:#c84b4b}.seg-legacy{background:#7d8b84}.legend{display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:10px;color:var(--muted);font-size:.9rem}.dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:5px}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.comparison-block{background:var(--surface-2);border-radius:14px;padding:14px}.comparison-block h3{margin:0}.comparison-block p{margin:4px 0;color:var(--muted)}
    .toolbar{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:14px;margin:18px 0;position:sticky;top:8px;z-index:5;box-shadow:var(--shadow)}.toolbar-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.search{flex:1;min-width:220px;padding:11px 13px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text)}.scope{padding:11px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text)}.filter-toggle{padding:11px 14px;border:0;border-radius:12px;background:var(--brand);color:#fff;font-weight:700}.filters{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.filter-chip{border:1px solid var(--line);border-radius:999px;background:var(--surface-2);color:var(--text);padding:7px 10px}.filter-chip[aria-pressed="true"]{background:var(--brand);color:#fff;border-color:var(--brand)}.filter-chip strong{margin-left:4px}
    .section-title{display:flex;justify-content:space-between;gap:12px;align-items:end;margin:24px 0 10px}.section-title h2{margin:0}.section-title span{color:var(--muted)}
    .task-list{display:grid;gap:10px}.task{background:var(--surface);border:1px solid var(--line);border-left:7px solid var(--line);border-radius:14px;overflow:hidden}.task[data-kind="done"]{border-left-color:#23835d}.task[data-kind="docs"]{border-left-color:#5f8f79}.task[data-kind="staging"]{border-left-color:#6c4ea1}.task[data-kind="review"]{border-left-color:#3b72ad}.task[data-kind="pending"],.task[data-kind="partial"]{border-left-color:#d99320}.task[data-kind="blocked"]{border-left-color:#c84b4b}.task summary{list-style:none;padding:15px;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;cursor:pointer}.task summary::-webkit-details-marker{display:none}.status-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--surface-2);font-weight:900}.task-title b{display:block}.task-title small{color:var(--muted)}.status-label{font-size:.78rem;font-weight:800;text-align:right}.task-body{border-top:1px solid var(--line);padding:16px 18px 18px 61px}.task-body dl{margin:0;display:grid;grid-template-columns:150px 1fr;gap:8px 14px}.task-body dt{font-weight:800}.task-body dd{margin:0;color:var(--muted)}
    .empty{padding:30px;text-align:center;color:var(--muted)}.foot{margin:26px 0 8px;color:var(--muted);font-size:.9rem}.file-load{display:inline-flex;align-items:center;gap:8px}.file-load input{max-width:220px}
    .intro{margin:16px 0}.history-group{margin:24px 0}.roadmap{display:grid;gap:12px;margin:18px 0}.roadmap-stage{display:grid;grid-template-columns:48px 1fr;gap:14px;align-items:start;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:16px}.stage-number{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--brand);color:#fff;font-weight:850}.roadmap-stage h2{margin:4px 0 10px;font-size:1.15rem}.roadmap-stage p{display:flex;flex-wrap:wrap;gap:8px;margin:0}.mini-state{padding:7px 9px;border-radius:9px;background:var(--surface-2);border-left:4px solid var(--line);font-size:.88rem}.mini-state[data-kind="done"],.mini-state[data-kind="docs"]{border-left-color:#23835d}.mini-state[data-kind="review"]{border-left-color:#3b72ad}.mini-state[data-kind="pending"],.mini-state[data-kind="partial"]{border-left-color:#d99320}.mini-state[data-kind="blocked"]{border-left-color:#c84b4b}.history-note{background:var(--info-bg);color:var(--info);border-radius:14px;padding:14px;margin:14px 0}.big-number{font-size:2.1rem;font-weight:850;line-height:1}
    .diagnosis{display:grid;gap:8px;margin:14px 0 18px}.diagnosis-row{display:grid;grid-template-columns:170px 150px 1fr;gap:12px;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px}.level{font-weight:850}.level.good{color:var(--brand)}.level.attention{color:var(--warn)}.level.blocked{color:var(--danger)}.auto-indicator{display:inline-flex;gap:7px;align-items:center}.pulse{width:9px;height:9px;border-radius:50%;background:#69d39d}.auto-help{margin-top:10px;color:var(--muted)}
    @media(max-width:760px){.shell{padding:12px}.hero{border-radius:18px;padding:20px}.now,.comparison{grid-template-columns:1fr}.summary{grid-template-columns:1fr 1fr}.toolbar{top:4px}.task summary{grid-template-columns:auto 1fr}.status-label{grid-column:2;text-align:left}.task-body{padding:14px}.task-body dl{grid-template-columns:1fr}.task-body dd{margin-bottom:8px}.diagnosis-row{grid-template-columns:1fr;gap:3px}}
    @media(max-width:430px){.summary{grid-template-columns:1fr}.hero-meta{display:grid}.scope,.filter-toggle{flex:1}.filters{display:none}.filters.open{display:flex}}
    @media(prefers-reduced-motion:no-preference){details.task{transition:transform .15s ease}details.task:hover{transform:translateY(-1px)}}
    @media(prefers-color-scheme:dark){:root{--bg:#101813;--surface:#17241d;--surface-2:#213229;--text:#e7f2eb;--muted:#b2c2b8;--line:#364a3e;--brand:#57c58f;--brand-2:#1d5139;--shadow:none}.task-id{color:#70d7a4}.filter-toggle{color:#092217}.progress-track{background:#2c3c33}}
  </style>
</head>
<body>
<main class="shell">
  <header class="hero">
    <div class="eyebrow">ECOnexão · visão sem ruído</div>
    <h1>Base implementada.<br>Integração e homologação pendentes.</h1>
    <p>${eventTasks.length} tarefas do evento: ${eventTasks.filter(t=>t.status.startsWith("CONCLUÍDA")).length} com algum nível concluído, ${eventTasks.filter(t=>["EM REVISÃO","A RECONCILIAR","PARCIAL"].includes(t.status)).length} em revisão/parciais, ${eventTasks.filter(t=>t.status.includes("BLOQUEADA")||t.status==="DECISÃO PENDENTE").length} bloqueadas e ${eventTasks.filter(t=>["PENDENTE","CONDICIONAL"].includes(t.status)).length} abertas.</p>
    <div class="hero-meta"><span>Fonte: project_status.md</span><span>Atualizado: ${esc(updated)}</span><span>${tasks.length} tarefas catalogadas</span><span id="autoStatus">Arquivo estático</span></div>
  </header>

  <nav class="tabs" role="tablist" aria-label="Formas de acompanhar o projeto">
    <button class="tab" id="tab-overview" role="tab" aria-selected="true" aria-controls="panel-overview" type="button">Agora</button>
    <button class="tab" id="tab-history" role="tab" aria-selected="false" aria-controls="panel-history" type="button">Histórico</button>
    <button class="tab" id="tab-roadmap" role="tab" aria-selected="false" aria-controls="panel-roadmap" type="button">Até o lançamento</button>
    <button class="tab" id="tab-catalog" role="tab" aria-selected="false" aria-controls="panel-catalog" type="button">Todas as tarefas</button>
  </nav>

  <div id="panel-overview" class="tab-panel" role="tabpanel" aria-labelledby="tab-overview">
  <section class="panel intro" aria-labelledby="diagnosis-title">
    <div class="progress-head"><h2 id="diagnosis-title">Diagnóstico por dimensão</h2><span class="plain">Situação, evidência e próximo gate</span></div>
    <div class="diagnosis">
      <div class="diagnosis-row"><b>Direção técnica</b><span class="level good">COERENTE</span><span>Expo 54, FastAPI e Supabase seguem as decisões arquiteturais.</span></div>
      <div class="diagnosis-row"><b>Base integrada</b><span class="level attention">A RECONCILIAR</span><span>ECO-2603–2606 existem em refs/commits diferentes; ECO-2617 precisa consolidar a evidência.</span></div>
      <div class="diagnosis-row"><b>Experiência Web</b><span class="level attention">EM CONSTRUÇÃO</span><span>Mapa, catálogo, conta e viagens têm bases existentes, mas novos aceites continuam abertos.</span></div>
      <div class="diagnosis-row"><b>Conteúdo das rotas</b><span class="level blocked">BLOQUEADO</span><span>Nove rotas aguardam dados/revisão; Pindobal continua parcial no pacote novo.</span></div>
      <div class="diagnosis-row"><b>Release</b><span class="level blocked">NÃO HOMOLOGADO</span><span>Faltam ambiente real, Safari/iPhone, desempenho, custo, dez rotas e gates de publicação.</span></div>
    </div>
  </section>
  <section class="now" aria-label="Prioridade atual">
    <article class="panel next">
      <div class="eyebrow" style="color:var(--warn)">FAZER AGORA · UMA COISA</div>
      <h2><span class="task-id">${nextId}</span> — Reconciliar base integrada e evidências</h2>
      <p class="plain">Confirmar qual versão reúne as entregas ECO-2603 a ECO-2606, quais provas são locais e o que ainda depende de ambiente real.</p>
      <p class="action">Depois disso: escolher uma única próxima tarefa desbloqueada.</p>
    </article>
    <aside class="panel">
      <h2>Leitura honesta</h2>
      <div class="truth"><div><b>✓</b><span>Arquitetura e direção estão coerentes.</span></div><div><b>◐</b><span>Muito existe localmente, mas vários itens são parciais.</span></div><div><b>!</b><span>Release e dez rotas ainda não foram homologados.</span></div></div>
    </aside>
  </section>

  <div class="section-title"><h2>Recorte atual: versão do evento</h2><span>Estas 27 não representam todo o histórico</span></div>
  <section class="summary" aria-label="Resumo das tarefas do evento">
    <article class="stat"><strong>${eventTasks.length}</strong><span>tarefas do evento</span></article>
    <article class="stat"><strong>${eventTasks.filter(t=>t.status.startsWith("CONCLUÍDA")).length}</strong><span>com algum nível concluído</span></article>
    <article class="stat"><strong>${eventTasks.filter(t=>["EM REVISÃO","A RECONCILIAR","PARCIAL"].includes(t.status)).length}</strong><span>em revisão ou parciais</span></article>
    <article class="stat"><strong>${eventTasks.filter(t=>t.status.includes("BLOQUEADA")||t.status==="DECISÃO PENDENTE").length}</strong><span>bloqueadas ou aguardando decisão</span></article>
  </section>

  <section class="panel progress-wrap" aria-labelledby="progress-title">
    <div class="progress-head"><h2 id="progress-title">Evento × projeto inteiro</h2><span class="plain">Dois recortes diferentes; as barras não são percentual de produto pronto</span></div>
    <div class="comparison">
      <div class="comparison-block">
        <h3>Versão do evento · ${eventTasks.length} tarefas</h3>
        <p>${eventTasks.filter(t=>t.status.startsWith("CONCLUÍDA")).length} concluídas em algum nível · ${eventTasks.filter(t=>["EM REVISÃO","A RECONCILIAR","PARCIAL"].includes(t.status)).length} com trabalho parcial/em revisão · ${eventTasks.filter(t=>t.status.includes("BLOQUEADA")||t.status==="DECISÃO PENDENTE").length} bloqueadas · ${eventTasks.filter(t=>["PENDENTE","CONDICIONAL"].includes(t.status)).length} abertas</p>
        <div class="progress-track" role="img" aria-label="Distribuição das 27 tarefas da versão do evento">
          <span class="seg-done" style="width:${eventTasks.filter(t=>t.status.startsWith("CONCLUÍDA")).length/eventTasks.length*100}%"></span><span class="seg-review" style="width:${eventTasks.filter(t=>["EM REVISÃO","A RECONCILIAR","PARCIAL"].includes(t.status)).length/eventTasks.length*100}%"></span><span class="seg-blocked" style="width:${eventTasks.filter(t=>t.status.includes("BLOQUEADA")||t.status==="DECISÃO PENDENTE").length/eventTasks.length*100}%"></span><span class="seg-open" style="width:${eventTasks.filter(t=>["PENDENTE","CONDICIONAL"].includes(t.status)).length/eventTasks.length*100}%"></span>
        </div>
      </div>
      <div class="comparison-block">
        <h3>Projeto inteiro · ${tasks.length} registros</h3>
        <p>${completedTasks.length} concluídos em algum nível · ${partialTasks.length} com trabalho/evidência parcial · ${tasks.filter(t=>t.status==="SUBSTITUÍDA").length} IDs históricos substituídos · ${tasks.length-completedTasks.length-partialTasks.length-tasks.filter(t=>t.status==="SUBSTITUÍDA").length} nos demais estados</p>
        <div class="progress-track" role="img" aria-label="Distribuição dos 206 registros históricos do projeto">
          <span class="seg-done" style="width:${completedTasks.length/tasks.length*100}%"></span><span class="seg-review" style="width:${partialTasks.length/tasks.length*100}%"></span><span class="seg-legacy" style="width:${tasks.filter(t=>t.status==="SUBSTITUÍDA").length/tasks.length*100}%"></span><span class="seg-open" style="width:${(tasks.length-completedTasks.length-partialTasks.length-tasks.filter(t=>t.status==="SUBSTITUÍDA").length)/tasks.length*100}%"></span>
        </div>
      </div>
    </div>
    <div class="legend"><span><i class="dot seg-done"></i>conclusão comprovada em algum nível</span><span><i class="dot seg-review"></i>trabalho/evidência parcial</span><span><i class="dot seg-blocked"></i>bloqueada no evento</span><span><i class="dot seg-legacy"></i>ID histórico substituído</span><span><i class="dot seg-open"></i>demais estados</span></div>
  </section>
  </div>

  <div id="panel-history" class="tab-panel" role="tabpanel" aria-labelledby="tab-history" hidden>
    <section class="panel intro">
      <div class="eyebrow" style="color:var(--brand)">DIMENSÃO DO QUE JÁ FOI FEITO</div>
      <h2><span class="big-number">${completedTasks.length}</span> registros têm algum nível de conclusão comprovado</h2>
      <p class="plain">São ${completedTasks.filter(t=>t.status==="CONCLUÍDA DOCUMENTAL").length} decisões/documentos, ${completedTasks.filter(t=>t.status==="CONCLUÍDA LOCAL").length} implementações locais e ${completedTasks.filter(t=>t.status==="CONCLUÍDA STAGING LIMITADA").length} validação limitada em staging. Cada nível tem um significado diferente.</p>
    </section>
    <div class="history-note"><b>Importante:</b> histórico mostra trabalho e evidência acumulados. Não significa que a versão inteira esteja publicada ou homologada.</div>
    ${historyGroups}
    <section class="history-group"><div class="section-title"><h2>Trabalho recente ainda em consolidação</h2><span>${partialTasks.length} parciais/revisões no cadastro completo</span></div><p class="plain">Abaixo estão os itens ligados à versão do evento que já têm trabalho ou evidência, mas ainda não podem ser tratados como concluídos.</p><div class="task-list">${recentWork}</div></section>
  </div>

  <div id="panel-roadmap" class="tab-panel" role="tabpanel" aria-labelledby="tab-roadmap" hidden>
    <section class="panel intro"><div class="eyebrow" style="color:var(--brand)">CAMINHO CRÍTICO EM QUATRO BLOCOS</div><h2>Do estado atual até uma versão publicável</h2><p class="plain">Leia de cima para baixo. Itens bloqueados por dados podem avançar assim que o conteúdo for entregue e revisado.</p></section>
    <div class="roadmap">${roadmapGroups}</div>
  </div>

  <div id="panel-catalog" class="tab-panel" role="tabpanel" aria-labelledby="tab-catalog" hidden>

  <section class="toolbar" aria-label="Filtros">
    <div class="toolbar-row">
      <input id="search" class="search" type="search" placeholder="Buscar ECO-2617, login, mapa..." aria-label="Buscar tarefa">
      <select id="scope" class="scope" aria-label="Escopo"><option value="event" selected>Só versão do evento</option><option value="active">Todas, sem substituídas</option><option value="all">Todas as 206</option></select>
      <button id="toggleFilters" class="filter-toggle" type="button" aria-expanded="false">Estados</button>
      <label class="file-load">Atualizar do .md <input id="mdFile" type="file" accept=".md,text/markdown"></label>
    </div>
    <div id="filters" class="filters" aria-label="Filtrar por estado">${stateButtons}</div>
  </section>

  <section aria-labelledby="tasks-title">
    <div class="section-title"><h2 id="tasks-title">Tarefas</h2><span id="resultCount" aria-live="polite"></span></div>
    <div id="taskList" class="task-list"></div>
  </section>
  </div>
  <p class="foot">Abra uma tarefa para ver dependências, aceite e evidência. Atualização automática: execute <code>node scripts/generate-project-dashboard.mjs --serve</code>. Para gerar apenas uma cópia estática, execute sem <code>--serve</code>.</p>
</main>
<script>
  const initial = ${data};
  let tasks = initial.tasks;
  const selectedStates = new Set();
  const list = document.getElementById('taskList');
  const search = document.getElementById('search');
  const scope = document.getElementById('scope');
  const count = document.getElementById('resultCount');
  const filters = document.getElementById('filters');
  const meta = initial.stateMeta;
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  document.querySelector('.tabs').addEventListener('click', event => {
    const tab=event.target.closest('[role="tab"]'); if(!tab)return;
    document.querySelectorAll('[role="tab"]').forEach(item=>item.setAttribute('aria-selected',String(item===tab)));
    document.querySelectorAll('.tab-panel').forEach(panel=>panel.hidden=panel.id!==tab.getAttribute('aria-controls'));
    tab.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest',inline:'nearest'});
  });
  function render(){
    const query = search.value.trim().toLocaleLowerCase('pt-BR');
    const mode = scope.value;
    const visible = tasks.filter(task => {
      if(mode === 'event' && !task.event) return false;
      if(mode === 'active' && ['SUBSTITUÍDA','ADIADA','CANCELADA NO ESCOPO'].includes(task.status)) return false;
      if(selectedStates.size && !selectedStates.has(task.status)) return false;
      return !query || [task.id,task.title,task.status,task.horizon,task.dependencies,task.acceptance,task.evidence].join(' ').toLocaleLowerCase('pt-BR').includes(query);
    });
    count.textContent = visible.length + (visible.length === 1 ? ' tarefa visível' : ' tarefas visíveis');
    list.innerHTML = visible.length ? visible.map(task => {
      const m = meta[task.status] || ['later','•',task.status];
      return '<details class="task" data-kind="'+safe(m[0])+'"><summary><span class="status-icon" aria-hidden="true">'+safe(m[1])+'</span><span class="task-title"><b><span class="task-id">'+safe(task.id)+'</span> — '+safe(task.title)+'</b><small>'+safe(task.horizon)+'</small></span><span class="status-label">'+safe(m[2])+'</span></summary><div class="task-body"><dl><dt>Depende de</dt><dd>'+safe(task.dependencies)+'</dd><dt>Para considerar pronta</dt><dd>'+safe(task.acceptance)+'</dd><dt>Evidência atual</dt><dd>'+safe(task.evidence)+(task.audit ? '<br><br>'+safe(task.audit) : '')+'</dd></dl></div></details>';
    }).join('') : '<div class="empty">Nenhuma tarefa encontrada. Limpe a busca ou os filtros.</div>';
  }
  search.addEventListener('input', render); scope.addEventListener('change', render);
  filters.addEventListener('click', event => { const button=event.target.closest('[data-state]'); if(!button)return; const state=button.dataset.state; selectedStates.has(state)?selectedStates.delete(state):selectedStates.add(state); button.setAttribute('aria-pressed',selectedStates.has(state)); render(); });
  document.getElementById('toggleFilters').addEventListener('click', event => { filters.classList.toggle('open'); const open=filters.classList.contains('open'); event.currentTarget.setAttribute('aria-expanded',open); });
  document.getElementById('mdFile').addEventListener('change', async event => {
    const file=event.target.files[0]; if(!file)return; const text=await file.text(); const pattern=/^####\\s+(ECO-\\d{4}|RQ-\\d{2})\\s+—\\s+(.+?)\\r?\\n([\\s\\S]*?)(?=^####\\s+(?:ECO-\\d{4}|RQ-\\d{2})\\s+—|(?![\\s\\S]))/gm; const fresh=[]; let match;
    const clean=v=>(v||'').replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g,'$1').replace(/\`([^\`]+)\`/g,'$1').replace(/\\*\\*/g,'').replace(/\\s+/g,' ').trim();
    while((match=pattern.exec(text))!==null){ const body=match[3]; const raw=body.match(/\\*\\*Estado \\/ horizonte \\/ alteração:\\*\\*\\s*([^\\r\\n]+)/)?.[1]||'NÃO CLASSIFICADA / — / —'; const parts=raw.replace(/\\.$/,'').split(' / '); const field=name=>clean(body.match(new RegExp('\\\\*\\\\*'+name+':\\\\*\\\\*\\\\s*([^\\\\r\\\\n]+)'))?.[1]||'Não informado.'); fresh.push({id:match[1],title:clean(match[2]),status:(parts[0]||'').trim(),horizon:(parts[1]||'—').trim(),change:(parts[2]||'—').trim(),dependencies:field('Dependências ou sucessoras'),acceptance:field('Conclusão / aceite'),evidence:field('Evidência e limite'),audit:'',event:/Versão do evento|Opcional no evento/i.test(parts[1]||'')||/^ECO-26(?:0\\d|1\\d|2\\d|30)$/.test(match[1])}); }
    if(fresh.length){tasks=fresh; selectedStates.clear(); document.querySelectorAll('[data-state]').forEach(b=>b.setAttribute('aria-pressed','false')); render(); count.textContent=fresh.length+' tarefas carregadas do arquivo selecionado';} else {count.textContent='Não consegui reconhecer tarefas nesse arquivo.';}
  });
  if(location.protocol === 'http:'){
    document.getElementById('autoStatus').innerHTML='<span class="auto-indicator"><i class="pulse"></i>Atualização automática ativa</span>';
    let knownVersion=null;
    setInterval(async()=>{try{const response=await fetch('/__dashboard_version',{cache:'no-store'});const version=await response.text();if(knownVersion===null)knownVersion=version;else if(version!==knownVersion)location.reload();}catch{}},1500);
  }
  render();
</script>
</body>
</html>`;
}

function generate() {
  const markdown = fs.readFileSync(sourcePath, "utf8");
  const parsed = parseProjectStatus(markdown);
  if (parsed.tasks.length < 1) throw new Error("Nenhuma tarefa foi reconhecida em docs/project_status.md");
  fs.writeFileSync(outputPath, buildDashboard(parsed), "utf8");
  console.log(`Painel gerado: ${outputPath}`);
  console.log(`Tarefas reconhecidas: ${parsed.tasks.length}`);
}

generate();
if (process.argv.includes("--watch") || process.argv.includes("--serve")) {
  console.log("Observando docs/project_status.md. Pressione Ctrl+C para encerrar.");
  fs.watchFile(sourcePath, { interval: 700 }, generate);
}
if (process.argv.includes("--serve")) {
  const host = "127.0.0.1";
  const port = 4177;
  const server = http.createServer((request, response) => {
    if (request.url === "/__dashboard_version") {
      response.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
      response.end(String(fs.statSync(outputPath).mtimeMs));
      return;
    }
    if (request.url === "/" || request.url === "/project-dashboard.html") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      fs.createReadStream(outputPath).pipe(response);
      return;
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Não encontrado");
  });
  server.listen(port, host, () => {
    const url = `http://${host}:${port}`;
    console.log(`Painel automático: ${url}`);
    if (process.platform === "win32") spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore", windowsHide: true }).unref();
  });
}
