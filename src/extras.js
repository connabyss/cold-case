// ===== Witnesses, funerals, the profile, the detective, the court =====
// Every line below is triggered by a real fact; nothing is invented about the person.

// One witness per case: the files at the scene give a statement.
function witness(c, all){
  const r = c.repo, w = r.w || {}, out = [];
  const say = (who, text, score) => out.push({who, text, score});
  if (w.gitignore === false && w.n_files > 3) say('.gitignore', `Missing. Nothing was ever ignored, except the project.`, 9);
  if (w.todos >= 2) say('The TODO notes', `There are ${w.todos} of them in the code. They are all still to do.`, 9);
  if (w.todos === 1) say('The TODO note', `There is one, in the code. It is still to do.`, 7);
  if (w.license && r.stars === 0 && r.forks === 0) say(w.license.split('/').pop(), `It gave everyone on Earth permission to use this. Nobody did.`, 9);
  if (w.deps >= 3) say('The dependency list', `It names ${w.deps} packages. None of them came to the funeral.`, 8);
  if (w.empty_files && w.empty_files.length) say(w.empty_files[0].split('/').pop(), `0 bytes. It never said a word.`, 8);
  if (w.ds_store) say('.DS_Store', `It came over from a Mac. It has no idea what happened.`, 8);
  if (w.tests === 0 && r.code_words > 200) say('The tests', `There were none. Nobody was there to notice it stop.`, 6);
  if (w.biggest && w.biggest[0] >= 150) say(w.biggest[1].split('/').pop(), `The biggest file, ${w.biggest[0].toLocaleString()} lines. It carried the whole thing alone.`, 5);
  if (w.gitignore) say('.gitignore', `It saw everything. It was told to ignore it.`, 4);
  if (w.license) say(w.license.split('/').pop(), `Declined to comment.`, 3);
  say('README', `Still standing at the scene. It keeps telling people what the project does.`, 1);
  out.sort((a,b)=>b.score-a.score);
  return all ? out : out[0];
}

// One funeral line per case.
function funerals(c){
  const r = c.repo, f = r.forks, s = r.stars;
  if (f >= 2) return [`Survived by ${f} forks. In lieu of flowers, the family asks for stars.`, `Survived by ${f} forks, none of whom have called.`];
  if (f === 1) return [`Survived by one fork, who has not been seen since.`, `One fork survives it. It doesn't talk about what happened.`];
  if (s >= 2) return [`${s} people starred it. None came to the service.`, `${s} stars on the headstone. No visitors.`];
  return [`No survivors. Not even a fork.`, `The service was small. Nobody came.`, `Buried in an unmarked repo.`, s === 0 ? `No flowers. No forks. No stars.` : `One star. One mourner. Probably the owner.`];
}
function funeral(c){ const v = funerals(c); return v[hash(c.repo.name + 'fun') % v.length]; }

// Page-level variety: the same joke twice in a row stops being a joke.
const ckey = t => t.replace(/<[^>]+>/g,'').replace(/“[^”]*”/g,'Q').replace(/\d[\d:,.]*\s?(AM|PM)?/g,'#').slice(0,22);
function vary(cases){
  const seen = {}, wseen = {}, fseen = {}, rseen = {}; let prevRuling = '';
  for (const c of cases) {
    if (c.rulings) { // least-used wording, never the same as the case before
      const opts = c.rulings.filter(r => r !== prevRuling);
      c.ruling = opts.slice().sort((a,b) => (rseen[a]||0) - (rseen[b]||0))[0] || c.ruling; rseen[c.ruling] = (rseen[c.ruling]||0) + 1; }
    prevRuling = c.ruling;
    if (c.all) {
      let pool = c.all.map(x => ({...x, adj: x.score - 5*(seen[ckey(x.text)]||0)}));
      const fresh = pool.filter(x => (seen[ckey(x.text)]||0) < 2); if (fresh.length >= 2) pool = fresh;
      const lifeTxt = span(c.life);
      if (pool.some(x => !x.text.startsWith('The victim lived') && x.text.includes(lifeTxt))) pool = pool.filter(x => !x.text.startsWith('The victim lived'));
      const picked = pool.sort((a,b)=>b.adj-a.adj).slice(0,4);
      picked.sort((a,b)=>b.score-a.score); c.clues = picked;
      picked.forEach(x => seen[ckey(x.text)] = (seen[ckey(x.text)]||0) + 1);
    }
    const ws = witness(c, true).map(w => ({...w, adj: w.score - 6*(wseen[ckey(w.text)]||0)})).sort((a,b)=>b.adj-a.adj);
    c.wit = ws[0]; const wk = ckey(c.wit.text); wseen[wk] = (wseen[wk]||0) + 1;
    const fs = funerals(c), start = hash(c.repo.name + 'fun') % fs.length;
    const rot = fs.map((_,i)=>fs[(start+i)%fs.length]);
    c.fun = rot.find(t => !fseen[ckey(t)]) || rot[0]; fseen[ckey(c.fun)] = 1;
    if (fs.every(t => fseen[ckey(t)])) fs.forEach(t => delete fseen[ckey(t)]);
  }
}

