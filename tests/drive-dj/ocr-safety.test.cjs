const test = require('node:test');
const assert = require('node:assert/strict');
const { context, plain } = require('./source.cjs');
const gates = ['diagArtistGuardBypassed', 'diagMbFailedThenFallback', 'diagGlobalExactNoPaddle', 'diagMergeCanonicalConflict'];
function diagnostics(row = {}, traces = []) {
  const report = { metrics: {}, rawRows: traces };
  const ctx = context(['normalText', 'finiteNumber', 'editTextScore', 'buildFinalVideoDiagnostics', 'videoDebugLightReport'], {
    videoDebugReport: report, ocrInspectionPolicy: {},
    // Only UI review helpers are stubbed; gate calculation and report export are production code.
    videoReviewPrimaryReason: () => '', rowNeedsReview: () => false, confirmedRowInspectionRisks: () => [],
  });
  ctx.buildFinalVideoDiagnostics([{ title: 'Song', artist: 'Artist', _canonicalMatch: true, ...row }]);
  return { report, exported: ctx.videoDebugLightReport(report) };
}
test('a clean canonical OCR row leaves all four diagnostic gates at zero', () => {
  const { report, exported } = diagnostics();
  for (const gate of gates) { assert.equal(report.metrics[gate], 0); assert.equal(exported.safetyGates[gate], 0); }
  assert.equal(report.finalRows[0].riskLevel, 'low');
});
const violations = [
  [gates[0], 'artist-guard-bypassed', { _debugTraceIds: [1] }, [{ traceId: 1, artistGuardBypassed: true }]],
  [gates[1], 'mb-failed-then-fallback', { _mbFailureReason: 'no-title-candidate', _canonicalReason: 'fallback' }, []],
  [gates[2], 'global-exact-no-paddle', { _canonicalReason: 'global exact title', _debugTraceIds: [1] }, [{ traceId: 1, paddleAttempted: false }]],
  [gates[3], 'merge-canonical-conflict', { _debugTraceIds: [1, 2] }, [
    { traceId: 1, finalCanonicalMatch: true, finalTitle: 'Song A', finalArtist: 'Artist' },
    { traceId: 2, finalCanonicalMatch: true, finalTitle: 'Song B', finalArtist: 'Artist' },
  ]],
];
for (const [gate, flag, row, traces] of violations) test(`${gate} detects a violation and survives diagnostic export`, () => {
  const { report, exported } = diagnostics(row, traces);
  for (const other of gates) assert.equal(exported.safetyGates[other], other === gate ? 1 : 0, other);
  assert.ok(report.finalRows[0].flags.includes(flag));
  assert.notEqual(report.finalRows[0].riskLevel, 'low');
});
test('Paddle attempt and matching canonical identities avoid false gate positives', () => {
  const { exported } = diagnostics({ _canonicalReason: 'global exact title', _debugTraceIds: [1, 2] }, [1, 2].map(traceId => ({
    traceId, paddleAttempted: true, finalCanonicalMatch: true, finalTitle: 'Song', finalArtist: 'Artist',
  })));
  assert.deepEqual(gates.map(gate => exported.safetyGates[gate]), [0, 0, 0, 0]);
});
test('empty diagnostic export defaults gates to zero and preserves report schema', () => {
  const ctx = context(['videoDebugLightReport'], { ocrInspectionPolicy: {} });
  assert.equal(ctx.videoDebugLightReport(null), null);
  const out = plain(ctx.videoDebugLightReport({}));
  assert.equal(out.format, 'drive-dj-ocr-diagnostics-lite-v8');
  for (const gate of gates) assert.equal(out.safetyGates[gate], 0);
});
