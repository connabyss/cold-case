// ===== Sound: all made in the browser, no files. Starts on the first click; one button mutes it. =====
const SFX = (() => {
  let ctx = null, master = null, rain = null, on = true;
  try { on = localStorage.getItem('ccu-sound') !== 'off'; } catch(e) {}
  const noiseBuf = () => { const b = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate), d = b.getChannelData(0); for (let i=0;i<d.length;i++) d[i] = Math.random()*2-1; return b; };
  let NB;
  function start(){
    if (ctx || !on) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .55; master.connect(ctx.destination); NB = noiseBuf();
    // rain: soft filtered noise, always under everything
    const src = ctx.createBufferSource(); src.buffer = NB; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = .4;
    rain = ctx.createGain(); rain.gain.value = 0; src.connect(f).connect(rain).connect(master); src.start();
    rain.gain.linearRampToValueAtTime(.05, ctx.currentTime + 2);
    sting();
  }
  const ok = () => ctx && on;
  function burst(dur, freq, q, vol, type='bandpass'){
    const s = ctx.createBufferSource(); s.buffer = NB; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(), t = ctx.currentTime; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t, Math.random()); s.stop(t + dur + .02);
  }
  function key(){ if (!ok()) return; burst(.035, 2500 + Math.random()*1500, 6, .35); }
  function ding(){ if (!ok()) return; const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime; o.frequency.value = 2093; o.type='sine'; g.gain.setValueAtTime(.12,t); g.gain.exponentialRampToValueAtTime(.001,t+.6); o.connect(g).connect(master); o.start(t); o.stop(t+.62); }
  function thud(){ if (!ok()) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(38, t + .25);
    g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .35); o.connect(g).connect(master); o.start(t); o.stop(t + .36);
    burst(.12, 600, .7, .6, 'lowpass'); }
  function rip(){ if (!ok()) return;
    const s = ctx.createBufferSource(); s.buffer = NB; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2;
    const g = ctx.createGain(), t = ctx.currentTime; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3200, t + .45);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.5, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + .5);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + .52); }
  function swish(){ if (!ok()) return; burst(.22, 900, .5, .25, 'lowpass'); }
  // a low minor-ninth chord swelling in, like a muted horn section in a noir film
  function sting(){ if (!ok()) return;
    const t = ctx.currentTime, lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(master);
    [98, 116.5, 146.8, 185, 233].forEach((hz, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = hz; o.detune.value = (i%2?7:-7);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .5 + i*.08); g.gain.exponentialRampToValueAtTime(.0001, t + 3.2);
      o.connect(g).connect(lp); o.start(t); o.stop(t + 3.3); }); }
  function setOn(v){ on = v; try { localStorage.setItem('ccu-sound', v ? 'on' : 'off'); } catch(e) {}
    if (!v && ctx) { ctx.close(); ctx = null; } else if (v) start(); }
  return {start, key, ding, thud, rip, swish, sting, setOn, get on(){ return on; }};
})();
document.addEventListener('pointerdown', () => SFX.start(), {once:true});
document.addEventListener('keydown', () => SFX.start(), {once:true});
