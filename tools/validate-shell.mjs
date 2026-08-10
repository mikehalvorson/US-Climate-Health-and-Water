import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(root, 'dist');
const base = '/US-Climate-Health-and-Water/';
const storyAnchors = ['current-system', 'problems', 'choices', 'recommendation', 'model', 'delivery'];

if (!existsSync(dist)) throw new Error('Static output is missing; run the Astro build first.');

function findHtml(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? findHtml(path) : entry.name.endsWith('.html') ? [path] : [];
  });
}

const pages = findHtml(dist).sort();
if (pages.length !== 16) throw new Error(`Expected 16 static routes; found ${pages.length}.`);

const publicPath = (path) => {
  const local = relative(dist, path).split(sep).join('/').replace(/index\.html$/u, '');
  return `${base}${local}`;
};
const publicPaths = new Set(pages.map(publicPath));
const routeIds = new Set();
const failures = [];

for (const path of pages) {
  const html = readFileSync(path, 'utf8');
  const routePath = publicPath(path);
  const id = html.match(/<body[^>]*data-current-route="(RTE-\d{6})"/u)?.[1];
  if (!id) { failures.push(`${routePath}: missing canonical route ID`); continue; }
  routeIds.add(id);
  const sequence = Number(id.slice(-6));
  const h1Count = (html.match(/<h1(?:\s|>)/gu) ?? []).length;
  if (h1Count !== 1) failures.push(`${routePath}: expected one h1, found ${h1Count}`);
  for (const required of ['id="main-content"', 'aria-label="Primary navigation"', 'class="skip-link"', 'data-theme-toggle', 'aria-current="page"']) {
    if (!html.includes(required)) failures.push(`${routePath}: missing ${required}`);
  }
  if (!/data-release-status="(?:shell|chapter)"/u.test(html)) failures.push(`${routePath}: missing release status`);
  if (html.includes('undefined') || html.includes('NaN')) failures.push(`${routePath}: contains an invalid rendered value`);
  if (sequence >= 2 && sequence <= 15) {
    for (const anchor of storyAnchors) if (!html.includes(`id="${anchor}"`)) failures.push(`${routePath}: missing story anchor ${anchor}`);
    const released = html.includes('data-release-status="chapter"');
    if (released && !html.includes('data-chapter-content')) failures.push(`${routePath}: released chapter content is missing`);
    if (!released && !html.includes('data-shell-section')) failures.push(`${routePath}: shell publication state is not explicit`);
    if (!html.includes('class="tab-nav"')) failures.push(`${routePath}: local tab navigation is missing`);
  }
  if (sequence < 16 && !html.includes('rel="next"')) failures.push(`${routePath}: next chapter link is missing`);
  if (sequence > 1 && !html.includes('rel="prev"')) failures.push(`${routePath}: previous chapter link is missing`);

  const links = [...html.matchAll(/href="([^"#?]+)(?:[?#][^"]*)?"/gu)].map((match) => match[1]);
  for (const href of links.filter((value) => value.startsWith(base) && !value.includes('/_astro/') && !value.includes('/data/'))) {
    const normalized = href.endsWith('/') ? href : `${href}/`;
    if (!publicPaths.has(normalized)) failures.push(`${routePath}: unresolved internal route ${href}`);
  }
}

if (routeIds.size !== 16) failures.push(`Expected 16 unique canonical route IDs; found ${routeIds.size}.`);
if (failures.length) throw new Error(`Shell validation failed:\n${failures.join('\n')}`);
console.log(`PASS shell contract (${pages.length} routes, ${routeIds.size} canonical IDs, one h1 per route, internal navigation resolved).`);