// The serial-killer profile: patterns across every dead project of one owner.
function profile(dead){
  const k = dead.length; if (!k) return [];
  const mo = [];
  const lives = dead.map(c=>c.life).sort((a,b)=>a-b), med = lives[Math.floor(k/2)];
  const days = dead.filter(c => !clock(c.born.date).utc).map(c => localDay(c.born.date).getUTCDay());
  const dayTop = [0,1,2,3,4,5,6].map(d=>[d, days.filter(x=>x===d).length]).sort((a,b)=>b[1]-a[1])[0];
  const hours = dead.map(c => clock(c.born.date)).filter(x=>!x.utc).map(x=>x.hour);
  const nightK = hours.filter(h => h >= 21 || h < 5).length;
  const firsts = dead.filter(c => c.repo.commits.some(x => FIRST.test(x.msg.trim()))).length;
  const noTests = dead.filter(c => c.repo.w && c.repo.w.tests === 0).length;
  const readmeLast = dead.filter(c => /readme/i.test(c.died.msg)).length;
  const lasts = {}; dead.forEach(c => { lasts[c.died.msg] = (lasts[c.died.msg]||0)+1; });
  const sig = Object.entries(lasts).sort((a,b)=>b[1]-a[1])[0];
  const one = k === 1;
  if (one) mo.push(`First known victim. Lived ${span(med)}.`);
  else mo.push(`Victims usually last ${span(med)}.`);
  if (!one && dayTop[1] >= 2 && dayTop[1]/k >= .4) mo.push(`Strikes on ${DAYS[dayTop[0]]}s. ${dayTop[1]} of ${k} victims were born on one.`);
  if (!one && sig && sig[1] >= 2) mo.push(`Signature: the last words are usually ${q(sig[0])}.`);
  else if (readmeLast/k >= .5) mo.push(one ? `Left a README edit as its last act.` : `Always finishes by editing the README. Then leaves.`);
  if (!one && firsts/k >= .6) mo.push(`Always says “first commit.” Rarely says a second.`);
  if (noTests === k && k >= 2) mo.push(`Never leaves tests behind. No witnesses.`);
  const abandoned = dead.reduce((s,c)=>s+c.repo.commits.length,0);
  mo.push(`Total commits left at the scenes: ${abandoned.toLocaleString()}.`);
  return mo.slice(0,5);
}

// The detective's thoughts: at most two per page, each triggered by a fact.
function thoughts(dead){
  const out = [];
  const sat = dead.find(c => [0,6].includes(localDay(c.born.date).getUTCDay()));
  const night = dead.find(c => { const k = clock(c.born.date); return !k.utc && (k.hour >= 23 || k.hour < 4); });
  const fast = dead.find(c => c.life < H && c.repo.commits.length > 1);
  if (fast) out.push({at: dead.indexOf(fast), text: `${span(fast.life)}. I've had coffee go cold slower than that.`});
  const wk = dead.filter(c => [0,6].includes(localDay(c.born.date).getUTCDay())).length;
  if (sat && (dead.length === 1 || wk/dead.length >= .5) && out.length < 2 && !out.some(o=>o.at===dead.indexOf(sat))) out.push({at: dead.indexOf(sat), text: `It was a ${DAYS[localDay(sat.born.date).getUTCDay()]}. They always start on a weekend.`});
  if (out.length < 2 && dead.length >= 3) out.push({at: dead.length-1, text: `${dead.length} files on my desk. Same handwriting on every one.`});
  return out.slice(0,2);
}
