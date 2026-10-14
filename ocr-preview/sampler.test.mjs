import test from 'node:test';
import assert from 'node:assert/strict';
import { findRowCandidates, createTracker } from './sampler.mjs';

function fixture(centers) {
  const width = 320, height = 460, data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) { data[i] = data[i + 1] = data[i + 2] = 20; data[i + 3] = 255; }
  const paint = (x, y, rgb) => data.set([...rgb, 255], (y * width + x) * 4);
  for (const center of centers) {
    for (let y = center - 3; y < center + 3; y++) for (let x = 247; x < 262; x++) paint(x, y, [160, 40, 180]);
    for (let y = center - 10; y < center; y++) for (let x = 65; x < 190; x += 3) paint(x, y, [220, 220, 220]);
  }
  return { width, height, data };
}
const candidate = (value, y = 100, sharpness = 10) => ({ y, sharpness, signature: new Uint8Array(768).fill(value) });

test('blank frames and isolated colored icons do not qualify as recurring rows', () => {
  assert.deepEqual(findRowCandidates(fixture([])), []);
  assert.deepEqual(findRowCandidates(fixture([100, 130, 200])), []);
  assert.deepEqual(findRowCandidates(fixture([90, 134])), []);
});

test('recurring pill clusters yield bounded signatures in visual order', () => {
  const rows = findRowCandidates(fixture([90, 134, 178, 222]));
  assert.deepEqual(rows.map(row => row.y), [90, 134, 178, 222]);
  assert.ok(rows.every(row => row.signature instanceof Uint8Array && row.signature.length === 768 && row.sharpness > 0));
  assert.throws(() => findRowCandidates({ width: 320, height: 460, data: [] }), TypeError);
});

test('tracker selects sharp stable source frame and retains no signatures in output', () => {
  const tracker = createTracker();
  const first = candidate(30);
  tracker.update([first], 0);
  first.signature.fill(250); // The caller can reuse its buffers.
  tracker.update([candidate(31, 102, 5)], .2);
  tracker.update([candidate(32, 103, 20)], .4);
  tracker.update([candidate(32, 105, 15)], .6);
  const [row] = tracker.finish();
  assert.equal(row.observations, 4);
  assert.equal(row.stable_pairs, 3);
  assert.equal(row.best_time, .4);
  assert.equal(row.best_y, 103);
  assert.equal(row.best_stable, true);
  assert.equal(row.stable, true);
  assert.equal('signature' in row, false);
  assert.equal('y' in row, false);
  assert.deepEqual(tracker.finish(), [row]);
  assert.throws(() => tracker.update([], 1), /finished/);
});

test('expired or faraway observations remain separate candidates, not identity merges', () => {
  const tracker = createTracker();
  tracker.update([candidate(30)], 0);
  tracker.update([], 1);
  tracker.update([candidate(30)], 1.2);
  tracker.update([candidate(30, 300)], 1.4);
  assert.equal(tracker.finish().length, 3);
});

test('maximum 32 active signatures, all metadata survives the cap in chronology', () => {
  const tracker = createTracker();
  const state = tracker.update(Array.from({ length: 40 }, (_, i) => candidate(30, 100 + i * 100)), 0);
  assert.deepEqual(state, { active: 32, completed: 8, max_active: 32 });
  tracker.update([], 1);
  const rows = tracker.finish();
  assert.equal(rows.length, 40);
  assert.equal(tracker.stats.active, 0);
  assert.deepEqual(rows.map(row => row.id), Array.from({ length: 40 }, (_, i) => i + 1));
  assert.ok(rows.every(row => !row.stable));
  assert.throws(() => createTracker({ maxActive: 33 }), RangeError);
});

test('tracker rejects reverse timestamps and matches one observation per frame', () => {
  const tracker = createTracker();
  tracker.update([candidate(30), candidate(30)], 1);
  tracker.update([candidate(30), candidate(30)], 1.2);
  assert.throws(() => tracker.update([], 1), /chronological/);
  assert.deepEqual(tracker.finish().map(row => row.observations), [2, 2]);
});

test('different sparse titles cannot merge through shared black background or artist', () => {
  const tracker = createTracker();
  const a = candidate(20), b = candidate(20);
  a.signature.fill(230, 20, 32);
  b.signature.fill(230, 50, 62);
  // The same artist covers more foreground than either short title.
  a.signature.fill(230, 400, 500);
  b.signature.fill(230, 400, 500);
  tracker.update([a], 0);
  tracker.update([b], .25);
  const rows = tracker.finish();
  assert.equal(rows.length, 2);
  assert.ok(rows.every(row => row.observations === 1));
});

test('a neighbouring row cannot consume the previous track even with an identical signature', () => {
  const tracker = createTracker();
  tracker.update([candidate(30, 100)], 0);
  tracker.update([candidate(30, 144)], .25);
  assert.equal(tracker.finish().length, 2);
});
