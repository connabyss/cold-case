// Run: node tests/clues.test.js [page.html]   (needs Playwright; uses saved GitHub data, no network)
// Checks every case file built from the saved suspects in tests/fixtures/.
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const page = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const fixtures = fs.readdirSync(path.join(__dirname, 'fixtures')).map(f => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', f))));
const SPAN = /\b\d[\d,.]*\s(second|minute|hour|day|month|year)s?\b/g;
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await p.goto('file://' + page);
  let fails = 0, checked = 0;
  const fail = (s, c, why) => { fails++; console.log(`FAIL ${s}/${c.name}: ${why}\n  ` + c.clues.join('\n  ') + (c.fun ? '\n  funeral: ' + c.fun : '')); };
  for (const s of fixtures) {
    const cases = await p.evaluate(s => { const dead = s.repos.map(r => analyze(r, s)).filter(c => c.dead); vary(dead);
      return dead.map(c => ({name: c.repo.name, clues: c.clues.map(x => x.text.replace(/<[^>]+>/g,'')), wit: c.wit ? c.wit.text : '', fun: c.fun || ''})); }, s);
    for (const c of cases) {
      checked++;
      // the same time span ("58 minutes") on two clues of one card is one fact told twice
      const spans = c.clues.flatMap(t => [...new Set(t.match(SPAN) || [])].map(k => k.replace(/s$/,'')));
      const dup = spans.find((k, i) => spans.indexOf(k) !== i);
      if (dup) fail(s.user, c, `"${dup}" is on more than one clue`);
      // the funeral line shouldn't repeat the witness ("Nobody forked it" / "No forks")
      for (const w of ['fork', 'star']) {
        const re = new RegExp('\\b' + w, 'i');
        if (re.test(c.fun) && re.test(c.wit)) fail(s.user, c, `funeral repeats "${w}"`);
      }
      if (/\bevery 1 /.test(c.clues.join(' '))) fail(s.user, c, 'says "every 1 minute"');
      // CH's pick (11-05): a short burst gets its age and pace on one line, first
      if (c.name === 'ghosts-of-bugs-past' && c.clues[0] !== 'It lived 58 minutes. A commit about every 10, then none, ever.') fail(s.user, c, 'first clue is not the age + pace line');
    }
  }
  // CH 11-12: the poster's numbers must agree, and a clean record must not be a dead end
  {
    const h = 3600e3, d = 24*h, at = t => new Date(Date.now() - t).toISOString().slice(0, 19) + 'Z';
    const repo = (name, born, last, n) => ({name, desc: '', created: at(born), pushed: at(last), stars: 0, forks: 0, total: n,
      commits: Array.from({length: n}, (_, i) => ({date: at(last + (born - last) * i / Math.max(1, n - 1)), author: 'x', msg: i === n - 1 ? 'first commit' : 'more'})),
      first_files: [], files: 3, readme_words: 0, readme_head: '', code_words: 0, has_contributing: false, authors: ['x'], w: {}});
    const fresh = {user: 'fresh', type: 'User', avatar: '', live: true, at: Date.now(), extra: null,
      repos: [repo('alpha', 20*d, 5*h, 9), repo('beta', 10*d, 2*d, 6), repo('gamma', 4*d, 1*d, 4)]};
    // 11 projects (past the 10 that get opened in full): 4 still worked on, 7 one-day builds left a week ago.
    // loadSuspect() runs for real against a fake GitHub, so this guards the death rule in live.js too.
    const meta = (name, born, last) => ({name, description: '', created_at: at(born), pushed_at: at(last), stargazers_count: 0, forks_count: 0,
      fork: false, private: false, archived: false, size: 10, default_branch: 'main'});
    const metas = [meta('a1', 20*d, 2*h), meta('a2', 9*d, 3*h), meta('a3', 15*d, 5*d), meta('a4', 30*d, 10*d)]
      .concat([1,2,3,4,5,6,7].map(i => meta('quick' + i, 7*d + i*h, 7*d + i*h - 2*h)));
    const res = await p.evaluate(async ([f, metas, at]) => {
      const byName = Object.fromEntries(metas.map(m => [m.name, m]));
      window.gh = async path => {
        if (/^\/users\/[^/]+$/.test(path)) return {json: {login: 'big', type: 'User', avatar_url: '', public_repos: metas.length}, link: ''};
        if (/\/repos\?/.test(path)) return {json: /page=1\b/.test(path) ? metas : [], link: ''};
        const m = path.match(/^\/repos\/[^/]+\/([^/]+)\/commits/); if (m) { const r = byName[m[1]];
          return {json: [r.pushed_at, r.created_at].map(t => ({commit: {message: 'work', committer: {date: t}, author: {name: 'x', date: t}}})), link: ''}; }
        if (/\/git\/trees\//.test(path)) return {json: {tree: [], truncated: false}, link: ''};
        return null; };
      window.raw = async () => '';
      DATA.suspects.fresh = f; DATA.suspects.big = await loadSuspect('big', null, true);
      const t = n => { render(n); return document.querySelector('.poster').innerText.replace(/\s+/g, ' '); };
      return [t('fresh'), t('big')]; }, [fresh, metas]);
    const check = (ok, why) => { checked++; if (!ok) { fails++; console.log('FAIL poster: ' + why + '\n  ' + res.join('\n  ')); } };
    check(/PERSON OF INTEREST/.test(res[0]) && /NEXT LIKELY VICTIM beta/i.test(res[0]), 'a clean record names the next likely victim');
    check(!/over a year/.test(res.join(' ')), 'no "untouched for over a year" on a young account');
    check(!/\b3 public projects?\b/.test(res[0]) || /3 STILL BREATHING/i.test(res[0]), 'clean record counts agree');
    check(/\b7\b PROJECT DEATHS · 4 STILL BREATHING/i.test(res[1]), 'an 11-project account counts quick deaths, not only year-old ones');
  }
  // 11-13 polish: the page fits a phone, the hero steps aside for a case, and "tomorrow" doesn't turn the page into a row
  {
    const check = (ok, why) => { checked++; if (!ok) { fails++; console.log('FAIL layout: ' + why); } };
    const m = await b.newPage({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
    await m.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
    await m.goto('file://' + page);
    const wide = () => m.evaluate(() => document.documentElement.scrollWidth);
    check(await wide() <= 390, 'front page is wider than a phone');
    // Google Search Console checks this tag to keep the site verified; dropping it unverifies the site
    check(await m.evaluate(() => (document.querySelector('meta[name="google-site-verification"]') || {}).content === 'HR18TJ5FgrVK-AMp0a-dwnOg-Um8gQ7yWV6TlCtZwtY'), 'the Google Search Console verification tag is missing');
    await m.evaluate(f => { DATA.suspects.connabyss = f; render('connabyss'); }, fixtures.find(f => f.user === 'connabyss'));
    check(await m.evaluate(() => getComputedStyle(document.querySelector('.evidence')).display === 'none'), 'the hero evidence still shows over an open case');
    check(await wide() <= 390, 'case page is wider than a phone');
    await m.evaluate(() => { court('connabyss', [{repo: {name: 'x', commits: [1]}, born: {date: '2026-01-01T00:00:00Z'}}], [], document.getElementById('out')); document.querySelector('[data-plea="tomorrow"]').click(); });
    check(await m.evaluate(() => document.body.classList.contains('reopen') && getComputedStyle(document.body).display === 'block'), '"tomorrow" changed the page layout (body.reopen picked up p.reopen styles)');
    await m.close();
  }
  await b.close();
  console.log(fails ? `${fails} problem(s) in ${checked} cases` : `ok: ${checked} cases`);
  process.exit(fails ? 1 : 0);
})();
