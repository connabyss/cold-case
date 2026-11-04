// ===== Clue library: keyword families, each with its own deadpan lines =====
// Each rule: id, score, where it looks, a test that returns a match, and 1-3 lines.
// A repo always gets the same line for a rule (picked by a hash of its name), so a share is stable.
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (k, w) => `${k} ${w}${k===1?'':'s'}`;
function hash(s){ let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const localDay = iso => { const [y,m,d] = iso.slice(0,10).split('-').map(Number); return new Date(Date.UTC(y,m-1,d)); };
const words = s => s.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]/g,' ');
function readmeLines(r){ return r.readme_head.split('\n').map(s=>s.replace(/^[#>*\s-]+/,'').replace(/[*_`]/g,'').trim()).filter(s=>s && !/^!\[|^<|^\[!|^---|^license:/i.test(s)); }
function opener(r){ const ls = readmeLines(r).map(l=>l.replace(/\[([^\]]*)\]\([^)]*\)/g,'$1'));
  const body = ls.find((l,i)=> i>0 || ls.length===1) || ''; let s = body.split(/(?<=[.!?。])\s/)[0]||'';
  if (s.length > 120) s = s.slice(0,120).replace(/\s+\S*$/,'') + '…'; return s; }
const LAZY = /^(update|updates|updated|changes|change|stuff|wip|asdf+|test|testing|ok|\.+|minor|commit|save|done|idk|lol|-|x+|a+|new|upload|edit|edits|code|files|more)$/i;

const LIB = [
  // ---- what the README and description promised ----
  {id:'forever', score:10, on:'claim', re:/\b(forever|never dies?|don't stay dead|stays? alive|immortal|eternal|built to last|survives?)\b/i,
   lines:[(x,m)=>`It promised ${q(m[0])}. It lasted ${span(x.life)}.`, (x,m)=>`${q(cap(m[0]))}, said the README. ${span(x.life)}, said the commit log.`]},
  {id:'active', score:12, on:'claim', re:/(under|in) (active|heavy|constant|continuous) development|actively (maintained|developed)|regularly updated|updated (daily|weekly|regularly)|more (features )?(coming|to come)/i,
   lines:[(x,m)=>`The README says ${q(m[0])}. The last commit was ${span(x.quiet)} ago.`, (x,m)=>`${q(cap(m[0]))}. Last sign of development: ${span(x.quiet)} ago.`]},
  {id:'soon', score:8, on:'readme', re:/[^\n]*(coming soon|stay tuned|work in progress|\bwip\b|roadmap|to be continued|more to come)[^\n]*/i,
   lines:[(x,m)=>`The README promised ${q(m[0].replace(/\[[ x]\]|[#*>`|-]/g,' ').replace(/\s+/g,' ').trim().slice(0,90))}. That was ${span(x.quiet)} ago.`, (x,m)=>`${q(cap(m[1].toLowerCase()))}, it said. ${span(x.quiet)} later, still coming.`]},
  {id:'later', score:12, on:'readme', re:/[^\n.]*(will be (uploaded|released|available|added|published|open[- ]sourced)|(code|model|dataset)s? (is |are )?coming|to be released|release (the )?code (soon|after|once))[^\n.]*/i,
   lines:[(x,m)=>`The README says ${q(m[0].replace(/[#*>`]/g,'').trim().slice(0,120))}. It's been ${span(x.quiet)}.`]},
  {id:'fast', score:9, on:'claim', re:/blazing(ly)?[- ]fast|lightning[- ]fast|super[- ]fast|ultra[- ]fast|high[- ]performance|insanely fast/i,
   lines:[(x,m)=>`Described as ${q(m[0].toLowerCase())}. It was: dead in ${span(x.life)}.`, (x,m)=>`${q(cap(m[0].toLowerCase()))}. Last commit ${span(x.quiet)} ago.`]},
  {id:'all', score:8, on:'claim', re:/all[- ]in[- ]one|the ultimate|everything you need|one[- ]stop|fully[- ]featured|comprehensive|fully functional|full[- ]stack/i,
   lines:[(x,m)=>`It promised to be ${q(m[0].toLowerCase())}. It managed ${plural(x.total,'commit')}.`, (x,m)=>`${q(cap(m[0].toLowerCase()))}. Total body: ${plural(x.files,'file')}.`]},
  {id:'prod', score:8, on:'claim', re:/production[- ]ready|enterprise[- ]grade|battle[- ]tested|at scale|highly scalable|\brobust\b/i,
   lines:[(x,m)=>`It called itself ${m[0].toLowerCase()}. Stars: ${x.r.stars}. Production is still waiting.`, (x,m)=>`It called itself ${m[0].toLowerCase()}. It didn't survive ${span(x.quiet)} of nothing.`]},
  {id:'future', score:7, on:'claim', re:/next[- ]gen(eration)?|revolutionary|game[- ]changing|cutting[- ]edge|state[- ]of[- ]the[- ]art|the future of/i,
   lines:[(x,m)=>`${q(cap(m[0].toLowerCase()))}. The future stopped arriving ${span(x.quiet)} ago.`, (x,m)=>`It called itself ${q(m[0].toLowerCase())}. It is now ${span(x.quiet)} out of date.`]},
  {id:'simple', score:5, on:'claim', re:/\b(an?|the) (simple|easy|effortless|lightweight|minimal(ist)?|tiny)\b/i,
   lines:[(x,m)=>`It called itself ${m[2].toLowerCase()}. Leaving it was even easier.`, (x,m)=>`It called itself ${m[2].toLowerCase()}. So was walking away.`]},
  {id:'award', score:7, on:'claim', re:/\b(1st|first|2nd|second|3rd|third)[- ]place\b|\bwinning solution\b|\baccepted (by|at|to) [A-Z][\w ]{1,20}/i,
   lines:[(x,m)=>`It won ${m[0].toLowerCase()}. Its last commit was ${span(x.quiet)} ago.`, (x,m)=>`It won ${m[0].toLowerCase()}. Its reward: ${span(x.quiet)} alone.`]},
  {id:'paper', score:6, on:'claim', re:/official (pytorch |tensorflow )?(implementation|code)|code for (the|our) paper|code for the work presented|supplementary (data and )?code/i,
   lines:[x=>`The official code for a paper. The paper got published. The code got left.`, x=>`It existed so a paper could cite it. The citation is still alive.`]},
  {id:'clone', score:10, on:'title', re:/([A-Za-z0-9.]+)[\s_-]?clone\b/i,
   lines:[(x,m)=>`A ${m[1]} clone. ${m[1]} is doing fine.`, (x,m)=>`It set out to copy ${m[1]}. ${m[1]} never noticed.`]},
  {id:'todo', score:10, on:'title', re:/\bto[- ]?do (app|list)\b|\btodo ?app\b/i,
   lines:[x=>`A to-do app. Finishing it is still on someone's list.`, x=>`A to-do app with one item left: itself.`]},
  {id:'portfolio', score:7, on:'title', re:/\bportfolio\b|personal (web)?site|personal blog/i,
   lines:[x=>`A personal portfolio. The person moved on ${span(x.quiet)} ago.`, x=>`It showed off its owner's work. The work stopped ${span(x.quiet)} ago.`]},
  {id:'weather', score:9, on:'title', re:/\bweather\b/i, lines:[x=>`A weather app. Current conditions: no commits for ${span(x.quiet)}.`]},
  {id:'calc', score:9, on:'title', re:/\bcalculator\b/i, lines:[x=>`A calculator. Final count: ${plural(x.total,'commit')}.`]},
  {id:'game', score:8, on:'head', re:/\b(game|2048|tetris|snake|chess|tic[- ]?tac[- ]?toe|pong|sudoku|platformer)\b/i,
   lines:[x=>`A game. Game over after ${plural(x.total,'commit')}.`, x=>`A game. Nobody pressed continue.`]},
  {id:'landing', score:9, on:'title', re:/\blanding[- ]page\b/i, lines:[x=>`A landing page. Nobody landed.`]},
  {id:'shop', score:5, on:'title', re:/e-?commerce|online (store|shop)|\bshop(ping)? (app|site|cart)\b/i, lines:[x=>`An online store. Closed ${span(x.quiet)} ago. No sign on the door.`]},
  {id:'bot', score:5, on:'title', re:/\b(discord|telegram|whatsapp|slack|twitter) ?bot\b/i, lines:[(x,m)=>`A ${m[1]} bot. Even the bot gave up ${span(x.quiet)} ago.`]},
  {id:'hack', score:6, on:'claim', re:/\bhackathon\b|\bgame ?jam\b/i, lines:[(x,m)=>`Built for a ${m[0].toLowerCase()}. The ${m[0].toLowerCase()} ended. So did this.`]},
  {id:'awesome', score:7, on:'name', re:/^awesome/i, lines:[x=>`An awesome list. The last awesome thing was added ${span(x.quiet)} ago.`]},
  {id:'learn', score:4, on:'head', re:/\b(practice|tutorial|bootcamp|homework|assignment|exercises|my first|learn(ing)? (javascript|python|react|java|c\+\+|rust|go|to code|web))\b/i,
   lines:[x=>`A learning project. Lesson learned in ${span(x.life)}.`, x=>`It was practice. Practice ended ${span(x.quiet)} ago.`]},
  {id:'ai', score:3, on:'title', re:/\b(ai|gpt|llm|chatbot|agentic|rag|langchain|gemini|openai)\b/i,
   lines:[x=>`It was powered by AI. Then by nobody.`, x=>`An AI project. The humans stopped committing ${span(x.quiet)} ago.`]},
  // ---- the README itself ----
  {id:'template', score:10, on:'readme', re:/This project was bootstrapped with|Getting Started with Create React App|A new Flutter project|This template (should help|provides a minimal setup)|^#+ ?Project Title|create-next-app|Welcome to your new/im,
   lines:[x=>`Its README is still the template. It never introduced itself.`, x=>`Its README was written by a setup tool, not by its owner.`]},
  {id:'tinyreadme', score:10, test:x=>{ const t = readmeLines(x.r).join(' '); return x.r.readme_words>0 && x.r.readme_words<=4 && t && [t]; },
   lines:[(x,m)=>{ const t = m[0].replace(/\s+/g,' ').trim(); return /^(\S ){3,}\S$/.test(t) ? `Its entire README: ${q(t.replace(/ /g,''))}, typed with a space between every letter.` : `Its entire README: ${q(t)}.`; }]},
  {id:'noreadme', score:5, test:x=> x.r.readme_words===0 && [1], lines:[x=>`No README. It died without a name tag.`]},
  // ---- what the commits said ----
  {id:'commitmsg', score:12, test:x=> x.n>1 && x.cs.find(c=>c.msg.trim() && /^(commit message|message|commit|no message|\.)$/i.test(c.msg.trim())),
   lines:[(x,c)=>`One of its commit messages is, word for word, ${q(c.msg)}.`]},
  {id:'emptymsg', score:11, test:x=> x.n>1 && x.cs.find(c=>!c.msg.trim()), lines:[x=>`One of its commit messages is completely empty. It had nothing left to say.`]},
  {id:'readmespam', score:10, test:x=>{ const k = x.cs.filter(c=>/^(update|create|edit) readme(\.md)?$/i.test(c.msg.trim())).length; return k>=3 && k/x.n>=.3 && [k]; },
   lines:[(x,m)=>`${m[0]} of its ${x.total > x.n ? 'last ' + x.n : x.n} commits are GitHub's default ${q('Update README.md')}.`, (x,m)=>`${m[0]} commits say ${q('Update README.md')}. It kept polishing the headstone.`]},
  {id:'upload', score:7, test:x=>{ const k = x.cs.filter(c=>/^add files via upload$/i.test(c.msg.trim())).length; return k>=2 && [k]; },
   lines:[(x,m)=>`${m[0]} commits say ${q('Add files via upload')}. It was dragged in through the browser, one armful at a time.`]},
  {id:'final', score:10, test:x=>{ const i = x.cs.findIndex(c=>/^(final|finally|done|finished|complete|last commit|final (commit|version|fix|push|update|touches))\b[.!]*$/i.test(c.msg.trim()) || /\bfinal (commit|version)\b/i.test(c.msg)); return i>=0 && [i]; },
   lines:[(x,m)=>{ const c = x.cs[m[0]], after = x.n-1-m[0]; return after ? `A commit called ${q(c.msg)}. ${plural(after,'more commit')} came after it.` : `Its last commit is called ${q(c.msg)}. It meant it.`; }]},
  {id:'beg', score:10, test:x=> x.cs.find(c=>!/^merge/i.test(c.msg) && /please work|pls work|plz work|hope (this|it) works|why (is|does|won't)|\bwtf\b|\bugh\b|i give up|giving up|doesn'?t work|not working|still broken|help me/i.test(c.msg)),
   lines:[(x,c)=>`From the commit log, ${clock(c.date).day}: ${q(c.msg)}.`, (x,c)=>`Exhibit A, a commit message: ${q(c.msg)}.`]},
  {id:'works', score:8, test:x=> x.cs.find(c=>/\b(it works|works now|finally work(s|ing)|working now|now works)\b/i.test(c.msg)),
   lines:[(x,c)=>`${q(cap(c.msg))}, it said. Then nobody came back to use it.`]},
  {id:'oops', score:5, test:x=>{ const k = x.cs.filter(c=>/\b(oops|whoops|typo|my bad|sorry)\b/i.test(c.msg)).length; return k>=2 && [k]; },
   lines:[(x,m)=>`It apologized to itself ${m[0]} times (“oops”, “typo”).`]},
  {id:'revert', score:6, test:x=>{ const k = x.cs.filter(c=>/^revert/i.test(c.msg)).length; return k>=2 && [k]; },
   lines:[(x,m)=>`It reverted itself ${m[0]} times. Then it stopped arguing.`]},
  {id:'version', score:7, test:x=>{ const vs = x.cs.map(c=>!/ from \S+ to /i.test(c.msg) && /^(v|version|release|bump|bumping)\b|^v?\d+\.\d+\.\d+/i.test(c.msg.trim()) && [...c.msg.matchAll(/\bv?(\d+)\.(\d+)\.(\d+)\b/g)].pop()).filter(Boolean); if (vs.length<3) return false;
      const top = vs.map(v=>[+v[1],+v[2],+v[3]]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]||b[2]-a[2])[0]; return [top, vs.length]; },
   lines:[(x,m)=>`It shipped ${m[1]} versions, up to ${m[0].join('.')}. Version ${m[0][0]}.${m[0][1]}.${m[0][2]+1} never came.`]},
  {id:'lazy', score:7, test:x=>{ const lz = x.cs.filter(c=>LAZY.test(c.msg.trim())); return x.n>=5 && lz.length/x.n>=.6 && [lz.length]; },
   lines:[(x,m)=>`${m[0]} of its ${x.total > x.n ? 'last ' + x.n : x.n} commits are one word long. It never explained itself.`]},
  {id:'deadratio', score:11, test:x=>{ const r = x.quiet / x.life; return x.n>1 && x.life >= 60e3 && r >= 50 && [Math.round(r)]; },
   lines:[(x,m)=>`It was alive for ${span(x.life)}. It has now been dead ${m[0].toLocaleString()} times longer.`, (x,m)=>`Alive: ${span(x.life)}. Dead: ${m[0].toLocaleString()} times that, and counting.`]},
  {id:'burst', score:9, test:x=> x.n>=5 && x.life < 3*H && x.life > 0 && [1],
   lines:[x=>`${x.n} commits in ${span(x.life)}. One every ${span(x.life/(x.n-1))}. Then none, ever.`]},
  // ---- when it happened ----
  {id:'newyear', score:9, test:x=>{ const d = x.born.date.slice(5,10); return (d==='01-01'||d==='12-31') && [d]; },
   lines:[x=>`Started on New Year's. A resolution. It lasted ${span(x.life)}.`]},
  {id:'valentine', score:8, test:x=> x.born.date.slice(5,10)==='02-14' && [1], lines:[x=>`Started on Valentine's Day. It lasted ${span(x.life)}.`]},
  {id:'weekend', score:7, test:x=>{ const a = localDay(x.born.date).getUTCDay(), b = localDay(x.died.date).getUTCDay(); return !clock(x.born.date).utc && x.life < 3*D && x.n>=3 && (a===6||a===0) && (b===6||b===0) && [a,b]; },
   lines:[(x,m)=> m[0]===m[1] ? `Born and buried on the same ${DAYS[m[0]]}. A weekend project, to the letter.` : `Born on a ${DAYS[m[0]]}, dead by ${DAYS[m[1]]}. A weekend project, to the letter.`]},
  // ---- the body ----
  {id:'fewfiles', score:5, test:x=> x.r.files<=2 && x.r.readme_words>0 && [x.r.files], lines:[(x,m)=>`The body: ${plural(m[0],'file')}. One of them is the README.`]},
];

function runLib(r, cs, ctx){
  const x = {r, cs, ...ctx, files: r.files};
  const first2 = readmeLines(r).slice(0,2).join(' ');
  const src = { claim: [r.desc, first2].join('\n'), title: [r.name, words(r.name), r.desc, readmeLines(r)[0]||''].join('\n'), head: [words(r.name), readmeLines(r)[0]||''].join('\n'), readme: r.readme_head, name: r.name };
  const out = [];
  for (const rule of LIB) {
    const m = rule.test ? rule.test(x) : (src[rule.on].match(rule.re));
    if (!m) continue;
    const line = rule.lines[hash(r.name + rule.id) % rule.lines.length];
    out.push({id: rule.id, text: line(x, m), score: rule.score});
  }
  // every repo gets at least its own opening line held up against how it ended
  const op = opener(r);
  const english = new Set((op.toLowerCase().match(/\b(the|and|to|of|is|for|with|your|this|that|you|it|on|in|my|an)\b/g)||[])).size >= 2 && !/[\u0400-\u04ff\u0600-\u06ff\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/.test(op);
  if (op && op.length > 12 && english && !out.some(o => o.text.includes(q(op))))
    out.push({id:'opener', text: x.n > 1 && x.life >= 7*D && x.life < 60*D ? `Its README opens: ${q(op)}. It lasted ${span(x.life)}.` : `Its README opens: ${q(op)}. Nobody has touched it in ${span(x.quiet)}.`, score: 2});
  return out;
}
