// ===== Live lookup: builds a suspect file straight from GitHub's public API, in the visitor's browser =====
// Budget: GitHub allows 60 API calls an hour per visitor. One suspect costs about 2 + 2 per project (max 12 projects).
// README and package files come from raw.githubusercontent.com, which doesn't count against that.
const GH = 'https://api.github.com';
const TEXT_EXT = /\.(py|js|ts|tsx|jsx|go|rs|java|kt|c|h|cpp|cs|rb|php|swift|gd|lua|sh|html|css|vue|svelte|dart|scala|m|r|jl|txt|json|ya?ml|toml|ipynb|sql|mm|hpp|cc|cxx|zig|ex|exs|erl|hs|ml|fs|clj|cljs|nim|v|sv|vhdl?|asm|s|metal|glsl|hlsl|wgsl|shader|cu|cmake|pl|ps1|bat|elm|cr|hx|groovy|gradle|tf|nix|sol|proto|f90|kts|mjs|cjs|astro|coffee|vb|pas|ada|d|scss|sass|less)$/i;
const CODE_EXT = /\.(py|js|ts|tsx|jsx|go|rs|java|kt|c|cpp|cs|rb|php|gd|lua|dart|vue|svelte|swift|html|css)$/i;
class Busy extends Error {}
// Sign in with GitHub: the helper (auth/worker.js) hands back a token in the address fragment.
// It has no permissions (public data only) and stays in this browser tab.
const AUTH_URL = 'https://cold-case-auth.connabyss.workers.dev';
let TOKEN = null, ME = null, JUST_SIGNED_IN = false;
try { TOKEN = sessionStorage.getItem('ccu-token'); ME = sessionStorage.getItem('ccu-me'); } catch(e) {}
{ const m = location.hash.match(/token=([^&]+)/);
  if (m) { TOKEN = decodeURIComponent(m[1]); JUST_SIGNED_IN = true; try { sessionStorage.setItem('ccu-token', TOKEN); } catch(e) {}
    try { history.replaceState(null, '', location.pathname + location.search); } catch(e) {} } }
