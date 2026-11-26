import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import test from 'node:test';
import worker from '../_worker.js';

const origin = 'https://walkerpollittllc.example';
const portfolioPassword = 'p'.repeat(43);
const projectPassword = 'w'.repeat(43);
const title = 'Synthetic confidential project';
const body = 'Synthetic & protected case note';
const verifier = password => createHash('sha256').update(password).digest('base64url');
const data = (password, title) => JSON.stringify({
  verifier: verifier(password), title, intro: 'Fixture', sections: [{ heading: 'Case detail', text: body }],
});
const bindings = {
  WPLLC_PORTFOLIO: data(portfolioPassword, 'Authorized portfolio'),
  WPLLC_PROJECT: data(projectPassword, title),
};

function get(path, cookie, env = bindings, method = 'GET') {
  return worker.fetch(new Request(origin + path, { method, headers: cookie ? { Cookie: cookie } : {} }), env);
}

function post(path, fields, requestOrigin = origin, env = bindings) {
  return worker.fetch(new Request(origin + path, {
    method: 'POST', headers: { Origin: requestOrigin }, body: new URLSearchParams(fields),
  }), env);
}

async function privateBody(response) {
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  return response.text();
}

async function signIn(area, password) {
  const response = await post('/private/login', { area, password });
  assert.equal(response.status, 303);
  const header = response.headers.get('Set-Cookie');
  assert.match(header, /Path=\/private; Max-Age=14400; Secure; HttpOnly; SameSite=Lax/);
  return header.split(';')[0];
}

test('anonymous traffic gets generic sign-in and receives no private data', async () => {
  for (const path of ['/private', '/private/', '/private/portfolio', '/private/project/']) {
    const response = await get(path);
    assert.equal(response.status, 200);
    const html = await privateBody(response);
    assert.match(html, /Access password/);
    assert(!html.includes(title) && !html.includes(body));
  }
  const missing = await get('/private/project/artwork.png');
  assert.equal(missing.status, 404);
  assert(!((await privateBody(missing)).includes(title)));
  assert.equal(await (await get('/private/project', '', bindings, 'HEAD')).text(), '');
});

test('the two passwords grant only their own pages and directory entries', async () => {
  const portfolio = await signIn('portfolio', portfolioPassword);
  const project = await signIn('directory', projectPassword);
  for (const [area, cookie, expected, excluded] of [
    ['portfolio', portfolio, 'Authorized portfolio', title],
    ['project', project, title, 'Authorized portfolio'],
  ]) {
    const html = await privateBody(await get('/private/' + area, cookie));
    assert(html.includes(expected));
    assert(html.includes('Synthetic &amp; protected case note'));
    const directory = await privateBody(await get('/private/', cookie));
    assert(directory.includes(expected) && !directory.includes(excluded));
  }
  assert(!((await privateBody(await get('/private/project', portfolio))).includes(title)));
  assert(!((await privateBody(await get('/private/portfolio', project))).includes('Authorized portfolio')));
  const both = await privateBody(await get('/private/', portfolio + '; ' + project));
  assert(both.includes(title) && both.includes('Authorized portfolio'));
});

test('rejects invalid credentials, bad origin and absent or duplicate bindings', async () => {
  for (const [password, env] of [
    ['incorrect', bindings], [projectPassword, bindings], [portfolioPassword, {}],
    [portfolioPassword, { ...bindings, WPLLC_PROJECT: data(portfolioPassword, title) }],
  ]) {
    const response = await post('/private/login', { area: 'portfolio', password }, origin, env);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('Set-Cookie'), null);
  }
  assert.equal((await post('/private/login', { area: 'project', password: projectPassword }, 'https://other.example')).status, 403);
  assert.equal((await post('/private/login', { area: 'project', password: 'w'.repeat(800) })).status, 400);
  assert.equal((await post('/private/login', { area: 'unrecognized' })).status, 400);
});

test('invalid, expired or superseded sessions cannot read private content', async () => {
  const issued = await signIn('project', projectPassword);
  const expired = Math.floor(Date.now() / 1000) - 1;
  const signature = createHmac('sha256', Buffer.from(verifier(projectPassword), 'base64url'))
    .update(`wpllc-session-v1:project:${expired}`).digest('base64url');
  for (const [token, env] of [
    [issued.slice(0, -3) + 'aaa', bindings],
    [`__Secure-wpllc-project=${expired}.${signature}`, bindings],
    [issued, { ...bindings, WPLLC_PROJECT: data('a'.repeat(43), title) }],
  ]) {
    assert(!((await privateBody(await get('/private/project', token, env))).includes(title)));
  }
  const goodbye = await post('/private/logout', {});
  assert.equal(goodbye.status, 303);
  assert.equal(goodbye.headers.getSetCookie().length, 2);
  for (const cookie of goodbye.headers.getSetCookie()) assert.match(cookie, /Max-Age=0/);
});
