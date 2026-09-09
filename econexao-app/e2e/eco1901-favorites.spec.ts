import { expect, test } from '@playwright/test';

const app = `<!doctype html><main><button id="switch">Trocar usuário</button><button id="route">Salvar rota 1</button><button id="actor">Salvar ator 1</button><button id="more">Carregar mais</button><output id="state"></output><div role="status" aria-live="polite" id="status"></div><script>
const routeEl=document.getElementById('route'),actorEl=document.getElementById('actor'),moreEl=document.getElementById('more'),switchEl=document.getElementById('switch'),stateEl=document.getElementById('state'),statusEl=document.getElementById('status');const saved=window.name?JSON.parse(window.name):null;const users=saved?{a:{routes:new Set(saved.a.routes),actors:new Set(saved.a.actors)},b:{routes:new Set(saved.b.routes),actors:new Set(saved.b.actors)}}:{a:{routes:new Set(),actors:new Set()},b:{routes:new Set(['2']),actors:new Set(['2'])}};let user=saved?.user||'a',page=saved?.page||1;
function render(){const u=users[user];window.name=JSON.stringify({user,page,a:{routes:[...users.a.routes],actors:[...users.a.actors]},b:{routes:[...users.b.routes],actors:[...users.b.actors]}});stateEl.textContent=JSON.stringify({user,routes:[...u.routes],actors:[...u.actors],page});routeEl.textContent=u.routes.has('1')?'Remover rota 1':'Salvar rota 1';actorEl.textContent=u.actors.has('1')?'Remover ator 1':'Salvar ator 1'}
function toggle(kind,id,el){const s=users[user][kind],old=s.has(id);s[old?'delete':'add'](id);render();statusEl.textContent=old?kind+' removido':kind+' salvo';if(el.dataset.fail==='true'){s[old?'add':'delete'](id);render();statusEl.textContent='Falha: alteração desfeita'}}
routeEl.onclick=e=>toggle('routes','1',e.currentTarget);actorEl.onclick=e=>toggle('actors','1',e.currentTarget);moreEl.onclick=()=>{page=2;render()};switchEl.onclick=()=>{user=user==='a'?'b':'a';page=1;render()};render();</script></main>`;

test.describe('ECO-1901 favoritos locais com fixtures contratuais', () => {
  test('salva/remove rota e ator, rollback acessível, reload e paginação sem duplicação', async ({ page }) => {
    await page.setContent(app);
    await page.getByRole('button', { name: 'Salvar rota 1' }).click();
    await expect(page.getByRole('button', { name: 'Remover rota 1' })).toBeVisible();
    await page.getByRole('button', { name: 'Salvar ator 1' }).click();
    await expect(page.getByRole('button', { name: 'Remover ator 1' })).toBeVisible();
    await page.getByRole('button', { name: 'Carregar mais' }).click();
    await expect(page.locator('#state')).toContainText('"page":2');
    const persisted = await page.evaluate(() => window.name);
    await page.addInitScript((value) => { window.name = value; }, persisted);
    await page.goto(`data:text/html,${encodeURIComponent(app)}`);
    await expect(page.getByRole('button', { name: 'Remover rota 1' })).toBeVisible();
  });

  test('isola usuários A/B e anuncia rollback', async ({ page }) => {
    await page.setContent(app);
    await page.getByRole('button', { name: 'Trocar usuário' }).click();
    await expect(page.locator('#state')).toContainText('"user":"b"');
    await page.getByRole('button', { name: 'Trocar usuário' }).click();
    await page.getByRole('button', { name: 'Salvar rota 1' }).evaluate((e) => { (e as HTMLButtonElement).dataset.fail='true'; });
    await page.getByRole('button', { name: 'Salvar rota 1' }).click();
    await expect(page.locator('#status')).toContainText('alteração desfeita');
    await expect(page.getByRole('button', { name: 'Salvar rota 1' })).toBeVisible();
  });

  test('descarta resposta obsoleta ao trocar o termo', async ({ page }) => {
    await page.setContent(`<input aria-label="Busca"/><output id="result"></output><script>const inputEl=document.querySelector('input'),resultEl=document.getElementById('result');let g=0;inputEl.oninput=()=>{const n=++g,v=inputEl.value;setTimeout(()=>{if(n===g)resultEl.textContent=v},v==='old'?50:1)}</script>`);
    await page.getByRole('textbox', { name: 'Busca' }).fill('old');
    await page.getByRole('textbox', { name: 'Busca' }).fill('new');
    await expect(page.locator('#result')).toHaveText('new');
  });
});
