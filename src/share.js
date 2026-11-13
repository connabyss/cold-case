// ===== Share card: the owner's stamped WANTED poster as a 1200x630 image =====
// Made to be posted: the count is the headline, the court's stamps land where they don't hide words,
// and the bottom tells whoever sees it where to go to get their own.
const SITE = 'connabyss.github.io/cold-case';
function cardHash(s){ let h = 2166136261; for (const ch of String(s).toLowerCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function cardStamps(){ return [...document.querySelectorAll('.poster .bigstamp')].map(e => e.textContent); }
async function shareCard(s, name, deadN, aliveN, mo){
  try { await Promise.all(['700 80px "Oswald"','600 20px "Oswald"','400 20px "Courier Prime"','700 20px "Courier Prime"','italic 400 20px "Courier Prime"'].map(f => document.fonts.load(f))); } catch(e) {}
  const W = 1200, Hh = 630, cv = document.createElement('canvas'); cv.width = W*2; cv.height = Hh*2;
  const g = cv.getContext('2d'); g.scale(2,2);
  const DISP = '"Oswald", Impact, sans-serif', TYPE = '"Courier Prime", "Courier New", monospace';
  const INK = '#2a2118', SOFT = '#6b5a40', RED = '#a8261d', PAPER = '#dccca5', TAPE = '#e8c23a';
  // the same suspect always gets the same case number and the same specks of dirt
  const seed = cardHash(name); let r = seed || 1; const rnd = () => (r = Math.imul(r ^ (r >>> 15), 2246822519) ^ Math.imul(r ^ (r >>> 13), 3266489917), ((r >>>= 0) % 10000) / 10000);
  const caseNo = `CASE NO. ${String(seed % 9000 + 1000)}-${'ABCDEFGHJKLMNPQRSTUVWXYZ'[seed % 24]}`;
  const fit = (t, max) => { if (g.measureText(t).width <= max) return t; while (t.length > 4 && g.measureText(t + '…').width > max) t = t.slice(0, -1); return t.trimEnd() + '…'; };
  const wrap = (t, max, lines) => { const out = []; let cur = '';
    for (const w of t.split(/\s+/)) { const next = cur ? cur + ' ' + w : w; if (g.measureText(next).width <= max || !cur) cur = next; else { out.push(cur); cur = w; } }
    if (cur) out.push(cur); if (out.length > lines) { out.length = lines; out[lines-1] = fit(out[lines-1] + ' …', max); } return out.map(l => fit(l, max)); };

  // the desk at night
  g.fillStyle = '#0d0f14'; g.fillRect(0,0,W,Hh);
  // the poster, pinned slightly crooked
  const px = 48, py = 40, pw = W-96, ph = 492;
  g.save(); g.translate(W/2, py+ph/2); g.rotate(-.008); g.translate(-W/2, -(py+ph/2));
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fillStyle = PAPER; g.fillRect(px,py,pw,ph); g.shadowColor = 'transparent';
  // old paper: darker edges, specks, a fold down the middle
  const vg = g.createRadialGradient(W/2, py+ph/2, 200, W/2, py+ph/2, 700); vg.addColorStop(0, 'rgba(120,90,40,0)'); vg.addColorStop(1, 'rgba(120,90,40,.28)');
  g.fillStyle = vg; g.fillRect(px,py,pw,ph);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(60,40,20,${.04 + rnd()*.1})`; g.fillRect(px + rnd()*pw, py + rnd()*ph, 1 + rnd()*2, 1 + rnd()*2); }
  g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(px, py+ph/2, pw, 2); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(px, py+ph/2+2, pw, 1);
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(px+12,py+12,pw-24,ph-24); g.lineWidth = 1; g.strokeRect(px+18,py+18,pw-36,ph-36);

  // left: the mugshot against a height chart
  const mx = px+46, my = py+50, ms = 236;
  g.fillStyle = '#c6b48a'; g.fillRect(mx, my, ms, ms);
  if (s.avatar) { const img = new Image(); img.crossOrigin = 'anonymous'; img.src = s.avatar; await img.decode().catch(()=>{});
    if (img.naturalWidth) { g.save(); g.filter = 'grayscale(1) contrast(1.2) sepia(.15)'; g.drawImage(img, mx, my, ms, ms); g.restore(); } }
  if (!s.avatar) { g.fillStyle = '#6b5a40'; g.font = `700 140px ${DISP}`; g.textAlign = 'center'; g.fillText('?', mx+ms/2, my+ms/2+50); }
  g.save(); g.globalAlpha = .55; g.strokeStyle = '#111'; g.fillStyle = '#111'; g.font = `700 11px ${TYPE}`; g.textAlign = 'left'; g.lineWidth = 1;
  for (let i = 1; i < 6; i++) { const y = my + i*ms/6; g.beginPath(); g.moveTo(mx, y); g.lineTo(mx + (i%2 ? 14 : 24), y); g.stroke(); g.fillText(`${7-i}'`, mx+28, y+4); }
  g.restore();
  g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(mx,my,ms,ms);
  // the name board they hold up
  g.fillStyle = INK; g.fillRect(mx, my+ms+10, ms, 58); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = PAPER; let nf = 26; g.font = `700 ${nf}px ${TYPE}`; while (g.measureText(name.toUpperCase()).width > ms-20 && nf > 13) g.font = `700 ${--nf}px ${TYPE}`;
  g.fillText(fit(name.toUpperCase(), ms-20), mx+ms/2, my+ms+40); g.font = `400 12px ${TYPE}`; g.fillStyle = '#b9a77e'; g.fillText(caseNo, mx+ms/2, my+ms+60);
  g.fillStyle = SOFT; g.font = `400 13px ${TYPE}`; g.fillText('LAST SEEN: AT THE KEYBOARD', mx+ms/2, my+ms+92);

  // right: the charge
  const cx = mx+ms+44, cw = px+pw-46 - cx; g.textAlign = 'left';
  g.fillStyle = INK; g.font = `700 104px ${DISP}`; g.fillText('WANTED', cx-4, py+128);
  const wW = g.measureText('WANTED').width;
  g.font = `700 20px ${DISP}`; g.fillStyle = SOFT; g.fillText('FOR THE ABANDONMENT OF', cx + wW + 18, py+92);
  g.fillText(deadN ? 'PUBLIC PROJECTS ON GITHUB' : 'NOTHING. YET.', cx + wW + 18, py+118);
  g.fillStyle = INK; g.fillRect(cx, py+146, cw, 3);
  // the count is the headline
  const unit = deadN === 1 ? 'PROJECT' : 'PROJECTS';
  const numTxt = deadN ? deadN.toLocaleString() : 'ZERO';
  let nsz = 120; g.font = `700 ${nsz}px ${DISP}`;
  const unitW = () => { g.font = `700 ${Math.round(nsz*.42)}px ${DISP}`; const w = g.measureText(unit).width; g.font = `700 ${nsz}px ${DISP}`; return w; };
  while (g.measureText(numTxt).width + 20 + unitW() > cw - 150 && nsz > 60) { nsz -= 4; g.font = `700 ${nsz}px ${DISP}`; }
  const ny = py+150+nsz*.92;
  g.fillStyle = RED; g.fillText(numTxt, cx-4, ny); const nW = g.measureText(numTxt).width;
  g.font = `700 ${Math.round(nsz*.42)}px ${DISP}`; g.fillText(deadN ? unit : 'BODIES', cx + nW + 14, ny - nsz*.36);
  g.fillStyle = SOFT; g.font = `600 ${Math.round(nsz*.22)}px ${DISP}`;
  g.fillText(deadN ? 'LEFT FOR DEAD' : 'SUSPICIOUSLY CLEAN', cx + nW + 16, ny);
  g.font = `italic 400 17px ${TYPE}`; g.fillStyle = SOFT;
  g.fillText(aliveN ? `${aliveN.toLocaleString()} still breathing. For now.` : deadN ? 'None left breathing.' : 'The unit will keep an eye on this one.', cx, ny + 30);
  // the evidence, wrapped, never cut mid-word
  const live = cardStamps(), guilty = live.includes('GUILTY');
  g.font = `400 18px ${TYPE}`; g.fillStyle = INK; let ly = ny + 66; const lh = 25, maxY = py+ph-82, tw = cw - 20 - (guilty ? 250 : 0);
  // the big number already says the body count, so the lines under it carry the evidence
  const ev = mo.filter(l => !/^Body count|^No bodies found/.test(l)); const evid = ev.filter(l => /^Exhibit/.test(l)).concat(ev.filter(l => !/^Exhibit/.test(l)));
  for (const line of evid.slice(0, 3)) { let ls = wrap(line, tw, /^Exhibit/.test(line) ? 3 : 2);
    if (ly + (ls.length-1)*lh > maxY) { if (!/^Exhibit/.test(line)) continue; while (ls.length > 1 && ly + (ls.length-1)*lh > maxY) ls = wrap(line, tw, ls.length - 1); }
    if (ly > maxY) break;
    g.fillStyle = RED; g.fillText('▪', cx, ly); g.fillStyle = INK; ls.forEach((l, i) => g.fillText(l, cx + 20, ly + i*lh)); ly += ls.length*lh + 8; }
  // the reward strip along the bottom
  g.fillStyle = INK; g.fillRect(px+30, py+ph-62, pw-60, 2);
  g.font = `700 15px ${TYPE}`; g.fillStyle = INK; g.textAlign = 'left';
  g.fillText('REWARD: ONE (1) COMMIT. NO QUESTIONS ASKED.', px+40, py+ph-36);
  g.textAlign = 'right'; g.fillStyle = RED; g.fillText('CAUTION: MAY START ANOTHER PROJECT', px+pw-40, py+ph-36);

  // the court's stamps, each in a spot where it covers no words
  const stamp = (word, x, y, rot, size) => { g.save(); g.translate(x,y); g.rotate(rot); g.globalAlpha = .86; g.globalCompositeOperation = 'multiply'; g.strokeStyle = g.fillStyle = RED;
    g.font = `700 ${size}px ${DISP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(word).width + size*.5;
    g.lineWidth = Math.max(4, size/12); g.strokeRect(-w/2, -size*.62, w, size*1.2); g.fillText(word, 0, 3);
    // worn ink: knock a few holes out of the stamp
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.fillStyle = PAPER;
    for (let i = 0; i < 40; i++) g.fillRect((rnd()-.5)*w, (rnd()-.5)*size*1.2, 1+rnd()*3, 1+rnd()*2);
    g.restore(); };
  const rank = document.querySelector('.poster .stamp')?.textContent || (deadN >= 50 ? 'MOST WANTED' : deadN >= 3 ? 'SERIAL OFFENDER' : deadN ? 'PERSON OF INTEREST' : 'CLEAN RECORD');
  let rs = 30; g.font = `700 ${rs}px ${DISP}`; while (g.measureText(rank).width + rs*.5 > 200 && rs > 18) g.font = `700 ${--rs}px ${DISP}`;
  stamp(rank, px+pw-140, py+66, .1, rs);
  if (guilty) stamp('GUILTY', px+pw-170, ny+100, -.22, 72);
  if (live.includes('IN DENIAL')) stamp('IN DENIAL', px+pw-170, ny - nsz*.5, .14, 40);
  if (live.includes('NO PAROLE')) stamp('NO PAROLE', px+pw/2+40, py+ph-42, -.05, 28);
  g.restore();

  // under the poster: where to get your own
  g.textBaseline = 'middle';
  g.save(); g.translate(0, 572); g.rotate(-.01); g.fillStyle = TAPE; g.fillRect(-20, -22, W+40, 44);
  g.fillStyle = '#111'; g.textAlign = 'left'; g.font = `700 22px ${DISP}`; g.fillText('COLD CASE UNIT', 40, 1);
  g.textAlign = 'center'; g.font = `700 19px ${TYPE}`; g.fillText('Somebody killed all these projects. The commit log says it was you.', W/2 + 40, 1);
  g.restore();
  g.fillStyle = '#ece7da'; g.textAlign = 'center'; g.font = `700 17px ${TYPE}`;
  g.fillText(`WHO DID YOU KILL?  ${SITE}`, W/2, 612);
  return cv.toDataURL('image/png');
}
function showCard(url, name, deadN){
  document.getElementById('cardbox')?.remove();
  const link = `https://${SITE}/?u=${encodeURIComponent(name)}`;
  const text = deadN ? `The Cold Case Unit says I killed ${deadN.toLocaleString()} project${deadN===1?'':'s'}. The commit log agrees. Who did you kill?` : `The Cold Case Unit found no bodies on me. Who did you kill?`;
  const file = `wanted-${String(name).replace(/[^\w.-]+/g, '_')}.png`;
  document.body.insertAdjacentHTML('beforeend', `<div id="cardbox" class="cardbox" role="dialog" aria-label="Your wanted poster">
    <div class="cardinner"><img src="${url}" alt="Wanted poster for ${esc(name)}">
    <div class="cardrow">${navigator.share ? `<button id="cardshare">POST IT</button>` : ''}
    ${LIVE ? `<a class="btnlink${navigator.share ? ' ghostlink' : ''}" href="${url}" download="${esc(file)}">SAVE IMAGE</a>` : ''}
    <button class="ghost" id="cardcopy">COPY LINK + CAPTION</button>
    <button class="ghost" id="cardclose">Close</button></div>
    <p class="cardcap">${esc(text)} ${esc(link)}</p></div></div>`);
  const box = document.getElementById('cardbox');
  document.getElementById('cardclose').onclick = () => box.remove();
  box.onclick = e => { if (e.target === box) box.remove(); };
  const cp = document.getElementById('cardcopy');
  cp.onclick = async () => { try { await navigator.clipboard.writeText(`${text} ${link}`); cp.textContent = 'COPIED'; } catch(e) { cp.textContent = 'COPY IT FROM BELOW'; } };
  const sh = document.getElementById('cardshare');
  if (sh) sh.onclick = async () => {
    try { const blob = await (await fetch(url)).blob(); const f = new File([blob], file, {type: 'image/png'});
      const data = navigator.canShare && navigator.canShare({files: [f]}) ? {files: [f], text: `${text} ${link}`} : {text, url: link};
      await navigator.share(data);
    } catch(e) { if (e && e.name !== 'AbortError') sh.textContent = 'SAVE IT INSTEAD'; } };
}
