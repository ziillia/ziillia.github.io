const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { context, plain, read } = require('./source.cjs');

const keys = {
  STORAGE_KEY: 'driveDjUserTracksV2Collections', LEGACY_STORAGE_KEY: 'driveDjUserTracksV1',
  OVERRIDE_STORAGE_KEY: 'driveDjTrackOverridesV1', FAVORITES_STORAGE_KEY: 'driveDjFavoritesV1',
  FAVORITE_ARTISTS_STORAGE_KEY: 'driveDjFavoriteArtistsV1', OCR_INSPECTION_POLICY_STORAGE_KEY: 'driveDjOcrInspectionPolicyV1',
  SHARED_TOMBSTONES_STORAGE_KEY: 'driveDjSharedTombstonesV1', CUSTOM_COLLECTIONS_STORAGE_KEY: 'driveDjCustomCollectionsV1',
  OCR_CORRECTIONS_STORAGE_KEY: 'driveDjOcrCorrectionsV1',
};
const scopes = ['favorites', 'favoriteArtists', 'trackOverrides', 'userTracks', 'customCollections', 'ocrCorrections'];
const time = '2026-09-08T00:00:00.000Z';
const later = '2026-09-09T00:00:00.000Z';
function syncContext(extra = {}) {
  const saved = new Map();
  const ctx = context([...Object.keys(keys), 'SHARED_STATE_URL', 'sharedStateEnabled', 'sharedTimestamp',
    'localSharedItems', 'persistSharedLocalCopies', 'applySharedServerItems', 'sharedRequest', 'syncSharedState'], {
    location: { protocol: 'https:' }, localStorage: { setItem: (key, value) => saved.set(key, value) },
    favoriteKeys: {}, favoriteArtists: {}, trackOverrides: {}, userTracks: [], customCollections: {}, ocrCorrections: {},
    sharedTombstones: Object.fromEntries(scopes.map(scope => [scope, {}])),
    sharedSyncRunning: false, sharedSyncAvailable: false,
    userTrackSyncKey: value => value.syncKey,
    syncCustomCollectionCatalog() {}, rebuildTracks() {}, refreshImportCollectionOptions() {},
    refreshCollectionFilter() {}, refreshFilters() {}, updateCounters() {}, updateFavoriteControls() {}, render() {},
    setSharedSyncStatus() {}, showToast() {}, $: () => ({ disabled: false }),
    fetch: () => { throw new Error('Unexpected network request'); },
    ...extra,
  });
  return { ctx, saved };
}

