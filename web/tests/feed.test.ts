import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterPosts, parseBookmarks, compact, dateLabel } from '../src/feed.ts';
import type { Filters, Post } from '../src/feed.ts';

const { posts } = JSON.parse(readFileSync(new URL('../src/posts.json', import.meta.url), 'utf8')) as { posts: Post[] };
const all: Filters = { query: '', topic: '', sort: 'top', savedOnly: false, saved: [] };

test('top tweets sorts the real collection by recorded likes without mutating it', () => {
  const order = posts.map(post => post.id);
  const result = filterPosts(posts, all);
  assert.equal(result[0].id, '2105853348188459389');
  assert.ok(result.every((post, index) => index === 0 || result[index - 1].likes >= post.likes));
  assert.deepEqual(posts.map(post => post.id), order);
});

test('latest and discussion honor their own metrics', () => {
  const latest = filterPosts(posts, { ...all, sort: 'newest' });
  assert.ok(latest.every((post, i) => i === 0 || Date.parse(latest[i - 1].publishedAt) >= Date.parse(post.publishedAt)));
  const discussion = filterPosts(posts, { ...all, sort: 'discussed' });
  assert.ok(discussion.every((post, i) => i === 0 || discussion[i - 1].replies >= post.replies));
  assert.notDeepEqual(discussion.map(post => post.id), latest.map(post => post.id));
});

test('search is case-insensitive, trims whitespace, and combines words', () => {
  const result = filterPosts(posts, { ...all, query: '  ADAM   factory  ' });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, '2105853348188459389');
  assert.equal(filterPosts(posts, { ...all, query: '@not-a-person' }).length, 0);
  assert.equal(filterPosts(posts, { ...all, query: '@surfcoderepeat' }).length, 3);
  assert.equal(filterPosts(posts, { ...all, query: '$IMD' }).length, 8);
});

test('topic, search, and bookmarks combine rather than override one another', () => {
  const result = filterPosts(posts, { ...all, query: 'daemon', topic: 'AI agents', savedOnly: true, saved: ['2093052175538659353', '2094764730317484378'] });
  assert.deepEqual(result.map(post => post.id), ['2093052175538659353']);
});

test('empty bookmarks never leak the full collection', () => {
  assert.deepEqual(filterPosts(posts, { ...all, savedOnly: true }), []);
});

test('corrupt, stale, and duplicate stored bookmarks are safely normalized', () => {
  const valid = posts.map(post => post.id);
  for (const raw of [null, 'broken', '{}', 'null', '42', '"hello"']) assert.deepEqual(parseBookmarks(raw, valid), []);
  assert.deepEqual(parseBookmarks(JSON.stringify([valid[0], 'missing', 42, valid[0], valid[1]]), valid), valid.slice(0, 2));
});

test('dates are stable in UTC and counts do not invent precision', () => {
  assert.equal(dateLabel('2026-10-02T02:52:17Z'), 'Oct 2');
  assert.equal(compact(365), '365');
  assert.equal(compact(76187), '76.2K');
});

test('every record has a unique original post, public provenance, and valid metrics', () => {
  assert.equal(new Set(posts.map(post => post.id)).size, posts.length);
  for (const post of posts) {
    assert.equal(post.url, `https://x.com/${post.handle}/status/${post.id}`);
    assert.equal(post.source, `https://api.fxtwitter.com/status/${post.id}`);
    assert.ok(Number.isFinite(Date.parse(post.publishedAt)));
    for (const metric of [post.likes, post.replies, post.reposts, post.views]) assert.ok(Number.isInteger(metric) && metric >= 0);
    assert.ok(post.quote === null || post.quote.split(/\s+/).length <= 25);
    assert.ok(post.summary.length > 80);
  }
});