async function whoAmI(){
  if (!TOKEN || ME) return ME;
  try { const r = await fetch(GH + '/user', {headers: {Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + TOKEN}});
    if (r.status === 401) { signOut(); return null; }
    if (r.ok) { ME = (await r.json()).login; try { sessionStorage.setItem('ccu-me', ME); } catch(e) {} } } catch(e) {}
  return ME;
}
function signOut(){ TOKEN = ME = null; try { sessionStorage.removeItem('ccu-token'); sessionStorage.removeItem('ccu-me'); } catch(e) {} }
function signIn(){ const u = new URLSearchParams(location.search).get('u') || ''; location.href = AUTH_URL + '/login' + (u ? '?u=' + encodeURIComponent(u) : ''); }
async function gh(path){
  const r = await fetch(GH + path, {headers: TOKEN ? {Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + TOKEN} : {Accept: 'application/vnd.github+json'}});
  if (r.status === 401 && TOKEN) { signOut(); return gh(path); }
  if (r.status === 403 || r.status === 429) { const reset = +r.headers.get('x-ratelimit-reset') * 1000; throw new Busy(reset ? new Date(reset).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}) : 'later'); }
  if (r.status === 404) return null;
  if (r.status === 409) return []; // empty repository
  if (!r.ok) throw new Error('GitHub said ' + r.status);
  return {json: await r.json(), link: r.headers.get('link') || ''};
}
async function raw(owner, repo, ref, path){
  try { const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${path.split('/').map(encodeURIComponent).join('/')}`); return r.ok ? await r.text() : ''; } catch(e) { return ''; }
}
async function loadRepo(owner, m){
  if (Date.now() - Date.parse(m.pushed_at) < 3*D) {
    // still breathing: one call for the newest commit and the commit count is enough
    const one = await gh(`/repos/${owner}/${m.name}/commits?per_page=1`);
    if (!one || !one.json.length) return null;
    const x = one.json[0], total = +(one.link.match(/[?&]page=(\d+)>; rel="last"/) || [0,1])[1];
    return {name: m.name, desc: m.description || '', created: m.created_at, pushed: m.pushed_at, stars: m.stargazers_count, forks: m.forks_count,
      commits: [{date: x.commit.committer.date, author: x.commit.author.name, msg: (x.commit.message||'').split('\n')[0]}], total, first_files: [], files: 0,
      readme_words: 0, readme_head: '', code_words: 0, has_contributing: false, authors: [x.commit.author.name], w: {}, breathing: true};
  }
  const c = await gh(`/repos/${owner}/${m.name}/commits?per_page=100`);
  if (!c || !c.json.length) return null;
  let commits = c.json.map(x => ({date: x.commit.committer.date || x.commit.author.date, author: x.commit.author.name, msg: (x.commit.message || '').split('\n')[0]}));
  let total = commits.length;
  if (commits.length === 100) {
    // find the very first commit: ask for one commit per page and jump to the last page
    const one = await gh(`/repos/${owner}/${m.name}/commits?per_page=1`);
    const last = one && +(one.link.match(/[?&]page=(\d+)>; rel="last"/) || [])[1];
    if (last) { total = last; const f = await gh(`/repos/${owner}/${m.name}/commits?per_page=1&page=${last}`);
      if (f && f.json[0]) { const x = f.json[0]; commits.push({date: x.commit.committer.date, author: x.commit.author.name, msg: (x.commit.message||'').split('\n')[0]}); } }
  }
  const t = await gh(`/repos/${owner}/${m.name}/git/trees/${encodeURIComponent(m.default_branch)}?recursive=1`);
  const tree = t && t.json.tree ? t.json.tree.filter(x => x.type === 'blob') : [];
  const partial = !!(t && t.json.truncated);
  const files = tree.map(x => x.path), low = files.map(f => f.toLowerCase()), base = low.map(f => f.split('/').pop());
  const readmePath = files.find(f => /^readme(\.\w+)?$/i.test(f)) || files.find(f => /^(\.github|docs)\/readme(\.\w+)?$/i.test(f));
  const readme = readmePath ? await raw(owner, m.name, m.default_branch, readmePath) : '';
  let codeBytes = 0; tree.forEach(x => { if (x.path !== readmePath && TEXT_EXT.test(x.path) && !/\.md$|license/i.test(x.path)) codeBytes += x.size || 0; });
  let deps = 0;
  const pj = files.find(f => f.split('/').pop() === 'package.json' && !f.includes('node_modules'));
  if (pj) { try { const j = JSON.parse(await raw(owner, m.name, m.default_branch, pj)); deps = Object.keys(j.dependencies||{}).length + Object.keys(j.devDependencies||{}).length; } catch(e) {} }
  const rq = files.find(f => f.split('/').pop() === 'requirements.txt');
  if (rq) deps = Math.max(deps, (await raw(owner, m.name, m.default_branch, rq)).split('\n').filter(l => l.trim() && !l.startsWith('#')).length);
  // read a few code files for TODOs and the biggest file
  const code = tree.filter(x => CODE_EXT.test(x.path) && !/(^|\/)(vendor|dist|build|static|public|lib|libs|third_party|assets|node_modules)\/|\.min\./i.test(x.path) && x.size < 200000).sort((a,b)=>b.size-a.size).slice(0,8);
  let todos = 0, biggest = [0, ''];
  for (const x of code) { const s = await raw(owner, m.name, m.default_branch, x.path); todos += (s.match(/\b(TODO|FIXME|XXX|HACK)\b/g)||[]).length; const n = s.split('\n').length - 1; if (n > biggest[0]) biggest = [n, x.path]; }
  const lic = files.find((f,i) => /^licen[cs]e/.test(base[i]));
  return {name: m.name, desc: m.description || '', created: m.created_at, pushed: m.pushed_at, stars: m.stargazers_count, forks: m.forks_count,
    commits, total, first_files: [], files: files.length, readme_words: readme.split(/\s+/).filter(Boolean).length, readme_head: readme.slice(0, 1500),
    code_words: Math.round(codeBytes / 6), has_contributing: low.some(f => /(^|\/)contributing/.test(f)), authors: [...new Set(commits.map(x => x.author))],
    w: {partial, n_files: files.length, license: lic || null, gitignore: partial && !base.includes('.gitignore') ? null : base.includes('.gitignore'), node_modules: low.some(f => f.includes('node_modules/')),
      ds_store: base.filter(b => b === '.ds_store').length, tests: partial ? null : files.filter(f => /(^|\/)(tests?|__tests__|specs?|testing)\/|[a-z0-9]tests\/|\.tests?\/|(_test|\.test|\.spec|_spec|test_)\w*\.\w+$|(^|[\/._-])tests?\.\w+$/i.test(f) || /[a-z0-9](Tests?|Spec)(\/|\.\w+$)/.test(f)).length,
      deps, todos, biggest, empty_files: tree.filter(x => x.size === 0).map(x => x.path).slice(0,3), untitled: []}};
}
// Saved lookups: the saved copy is raw GitHub facts, not the jokes, so wording fixes show at once.
// LOADER_VER changes whenever this loader changes (set by build.py), which retires every older copy.
// Signed out, a copy lasts an hour (GitHub allows 60 lookups an hour); signed in, 10 minutes.
const LOADER_VER = '__LOADER_VER__';
try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (/^ccu-file-/.test(k) && !k.startsWith('ccu-file-' + LOADER_VER + '-')) localStorage.removeItem(k); } } catch(e) {}
function cacheKey(user){ return 'ccu-file-' + LOADER_VER + '-' + user.toLowerCase(); }
function forget(user){ try { localStorage.removeItem(cacheKey(user)); } catch(e) {} }
async function loadSuspect(user, progress, fresh){
  const key = cacheKey(user);
  if (!fresh) try { const c = JSON.parse(localStorage.getItem(key) || 'null'); if (c && Date.now() - c.at < (TOKEN ? 10*60e3 : H)) return c.data; } catch(e) {}
  const u = await gh(`/users/${encodeURIComponent(user)}`); if (!u) return null;
  // read every project's basic record (100 per call, up to 300), then open full files on at most 10
  let listed = [];
  for (let pg = 1; pg <= 3; pg++) { const l = await gh(`/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed&type=owner&page=${pg}`); if (!l) break; listed = listed.concat(l.json); if (l.json.length < 100) break; }
  const own = listed.filter(m => !m.fork && !m.private && m.size > 0);
  const quietFor = m => Date.now() - Date.parse(m.pushed_at), lifeOf = m => Date.parse(m.pushed_at) - Date.parse(m.created_at);
  let metas, extra = null;
  if (own.filter(m => !m.archived).length <= 10) metas = own.filter(m => !m.archived);
  else {
    const breathing = own.filter(m => quietFor(m) < 3*D && !m.archived).slice(0, 2);
    const deadish = own.filter(m => quietFor(m) > 30*D);
    const shortest = deadish.slice().sort((a,b) => lifeOf(a) - lifeOf(b)).slice(0, 6);
    const starred = deadish.filter(m => !shortest.includes(m)).sort((a,b) => b.stargazers_count - a.stargazers_count).slice(0, 10 - shortest.length);
    metas = [...breathing, ...shortest, ...starred];
    const yearDead = own.filter(m => quietFor(m) > 365*D || m.archived); // archived counts as dead, however recent
    const oldest = yearDead.slice().sort((a,b) => quietFor(b) - quietFor(a))[0];
    extra = {total: u.json.public_repos, listedAll: listed.length, listed: own.length, dead: yearDead.length, archived: own.filter(m => m.archived).length,
      stars: yearDead.reduce((t,m) => t + m.stargazers_count, 0), forks: yearDead.reduce((t,m) => t + m.forks_count, 0),
      oldest: oldest ? {name: oldest.name, quiet: quietFor(oldest)} : null, breathing: own.filter(m => quietFor(m) < 365*D && !m.archived).map(m => m.name)};
  }
  const repos = [];
  for (let i = 0; i < metas.length; i++) { progress && progress(i, metas.length, metas[i].name); const r = await loadRepo(user, metas[i]); if (r) repos.push(r); }
  // the motive: the busiest project only has its last 100 commits here, so fetch its commits around each short-lived death
  const busy = repos.slice().sort((a,b)=>b.total-a.total)[0];
  if (busy && busy.total > busy.commits.length - 1) {
    const victims = repos.filter(r => r !== busy).map(r => { const ts = r.commits.map(c=>Date.parse(c.date)); return {r, born: Math.min(...ts), died: Math.max(...ts)}; })
      .filter(v => v.died - v.born < 7*D && Date.now() - v.died > 3*D).sort((a,b)=>(a.died-a.born)-(b.died-b.born)).slice(0,3);
    for (const v of victims) {
      const res = await gh(`/repos/${user}/${busy.name}/commits?per_page=100&since=${new Date(v.born - D).toISOString()}&until=${new Date(v.died + D).toISOString()}`).catch(()=>null);
      if (res && res.json.length) { const seen = new Set(busy.commits.map(c=>c.date+c.msg));
        res.json.forEach(x => { const c = {date: x.commit.committer.date, author: x.commit.author.name, msg: (x.commit.message||'').split('\n')[0]}; if (!seen.has(c.date+c.msg)) busy.commits.push(c); }); }
    }
  }
  const data = {user: u.json.login, type: u.json.type, avatar: u.json.avatar_url, repos, extra, live: true, at: Date.now()};
  try { localStorage.setItem(key, JSON.stringify({at: Date.now(), data})); } catch(e) {}
  return data;
}
