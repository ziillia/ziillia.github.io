const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { read, html, context, plain } = require('./source.cjs');

test('v1.10.0 is consistent across APP_VERSION, titles, entry URLs, manifest and Service Worker', () => {
  const ctx = context(['APP_VERSION', 'APP_BUILD_DATE']);
  assert.equal(vm.runInContext('APP_VERSION', ctx), '1.10.0-kpop-auto-classification');
  assert.equal(vm.runInContext('APP_BUILD_DATE', ctx), '2026-09-08');
  for (const text of [html, read('index.html')]) {
    assert.match(text, /<title>Drive DJ Finder v1\.10\.0<\/title>/);
    assert.match(text, /manifest\.webmanifest\?v=1\.10\.0["']/);
  }
  assert.match(read('index.html'), /location\.replace\('\.\/drive-dj-finder\?v=1\.10\.0'\)/);
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.start_url, './drive-dj-finder?v=1.10.0');
  assert.match(manifest.description, /v1\.10\.0$/);
  assert.match(read('service-worker.js'), /const CACHE_NAME='drive-dj-finder-v1\.10\.0-access-safe';/);
  assert.equal(JSON.parse(read('package.json')).version, '1.10.0');
});

const classification = () => context(['normalText', 'splitArtistCredits', 'kpopArtistKey',
  'KPOP_CLASSIFIED_ARTISTS', 'KPOP_SPECIAL_CREDITS', 'KPOP_ARTIST_KEYS', 'isKpopClassifiedArtist', 'trackCollections']);

test('all nine related names from the supplied classification source stay excluded', () => {
  const expected = JSON.parse(read('kpop-classification.json')).related_not_automatically_included;
  const ctx = classification();
  assert.equal(expected.length, 9);
  assert.equal(new Set(expected).size, 9);
  for (const name of expected) {
    assert.equal(ctx.isKpopClassifiedArtist(name), false, name);
    assert.deepEqual(plain(ctx.trackCollections({ artist: name, collections: ['local_import'] })), ['local_import'], name);
  }
});

test('classification matches the fixed 110 artist and four special-credit baseline', () => {
  const ctx = classification();
  const source = JSON.parse(read('kpop-classification.json'));
  const expected = { artists: source.kpop_artists, specialCredits: source.special_kpop_credits };
  assert.equal(expected.artists.length, 110);
  assert.equal(expected.specialCredits.length, 4);
  assert.deepEqual(plain(vm.runInContext('KPOP_CLASSIFIED_ARTISTS', ctx)), expected.artists);
  assert.deepEqual(plain(vm.runInContext('KPOP_SPECIAL_CREDITS', ctx)), expected.specialCredits);
  assert.equal(vm.runInContext('KPOP_ARTIST_KEYS.size', ctx), 114);
  for (const name of [...expected.artists, ...expected.specialCredits]) {
    assert.equal(ctx.isKpopClassifiedArtist(name), true, name);
    assert.equal(ctx.isKpopClassifiedArtist(`  ${name.toLowerCase()}  `), true, name);
  }
});

test('partial artist names do not classify unrelated artists', () => {
  const ctx = classification();
  for (const name of ['Vaundy', 'IVEY', 'KEYTALK', 'BoA Orchestra', 'BTS Tribute', 'TEAM', 'The Rainbow', '', null]) {
    assert.equal(ctx.isKpopClassifiedArtist(name), false, String(name));
  }
  assert.equal(ctx.isKpopClassifiedArtist('＆TEAM'), true);
});

test('classification accepts complete collaboration credits, not embedded substrings', () => {
  const ctx = classification();
  for (const name of ['Other feat. BTS', 'Other & IU', 'Other、TWICE', 'BTS; Other']) {
    assert.equal(ctx.isKpopClassifiedArtist(name), true, name);
  }
  assert.equal(ctx.isKpopClassifiedArtist('Other feat. BTS Tribute'), false);
});

test('existing array collections and input data survive K-POP classification', () => {
  const ctx = classification();
  const track = { artist: 'BTS', collections: ['local_import', 'user_playlist_example', 'retro_top1000'] };
  const before = structuredClone(track);
  assert.deepEqual(plain(ctx.trackCollections(track)), [...track.collections, 'spotify_kpop']);
  assert.deepEqual(track, before);
  assert.deepEqual(plain(ctx.trackCollections({ ...track, collections: ['spotify_kpop', 'local_import'] })), ['spotify_kpop', 'local_import']);
});

test('legacy collection strings and non-K-POP collections are preserved', () => {
  const ctx = classification();
  assert.deepEqual(plain(ctx.trackCollections({ artist: 'IU', collection: 'local_import|retro_top1000' })), ['local_import', 'retro_top1000', 'spotify_kpop']);
  assert.deepEqual(plain(ctx.trackCollections({ artist: 'Vaundy', collections: ['spotify_kpop', 'custom'] })), ['spotify_kpop', 'custom']);
  assert.deepEqual(plain(ctx.trackCollections({ artist: 'Vaundy' })), []);
});

test('device selection is manual and invalid/unspecified values remain unselected', () => {
  const field = { value: '' };
  const ctx = context(['selectedVideoDevice'], { $: id => { assert.equal(id, 'videoDeviceMode'); return field; } });
  for (const value of ['', 'auto', 'desktop', 'iPhone']) { field.value = value; assert.equal(ctx.selectedVideoDevice(), ''); }
  for (const value of ['iphone', 'ipad']) { field.value = value; assert.equal(ctx.selectedVideoDevice(), value); }
});

test('iPhone and iPad keep their explicit crop coordinates and field geometry', () => {
  const ctx = context(['spotifyVideoLayout']);
  for (const [device, geometry, roi] of [
    ['iphone', 'legacy-key-relative-v1', { x: .015, y: .18, width: .97, height: .62 }],
    ['ipad', 'wide-portrait-key-relative-v2', { x: .015, y: .15, width: .97, height: .74 }],
  ]) {
    const layout = ctx.spotifyVideoLayout(1080, 1920, device);
    assert.equal(layout.selectionMode, 'manual');
    assert.equal(layout.selectedDevice, device);
    assert.equal(layout.fieldGeometry, geometry);
    assert.deepEqual(plain(layout.roi), roi);
  }
});

test('crop selection rejects auto mode, missing resolution and landscape video', () => {
  const ctx = context(['spotifyVideoLayout']);
  for (const device of [undefined, '', 'auto']) assert.throws(() => ctx.spotifyVideoLayout(1080, 1920, device), /選択/);
  for (const size of [[0, 1920], [1080, 0], [1920, 1080], [1080, 1080]]) {
    assert.throws(() => ctx.spotifyVideoLayout(...size, 'ipad'), /解像度|横画面/);
  }
});

test('title and artist crops retain key-relative iPhone/iPad coordinates', () => {
  const ctx = context(['fieldCropGeometry'], { videoLayoutProfile: { id: 'legacy' } });
  const source = { width: 1000 };
  const anchor = { top: 300, keyColor: { centerY: 400 } };
  for (const [profile, expected] of [
    ['legacy', [{ y: 322, height: 58 }, { y: 379, height: 56 }, { y: 384, height: 58 }]],
    ['wide-portrait', [{ y: 364, height: 26 }, { y: 388, height: 27 }, { y: 393, height: 27 }]],
  ]) {
    ctx.videoLayoutProfile.id = profile;
    assert.deepEqual(plain(ctx.fieldCropGeometry(source, anchor, 'title')), expected[0]);
    assert.deepEqual(plain(ctx.fieldCropGeometry(source, anchor, 'artist')), expected[1]);
    assert.deepEqual(plain(ctx.fieldCropGeometry(source, anchor, 'artist', 'lower')), expected[2]);
  }
  assert.deepEqual(plain(ctx.fieldCropGeometry(source, { top: 300 }, 'title')), { y: 272, height: 58 });
  assert.deepEqual(plain(ctx.fieldCropGeometry(source, { top: 300 }, 'artist')), { y: 329, height: 56 });
});
