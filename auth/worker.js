// Cold Case Unit sign-in helper: a Cloudflare Worker.
// It does one job: swaps GitHub's one-time sign-in code for a token, using the app's secret,
// which must never be in the website itself. It asks GitHub for NO permissions (public data only)
// and stores nothing. The token goes back to the visitor's own browser in the address fragment.
// Settings it needs (Cloudflare > the worker > Settings > Variables):
//   GITHUB_CLIENT_ID      (plain text)
//   GITHUB_CLIENT_SECRET  (secret)
const SITE = 'https://connabyss.github.io/cold-case/';

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const callback = url.origin + '/callback';

    if (url.pathname === '/login') {
      const state = crypto.randomUUID();
      const back = (url.searchParams.get('u') || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 39);
      const gh = new URL('https://github.com/login/oauth/authorize');
      gh.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      gh.searchParams.set('redirect_uri', callback);
      gh.searchParams.set('state', state + '.' + back);
      gh.searchParams.set('allow_signup', 'false');
      return new Response(null, {status: 302, headers: {
        Location: gh.toString(),
        'Set-Cookie': `ccu_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`}});
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const [state, back = ''] = (url.searchParams.get('state') || '').split('.');
      const cookie = (req.headers.get('Cookie') || '').match(/(?:^|;\s*)ccu_state=([^;]+)/);
      if (!code || !cookie || cookie[1] !== state) return page('That sign-in expired. Go back and try again.');
      const r = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
        body: JSON.stringify({client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: callback})});
      const j = await r.json().catch(() => ({}));
      if (!j.access_token) return page('GitHub said no. Go back and try again.');
      return new Response(null, {status: 302, headers: {
        Location: SITE + (back ? '?u=' + back : '') + '#token=' + encodeURIComponent(j.access_token),
        'Set-Cookie': 'ccu_state=; Path=/; Max-Age=0', 'Referrer-Policy': 'no-referrer'}});
    }

    return page('Cold Case Unit sign-in helper. Nothing to see here, detective.');
  }
};

function page(text) {
  return new Response(`<!doctype html><meta charset="utf-8"><title>Cold Case Unit</title><body style="background:#0d0f14;color:#ece7da;font:16px monospace;padding:40px"><p>${text}</p><p><a style="color:#e8c23a" href="${SITE}">Back to the Cold Case Unit</a></p>`,
    {status: 200, headers: {'Content-Type': 'text/html; charset=utf-8'}});
}
