# Builds ../index.html from the parts in this folder: python src/build.py
import json, re, os, hashlib
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda f: open(os.path.join(here, f), encoding='utf-8').read()
b = rd('body.html')
for k, f in [('__LIB__','lib.js'),('__EXTRAS__','extras.js'),('__SOUND__','sound.js'),('__SHARE__','share.js'),('__LIVEJS__','live.js')]:
    b = b.replace(k, rd(f))
b = b.replace('__LOADER_VER__', hashlib.sha1(rd('live.js').encode()).hexdigest()[:8])
b = b.replace('__LIVE__', 'true').replace('__DATA__', json.dumps({'suspects': {}, 'strangers': []}))
b = re.sub(r'<!--ONFILE-->.*?<!--/ONFILE-->', '<div class="onfile">Try one: <button class="ghost" type="button" data-open="connabyss">connabyss</button></div>', b, flags=re.S)
b = re.sub(r'<!--FOOT-->.*?<!--/FOOT-->', 'Every line comes from the public GitHub record, read live in your browser: commit dates and messages, README text, file lists, stars and forks. Nothing is stored on a server. Only public projects are looked at. It roasts code, not people.', b, flags=re.S)
b = b.replace('value="connabyss"', 'value=""')
html = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n' + rd('head.html') + b + '\n</body></html>\n'
open(os.path.join(here, '..', 'index.html'), 'w', encoding='utf-8').write(html)
