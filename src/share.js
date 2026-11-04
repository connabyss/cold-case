// ===== Share card: the owner's stamped WANTED poster as a 1200x630 image =====
async function shareCard(s, name, dead, alive, mo){
  try { await Promise.all(['900 80px "Big Shoulders Stencil Display"','400 20px "Courier Prime"','700 20px "Courier Prime"'].map(f => document.fonts.load(f))); } catch(e) {}
  const W = 1200, Hh = 630, cv = document.createElement('canvas'); cv.width = W*2; cv.height = Hh*2;
  const g = cv.getContext('2d'); g.scale(2,2);
  const DISP = '"Big Shoulders Stencil Display", Impact, sans-serif', TYPE = '"Courier Prime", "Courier New", monospace';
  g.fillStyle = '#0d0f14'; g.fillRect(0,0,W,Hh);
  // tape across the top
  g.save(); g.translate(0,34); g.rotate(-.012); g.fillStyle = '#e8c23a'; g.fillRect(-20,0,W+40,34);
  g.fillStyle = '#111'; g.font = `900 18px ${DISP}`; g.textBaseline = 'middle';
  let tx = 10; while (tx < W) { g.fillText('CRIME SCENE · DO NOT CROSS ·', tx, 18); tx += 300; } g.restore();
  // poster
  const px = 60, py = 92, pw = W-120, ph = Hh-130;
  g.fillStyle = '#dccca5'; g.fillRect(px,py,pw,ph); g.strokeStyle = '#2a2118'; g.lineWidth = 3; g.strokeRect(px+10,py+10,pw-20,ph-20);
  g.fillStyle = '#2a2118'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = `900 92px ${DISP}`; g.fillText('WANTED', W/2, py+100);
  g.font = `700 18px ${DISP}`; g.fillText('F O R   Q U E S T I O N I N G', W/2, py+126);
  g.fillRect(px+30, py+140, pw-60, 3);
  // mugshot
  const mx = px+40, my = py+165, ms = 200;
  if (s.avatar) { const img = new Image(); img.crossOrigin = 'anonymous'; img.src = s.avatar; await img.decode().catch(()=>{});
    g.save(); g.filter = 'grayscale(1) contrast(1.15)'; g.drawImage(img, mx, my, ms, ms); g.restore(); }
  else { g.fillStyle = '#c6b48a'; g.fillRect(mx,my,ms,ms); g.fillStyle = '#6b5a40'; g.font = `900 120px ${DISP}`; g.fillText('?', mx+ms/2, my+150); }
  g.strokeStyle = '#2a2118'; g.lineWidth = 4; g.strokeRect(mx,my,ms,ms);
  g.fillStyle = '#2a2118'; g.fillRect(mx, my+ms+8, ms, 28); g.fillStyle = '#dccca5'; g.font = `700 16px ${TYPE}`; g.fillText(name.toUpperCase(), mx+ms/2, my+ms+28);
  // count + M.O.
  const cx = mx+ms+40; g.textAlign = 'left';
  g.fillStyle = '#6b5a40'; g.font = `400 14px ${TYPE}`; g.fillText('IN CONNECTION WITH', cx, my+14);
  g.fillStyle = '#a8261d'; g.font = `900 110px ${DISP}`; g.fillText(String(dead.length), cx, my+118);
  g.fillStyle = '#6b5a40'; g.font = `400 14px ${TYPE}`; g.fillText(`PROJECT DEATH${dead.length===1?'':'S'} · ${alive.length} STILL BREATHING`, cx, my+142);
  g.fillStyle = '#2a2118'; g.font = `400 19px ${TYPE}`;
  mo.slice(0,3).forEach((line, i) => { let t = line; while (g.measureText(t).width > pw-(cx-px)-60 && t.length > 10) t = t.slice(0,-2); if (t !== line) t = t.trimEnd() + '…'; g.fillText(t, cx, my+180+i*30); });
  // stamps that are on the live poster right now
  const stamp = (word, x, y, rot, size) => { g.save(); g.translate(x,y); g.rotate(rot); g.globalAlpha = .88; g.strokeStyle = g.fillStyle = '#a8261d';
    g.font = `900 ${size}px ${DISP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(word).width + size*.5;
    g.lineWidth = Math.max(4, size/14); g.strokeRect(-w/2, -size*.62, w, size*1.2); g.fillText(word, 0, 2); g.restore(); };
  const live = [...document.querySelectorAll('.poster .bigstamp')].map(e => e.textContent);
  stamp(document.querySelector('.poster .stamp')?.textContent || 'PERSON OF INTEREST', px+pw-190, py+ph-55, .14, 34);
  if (live.includes('GUILTY')) stamp('GUILTY', W/2+60, py+250, -.2, 120);
  if (live.includes('IN DENIAL')) stamp('IN DENIAL', px+pw-170, py+110, .16, 46);
  if (live.includes('NO PAROLE')) stamp('NO PAROLE', px+260, py+ph-70, -.07, 46);
  g.fillStyle = '#8a8778'; g.font = `400 14px ${TYPE}`; g.textAlign = 'center';
  g.fillText('COLD CASE UNIT · Somebody killed all these projects. The commit log says it was you.', W/2, Hh-14);
  return cv.toDataURL('image/png');
}
function showCard(url, name){
  document.getElementById('cardbox')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div id="cardbox" class="cardbox" role="dialog" aria-label="Your wanted poster">
    <div class="cardinner"><img src="${url}" alt="Wanted poster for ${esc(name)}">
    <div class="cardrow">${LIVE ? `<a class="btnlink" href="${url}" download="wanted-${esc(name)}.png">SAVE IMAGE</a>` : ''}
    <span>${LIVE ? 'Or right' : 'Right'}-click / long-press the picture to save it.</span><button class="ghost" id="cardclose">Close</button></div></div></div>`);
  const box = document.getElementById('cardbox');
  document.getElementById('cardclose').onclick = () => box.remove();
  box.onclick = e => { if (e.target === box) box.remove(); };
}
