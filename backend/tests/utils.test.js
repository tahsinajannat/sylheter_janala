import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readMinutes, sanitizeArticle, stripHtml } from '../src/utils/html.js';
import { resolvePublishedAt, assertCanWrite } from '../src/services/publication.js';
import { slugify } from '../src/utils/slug.js';
import { buildUpdate } from '../src/utils/sql.js';
import { deterministicUuid } from '../src/utils/uuid.js';
import { parseYoutubeId } from '../src/utils/youtube.js';

test('slugify keeps Bangla letters and vowel signs', () => {
  assert.equal(slugify('সিলেটের জানালা'), 'সিলেটের-জানালা');
  assert.equal(slugify('  Hello,  World!! '), 'hello-world');
  assert.equal(slugify('!!!'), '');
});

test('slugify respects max length without trailing dash', () => {
  const s = slugify('a'.repeat(10) + ' ' + 'b'.repeat(10), 11);
  assert.equal(s, 'aaaaaaaaaa');
});

test('parseYoutubeId handles common URL forms', () => {
  const id = 'dQw4w9WgXcQ';
  assert.equal(parseYoutubeId(`https://www.youtube.com/watch?v=${id}&t=10`), id);
  assert.equal(parseYoutubeId(`https://youtu.be/${id}?si=abc`), id);
  assert.equal(parseYoutubeId(`https://www.youtube.com/embed/${id}`), id);
  assert.equal(parseYoutubeId(`https://www.youtube.com/shorts/${id}`), id);
  assert.equal(parseYoutubeId('https://example.com/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(parseYoutubeId('not a url'), null);
  assert.equal(parseYoutubeId('https://www.youtube.com/watch?v=short'), null);
});

test('deterministicUuid is stable and looks like a uuid', () => {
  const a = deterministicUuid('post:x');
  assert.equal(a, deterministicUuid('post:x'));
  assert.notEqual(a, deterministicUuid('post:y'));
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
});

test('buildUpdate only uses whitelisted, defined keys', () => {
  const { sets, values } = buildUpdate({ title: 'x', evil: 'DROP', isHero: false, skip: undefined }, { title: 'title', isHero: 'is_hero', skip: 'skip' }, 2);
  assert.deepEqual(sets, ['title = $2', 'is_hero = $3']);
  assert.deepEqual(values, ['x', false]);
  assert.throws(() => buildUpdate({}, { title: 'title' }), /No fields/);
});

test('sanitizeArticle strips scripts and javascript: links, keeps formatting', () => {
  const out = sanitizeArticle('<p onclick="x()">Hi <b>there</b></p><script>alert(1)</script><a href="javascript:alert(1)">bad</a><img src="https://a.b/c.jpg" onerror="x()">');
  assert.ok(!out.includes('script'));
  assert.ok(!out.includes('onclick'));
  assert.ok(!out.includes('javascript:'));
  assert.ok(!out.includes('onerror'));
  assert.ok(out.includes('<b>there</b>'));
  assert.ok(out.includes('<img src="https://a.b/c.jpg"'));
});

test('readMinutes is at least 1 and scales with length', () => {
  assert.equal(readMinutes('<p>short</p>'), 1);
  assert.equal(readMinutes(`<p>${'word '.repeat(450)}</p>`), 3);
  assert.equal(stripHtml('<p>a <b>b</b></p>'), 'a b');
});

test('resolvePublishedAt rules', () => {
  const future = new Date(Date.now() + 3600_000);
  const past = new Date(Date.now() - 3600_000);
  assert.throws(() => resolvePublishedAt('scheduled', null), /future/);
  assert.throws(() => resolvePublishedAt('scheduled', past), /future/);
  assert.equal(resolvePublishedAt('scheduled', future).getTime(), future.getTime());
  assert.throws(() => resolvePublishedAt('published', future), /scheduled/);
  assert.ok(Math.abs(resolvePublishedAt('published', undefined).getTime() - Date.now()) < 2000);
  assert.equal(resolvePublishedAt('published', undefined, past).getTime(), past.getTime());
  // scheduled -> published without a date: use now, not the (future) old date
  assert.ok(Math.abs(resolvePublishedAt('published', undefined, future).getTime() - Date.now()) < 2000);
  assert.equal(resolvePublishedAt('draft', undefined, null), null);
});

test('authors can only write their own drafts', () => {
  const author = { id: 'a1', role: 'author' };
  assert.throws(() => assertCanWrite(author, { newStatus: 'published' }), /drafts/);
  assert.throws(() => assertCanWrite(author, { existing: { author_id: 'a2', status: 'draft' } }), /own drafts/);
  assert.throws(() => assertCanWrite(author, { existing: { author_id: 'a1', status: 'published' } }), /own drafts/);
  assert.doesNotThrow(() => assertCanWrite(author, { existing: { author_id: 'a1', status: 'draft' }, newStatus: 'draft' }));
  assert.doesNotThrow(() => assertCanWrite({ id: 'e', role: 'editor' }, { newStatus: 'published' }));
});
