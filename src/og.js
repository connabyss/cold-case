// Re-shoots og.png (the 1280x640 link preview) from the real front page, so the preview always matches the site.
// Run after python src/build.py:  node src/og.js   (needs Playwright; NODE_PATH=$(npm root -g) if it's installed globally)
const {chromium} = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({viewport: {width: 1280, height: 640}, deviceScaleFactor: 1, reducedMotion: 'reduce'});
  await p.route('**/*', r => { const u = r.request().url(); (u.startsWith('file:') || /fonts\.(googleapis|gstatic)\.com/.test(u)) ? r.continue() : r.abort(); });
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await p.addStyleTag({content: `.topbar,.onfile,.steps,.notice,.intake{display:none!important}.hero{padding-top:60px}
    .lede::after{content:"connabyss.github.io/cold-case";display:block;margin-top:14px;font:700 18px "Courier Prime",monospace;color:#c8a35a}`});
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.screenshot({path: path.resolve(__dirname, '..', 'og.png')});
  await b.close();
})();
