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
    }
  }
  await b.close();
  console.log(fails ? `${fails} problem(s) in ${checked} cases` : `ok: ${checked} cases`);
  process.exit(fails ? 1 : 0);
})();
