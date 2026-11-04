// ===== Live lookup: builds a suspect file straight from GitHub's public API, in the visitor's browser =====
// Budget: GitHub allows 60 API calls an hour per visitor. One suspect costs about 2 + 2 per project (max 12 projects).
// README and package files come from raw.githubusercontent.com, which doesn't count against that.
const GH = 'https://api.github.com';
const TEXT_EXT = /\.(py|js|ts|tsx|jsx|go|rs|java|kt|c|h|cpp|cs|rb|php|swift|gd|lua|sh|html|css|vue|svelte|dart|scala|m|r|jl|txt|json|ya?ml|toml|ipynb|sql)$/i;
const CODE_EXT = /\.(py|js|ts|tsx|jsx|go|rs|java|kt|c|cpp|cs|rb|php|gd|lua|dart|vue|svelte|swift|html|css)$/i;
class Busy extends Error {}
async function gh(path){
  const r = await fetch(GH + path, {headers: {Accept: 'application/vnd.github+json'}});
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
  const files = tree.map(x => x.path), low = files.map(f => f.toLowerCase()), base = low.map(f => f.split('/').pop());
  const readmePath = files.find(f => /^readme(\.\w+)?$/i.test(f));
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
    w: {n_files: files.length, license: lic || null, gitignore: base.includes('.gitignore'), node_modules: low.some(f => f.includes('node_modules/')),
      ds_store: base.filter(b => b === '.ds_store').length, tests: low.filter(f => /(^|\/)(tests?|__tests__|spec)\/|(_test|\.test|\.spec|test_)\w*\./.test(f)).length,
      deps, todos, biggest, empty_files: tree.filter(x => x.size === 0).map(x => x.path).slice(0,3), untitled: []}};
}
async function loadSuspect(user, progress){
  const key = 'ccu-file-' + user.toLowerCase();
  try { const c = JSON.parse(localStorage.getItem(key) || 'null'); if (c && Date.now() - c.at < 6*H) return c.data; } catch(e) {}
  const u = await gh(`/users/${encodeURIComponent(user)}`); if (!u) return null;
  const list = await gh(`/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed&type=owner`);
  const metas = (list ? list.json : []).filter(m => !m.fork && !m.private && m.size > 0 && !m.archived).slice(0, 10);
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
  const data = {user: u.json.login, avatar: u.json.avatar_url, repos, live: true};
  try { localStorage.setItem(key, JSON.stringify({at: Date.now(), data})); } catch(e) {}
  return data;
}
