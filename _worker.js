const areas = {
  portfolio: 'WPLLC_PORTFOLIO',
  project: 'WPLLC_PROJECT',
};
const lifetime = 4 * 60 * 60;
const encoder = new TextEncoder();
const passwordPattern = /^[A-Za-z0-9_-]{43}$/;
const proof = encoder.encode('Walker Pollitt LLC private access login');
const privateHeaders = {
  // Keep Cloudflare from replacing mailto links with script-dependent links.
  // Private pages deliberately disallow scripts in their CSP.
  'Cache-Control': 'private, no-store, no-transform',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
};

function decode(value) {
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), ch => ch.charCodeAt(0));
}

function encode(value) {
  return btoa(String.fromCharCode(...new Uint8Array(value))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function signingKey(bytes) {
  return crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function loadAreas(env) {
  const configured = {};
  for (const [area, binding] of Object.entries(areas)) {
    if (!env[binding]) continue;
    try {
      const entry = JSON.parse(env[binding]);
      if (!passwordPattern.test(entry.verifier) || typeof entry.title !== 'string' || !entry.title
        || typeof entry.intro !== 'string' || !Array.isArray(entry.sections) || !entry.sections.length
        || !entry.sections.every(section => typeof section?.heading === 'string' && typeof section?.text === 'string')) continue;
      configured[area] = { ...entry, key: await signingKey(decode(entry.verifier)) };
    } catch {
      // A missing or invalid binding leaves that area unavailable.
    }
  }
  if (configured.portfolio?.verifier === configured.project?.verifier) return {};
  return configured;
}

function cookieName(area) {
  return `__Secure-wpllc-${area}`;
}

function cookieHeader(area, value = '', age = 0) {
  return `${cookieName(area)}=${value}; Path=/private; Max-Age=${age}; Secure; HttpOnly; SameSite=Lax`;
}

function cookieValue(request, name) {
  return (request.headers.get('Cookie') ?? '').split(';').map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function sessionMessage(area, expires) {
  return encoder.encode(`wpllc-session-v1:${area}:${expires}`);
}

async function signedIn(request, area, entry) {
  const token = cookieValue(request, cookieName(area));
  const match = /^(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(token ?? '');
  if (!match || Number(match[1]) <= Math.floor(Date.now() / 1000)) return false;
  return crypto.subtle.verify('HMAC', entry.key, decode(match[2]), sessionMessage(area, match[1]));
}

async function newSession(area, entry) {
  const expires = Math.floor(Date.now() / 1000) + lifetime;
  const signature = await crypto.subtle.sign('HMAC', entry.key, sessionMessage(area, expires));
  return cookieHeader(area, `${expires}.${encode(signature)}`, lifetime);
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function page(request, title, content, status = 200) {
  return new Response(request.method === 'HEAD' ? null : `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <link rel="stylesheet" href="/assets/site.css">
  <title>${escapeHtml(title)} | Walker Pollitt LLC</title>
</head>
<body>
  <a class="skip" href="#main">Skip to main content</a>
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">WP</span> Walker Pollitt LLC</a>
      <nav class="site-nav" aria-label="Main navigation">
        <a href="/#capabilities">Services</a>
        <a href="/#ravenforge">RavenForge demos</a>
        <a href="/about/">About</a>
        <a href="/#contact">Contact</a>
        <a class="private-link" href="/private/" aria-current="page">Private access</a>
      </nav>
    </div>
  </header>
  <main class="wrap subpage" id="main" tabindex="-1">
    <p class="eyebrow">Walker Pollitt LLC</p>
    <h1>${escapeHtml(title)}</h1>
    ${content}
  </main>
  <footer class="site-footer"><div class="wrap footer-inner"><span>© 2026 Walker Pollitt LLC</span><a href="/#contact">Contact Walker Pollitt LLC</a></div></footer>
</body>
</html>`, { status, headers: { ...privateHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
}

function redirect(location, cookies = [], status = 303) {
  const headers = new Headers({ ...privateHeaders, Location: location });
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return new Response(null, { status, headers });
}

function loginForm(target, error) {
  return `${error ? '<p role="alert" class="status-error">This password did not open the requested area.</p>' : ''}
  <form class="sign-in-form" method="post" action="/private/login">
    <input type="hidden" name="area" value="${target}">
    <label for="password">Access password</label>
    <input type="password" name="password" id="password" autocomplete="current-password" required maxlength="64">
    <button class="button" type="submit">Sign in</button>
  </form>`;
}

const logout = '<form class="logout" method="post" action="/private/logout"><button type="submit">Sign out of project materials</button></form>';
const requestAccess = '<!--email_off--><a class="text-link" href="mailto:walker.pollitt@walkerpollittllc.com?subject=Private%20project%20access">Request access by email</a><span class="access-email"> · walker.pollitt@walkerpollittllc.com</span><!--/email_off-->';

function directory(request, configured, granted, error = false) {
  const entries = granted.map(area => `<section class="card"><h2>${escapeHtml(configured[area].title)}</h2>
    <a class="text-link" href="/private/${area}">Open ${area === 'project' ? 'project' : 'portfolio'}</a></section>`);
  const allowLogin = Object.keys(configured).some(area => !granted.includes(area));
  if (allowLogin || !entries.length) {
    entries.push(`<section class="card">
      <h2>Private project materials</h2>
      <p>Enter the password issued for the materials you want to open.</p>
      ${loginForm('directory', error)}
      <p class="logout">${requestAccess}</p>
    </section>`);
  }
  entries.push(`<section class="card">
    <h2>RavenForge operator tools</h2>
    <p>Sign in to the private operator workspace.</p>
    <a class="button" href="https://app.walkerpollittllc.com/app">Open operator sign-in</a>
  </section>`);
  return page(request, 'Private access', `<div class="card-grid">${entries.join('')}</div>${granted.length ? logout : ''}`, error ? 401 : 200);
}

function locked(request, area, error = false) {
  const title = area === 'portfolio' ? 'Project portfolio' : 'Private project materials';
  return page(request, title, `<p class="lead">Enter the password issued for this area.</p>
    ${loginForm(area, error)}
    <p class="logout">${requestAccess} · <a class="text-link" href="/private/">Private access</a></p>`, error ? 401 : 200);
}

function details(request, entry) {
  const sections = entry.sections.map(({ heading, text }) => `<section class="card">
    <h2>${escapeHtml(heading)}</h2><p>${escapeHtml(text)}</p></section>`);
  return page(request, entry.title, `<p class="lead">${escapeHtml(entry.intro)}</p>
    <div class="card-grid">${sections.join('')}</div>
    <p class="logout"><a class="text-link" href="/private/">Back to private access</a></p>${logout}`);
}

async function credentials(request) {
  const mediaType = (request.headers.get('Content-Type') ?? '').split(';')[0].trim();
  if (mediaType !== 'application/x-www-form-urlencoded' || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = '';
  let length = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 512) {
      await reader.cancel();
      return null;
    }
    body += decoder.decode(value, { stream: true });
  }
  return new URLSearchParams(body + decoder.decode());
}

async function login(request, configured, granted) {
  const fields = await credentials(request);
  const area = fields?.get('area');
  const password = fields?.get('password')?.trim() ?? '';
  if (area !== 'directory' && !Object.hasOwn(areas, area)) {
    return page(request, 'Private access', '<p>Unable to read that sign-in request.</p>', 400);
  }
  const eligible = area === 'directory' ? Object.keys(configured) : [area];
  if (passwordPattern.test(password)) {
    const localKey = await signingKey(await crypto.subtle.digest('SHA-256', encoder.encode(password)));
    const signature = await crypto.subtle.sign('HMAC', localKey, proof);
    for (const candidate of eligible) {
      const entry = configured[candidate];
      if (entry && await crypto.subtle.verify('HMAC', entry.key, signature, proof)) {
        const destination = area === 'directory' ? '/private/' : `/private/${candidate}`;
        return redirect(destination, [await newSession(candidate, entry)]);
      }
    }
  }
  return area === 'directory' ? directory(request, configured, granted, true) : locked(request, area, true);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');
    if (path !== '/private' && !path.startsWith('/private/')) return env.ASSETS.fetch(request);
    if (url.protocol !== 'https:') {
      if (!['GET', 'HEAD'].includes(request.method)) return page(request, 'Access denied', '<p>Open the HTTPS sign-in page.</p>', 403);
      url.protocol = 'https:';
      return redirect(url.href, [], 308);
    }
    const configured = await loadAreas(env);
    const granted = [];
    for (const [area, entry] of Object.entries(configured)) {
      if (await signedIn(request, area, entry)) granted.push(area);
    }
    if (request.method === 'POST' && (path === '/private/login' || path === '/private/logout')) {
      if (request.headers.get('Origin') !== url.origin) {
        return page(request, 'Access denied', '<p>Open the sign-in page directly and try again.</p>', 403);
      }
      if (path === '/private/logout') return redirect('/private/', Object.keys(areas).map(area => cookieHeader(area)));
      return login(request, configured, granted);
    }
    if (['GET', 'HEAD'].includes(request.method)) {
      if (path === '/private') return directory(request, configured, granted);
      const area = path.slice('/private/'.length);
      if (Object.hasOwn(areas, area)) {
        return granted.includes(area) ? details(request, configured[area]) : locked(request, area);
      }
    }
    return page(request, 'Page unavailable', '<p><a href="/private/">Return to private access</a></p>', 404);
  },
};