test('all nine browser storage keys retain their v1.10.0 identities', () => {
  const ctx = context(Object.keys(keys));
  for (const [name, value] of Object.entries(keys)) assert.equal(vm.runInContext(name, ctx), value);
});
test('local persistence writes the seven shared copies without replacing legacy or inspection preferences', () => {
  const { ctx, saved } = syncContext();
  ctx.persistSharedLocalCopies();
  assert.deepEqual([...saved.keys()].sort(), Object.entries(keys)
    .filter(([name]) => !['LEGACY_STORAGE_KEY', 'OCR_INSPECTION_POLICY_STORAGE_KEY'].includes(name)).map(([, value]) => value).sort());
  assert.deepEqual(JSON.parse(saved.get(keys.STORAGE_KEY)), []);
});
test('local sync exports exactly six scopes and equal/newer tombstones win', () => {
  const { ctx } = syncContext({
    favoriteKeys: { song: { savedAt: time } }, favoriteArtists: { artist: { savedAt: time } },
    trackOverrides: { song: { updatedAt: time } }, userTracks: [{ syncKey: 'song', addedAt: time }],
    customCollections: { list: { createdAt: time } }, ocrCorrections: { word: { updatedAt: time } },
  });
  assert.deepEqual([...ctx.localSharedItems().values()].map(item => item.scope).sort(), [...scopes].sort());
  ctx.sharedTombstones.favorites.song = time;
  ctx.sharedTombstones.userTracks.song = later;
  let items = ctx.localSharedItems();
  assert.equal(items.get('favorites\nsong').deleted, true);
  assert.equal(items.get('userTracks\nsong').deleted, true);
  ctx.favoriteKeys.song.savedAt = later;
  items = ctx.localSharedItems();
  assert.equal(items.get('favorites\nsong').deleted, false);
});
test('server state restores each scope and deletion markers, ignoring unknown scopes', () => {
  const { ctx, saved } = syncContext();
  ctx.applySharedServerItems([
    ...scopes.map(scope => ({ scope, key: scope, value: { title: scope }, updatedAt: time })),
    { scope: 'favorites', key: 'gone', deleted: true, updatedAt: later },
    { scope: 'untrusted', key: 'bad', value: {}, updatedAt: time },
  ]);
  assert.equal(ctx.favoriteKeys.favorites.title, 'favorites');
  assert.equal(ctx.favoriteArtists.favoriteArtists.title, 'favoriteArtists');
  assert.equal(ctx.trackOverrides.trackOverrides.updatedAt, time);
  assert.equal(ctx.userTracks[0].syncKey, 'userTracks');
  assert.equal(ctx.customCollections.customCollections.id, 'customCollections');
  assert.equal(ctx.ocrCorrections.ocrCorrections.updatedAt, time);
  assert.equal(ctx.sharedTombstones.favorites.gone, later);
  assert.equal(ctx.favoriteKeys.gone, undefined);
  assert.equal(saved.size, 7);
});
test('shared requests retain the endpoint, no-store policy and same-origin credentials', async () => {
  let call;
  const { ctx } = syncContext({ fetch: async (url, options) => {
    call = { url, options }; return { ok: true, json: async () => ({ ok: true }) };
  } });
  await ctx.sharedRequest({ method: 'POST', body: '{"operations":[]}' });
  assert.equal(call.url, './api/shared-state');
  assert.equal(call.options.credentials, 'same-origin');
  assert.equal(call.options.cache, 'no-store');
  assert.equal(call.options.headers['Content-Type'], 'application/json');
  assert.equal(call.options.method, 'POST');
  assert.equal(call.options.body, '{"operations":[]}');
});
test('shared requests preserve authentication error codes', async () => {
  const { ctx } = syncContext({ fetch: async () => ({ ok: false, status: 401, json: async () => ({ code: 'AUTH_REQUIRED', error: 'Login required' }) }) });
  await assert.rejects(() => ctx.sharedRequest(), error => error.code === 'AUTH_REQUIRED' && error.message === 'Login required');
});
test('HTTP stays local and an already-running synchronization does not send requests', async () => {
  const { ctx } = syncContext();
  ctx.location.protocol = 'http:';
  assert.equal(ctx.sharedStateEnabled(), false);
  assert.equal(await ctx.syncSharedState(), false);
  ctx.location.protocol = 'https:';
  assert.equal(ctx.sharedStateEnabled(), true);
  ctx.sharedSyncRunning = true;
  assert.equal(await ctx.syncSharedState(), false);
});
test('sync sends only newer local entries, chunks at 400, then re-fetches server state', async () => {
  const local = Object.fromEntries(Array.from({ length: 402 }, (_, i) => [`song${i}`, { savedAt: later }]));
  const calls = [];
  const { ctx } = syncContext({ favoriteKeys: local });
  ctx.sharedRequest = async (options = {}) => {
    calls.push(plain(options));
    return { items: [{ scope: 'favorites', key: 'song0', value: { savedAt: later }, updatedAt: later }] };
  };
  assert.equal(await ctx.syncSharedState(), true);
  assert.equal(calls.length, 4);
  assert.deepEqual(calls[0], {});
  assert.deepEqual(calls[3], {});
  const batches = calls.slice(1, 3).map(call => JSON.parse(call.body).operations);
  assert.deepEqual(batches.map(batch => batch.length), [400, 1]);
  assert.ok(batches.flat().every(item => item.key !== 'song0'));
  assert.equal(ctx.sharedSyncRunning, false);
  assert.equal(ctx.sharedSyncAvailable, true);
});
test('failed synchronization leaves local data intact and clears the running flag', async () => {
  const { ctx } = syncContext({ favoriteKeys: { song: { savedAt: time } } });
  const before = plain(ctx.favoriteKeys);
  ctx.sharedRequest = async () => { throw Object.assign(new Error('Offline'), { code: 'AUTH_REQUIRED' }); };
  assert.equal(await ctx.syncSharedState(), false);
  assert.deepEqual(plain(ctx.favoriteKeys), before);
  assert.equal(ctx.sharedSyncRunning, false);
  assert.equal(ctx.sharedSyncAvailable, false);
});

function workerContext() {
  const ctx = vm.createContext({ Request, Response, URL, TextEncoder, TextDecoder, atob,
    fetch: () => { throw new Error('Unexpected network request'); } });
  vm.runInContext(read('_worker.js').replace('export default {', 'globalThis.worker = {'), ctx);
  return ctx;
}
test('D1 worker retains six shared scopes and strict timestamp conflict resolution', async () => {
  const ctx = workerContext();
  assert.deepEqual([...vm.runInContext('SCOPES', ctx)].sort(), [...scopes].sort());
  const queries = [];
  const db = { prepare(sql) { queries.push(sql); return { bind: (...values) => ({ values }) }; }, batch: async () => {} };
  await ctx.writeState(db, [{ scope: 'favorites', key: 'song', payload: '{}', deleted: false, updatedAt: time }], 'test');
  assert.match(queries[0], /WHERE excluded\.updated_at > shared_state\.updated_at/);
  assert.match(queries[0], /ON CONFLICT\(scope, item_key\)/);
});
test('shared API fails closed without Access configuration or JWT', async () => {
  const ctx = workerContext();
  const request = new Request('https://example.test/api/shared-state');
  const missingConfig = await ctx.worker.fetch(request, {});
  assert.equal(missingConfig.status, 503);
  assert.equal((await missingConfig.json()).code, 'AUTH_NOT_CONFIGURED');
  const missingToken = await ctx.worker.fetch(request, { ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com', ACCESS_AUD: 'aud' });
  assert.equal(missingToken.status, 401);
  assert.equal((await missingToken.json()).code, 'AUTH_REQUIRED');
});
