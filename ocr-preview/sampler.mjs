// Candidate sampling only. Track IDs are observations, never song identities.
// Geometry targets the supplied iPad portrait recordings, scaled to 320 x 460.
const SIGNATURE_WIDTH = 64;
const SIGNATURE_HEIGHT = 12;

function luminance(data, offset) {
  return (data[offset] * 299 + data[offset + 1] * 587 + data[offset + 2] * 114) / 1000;
}

function signatureAndSharpness(image, x0, y0, x1, y1) {
  const width = x1 - x0, height = y1 - y0;
  const gray = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      gray[y * width + x] = luminance(image.data, ((y0 + y) * image.width + x0 + x) * 4);
    }
  }
  // Area average avoids aliasing when creating the tiny tracking signature.
  const signature = new Uint8Array(SIGNATURE_WIDTH * SIGNATURE_HEIGHT);
  for (let dy = 0; dy < SIGNATURE_HEIGHT; dy++) {
    const top = dy * height / SIGNATURE_HEIGHT, bottom = (dy + 1) * height / SIGNATURE_HEIGHT;
    for (let dx = 0; dx < SIGNATURE_WIDTH; dx++) {
      const left = dx * width / SIGNATURE_WIDTH, right = (dx + 1) * width / SIGNATURE_WIDTH;
      let sum = 0, area = 0;
      for (let sy = Math.floor(top); sy < Math.ceil(bottom); sy++) {
        for (let sx = Math.floor(left); sx < Math.ceil(right); sx++) {
          const weight = (Math.min(bottom, sy + 1) - Math.max(top, sy))
            * (Math.min(right, sx + 1) - Math.max(left, sx));
          sum += gray[sy * width + sx] * weight;
          area += weight;
        }
      }
      signature[dy * SIGNATURE_WIDTH + dx] = Math.round(sum / area);
    }
  }
  let edges = 0, samples = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      edges += Math.abs(4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - width] - gray[i + width]);
      samples++;
    }
  }
  return { signature, sharpness: samples ? edges / samples : 0 };
}

export function findRowCandidates(image) {
  const { width, height, data } = image || {};
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 64 || height < 64
    || !data || data.length < width * height * 4) throw new TypeError('Valid RGBA ImageData is required');
  const x0 = Math.round(width * .773), x1 = Math.round(width * .818);
  const y0 = Math.round(height * .112), y1 = Math.round(height * .884);
  const bands = [];
  let start = null;
  for (let y = y0; y <= y1; y++) {
    let count = 0;
    if (y !== y1) {
      for (let x = x0; x < x1; x++) {
        const i = (y * width + x) * 4;
        const maximum = Math.max(data[i], data[i + 1], data[i + 2]);
        const minimum = Math.min(data[i], data[i + 1], data[i + 2]);
        if (maximum > 100 && maximum - minimum > 48) count++;
      }
    }
    if (count >= 3 && start === null) start = y;
    else if (count < 3 && start !== null) {
      if (y - start >= 2 && y - start <= Math.round(width * .035)) bands.push({ top: start, bottom: y, y: (start + y) / 2 });
      start = null;
    }
  }
  // Require the recurring row spacing. This rejects arbitrary colored icons,
  // but is not a semantic control-center detector or a proof of completeness.
  const supported = bands.filter((band, i) => bands.some((other, j) => i !== j
    && Math.abs(Math.abs(band.y - other.y) - height * .095) <= height * .009));
  if (supported.length < 3) return [];
  const result = [];
  for (const band of supported) {
    const top = Math.round(band.y - width * .041), bottom = Math.round(band.y + width * .016);
    if (top < y0 || bottom > y1) continue;
    const descriptor = signatureAndSharpness(image, Math.round(width * .182), top, Math.round(width * .65), bottom);
    result.push({ ...band, ...descriptor });
  }
  return result;
}

function distance(a, b) {
  if (!a || !b || a.length !== b.length || !a.length) return Infinity;
  // Background pixels must not drown out different short titles. Compare the
  // union of visible foreground in each half separately, so a shared artist
  // cannot hide a changed title. Ambiguous tracks may split; they never merge
  // later on semantic assumptions.
  let worst = 0;
  for (let start = 0; start < a.length; start += a.length / 2) {
    const end = start + a.length / 2;
    let floorA = 255, floorB = 255, sum = 0, foregroundSum = 0, foregroundCount = 0;
    for (let i = start; i < end; i++) {
      floorA = Math.min(floorA, a[i]);
      floorB = Math.min(floorB, b[i]);
    }
    for (let i = start; i < end; i++) {
      const difference = Math.abs(a[i] - b[i]);
      sum += difference;
      if (a[i] > floorA + 24 || b[i] > floorB + 24) {
        foregroundSum += difference;
        foregroundCount++;
      }
    }
    worst = Math.max(worst, foregroundCount ? foregroundSum / foregroundCount : sum / (end - start));
  }
  return worst;
}

function metadata(track) {
  const { signature, y, ...record } = track;
  return { ...record, stable: record.best_stable };
}

export function createTracker({ height = 460, maxActive = 32, maxGap = .65 } = {}) {
  if (!(height > 0) || !(maxGap >= 0) || !Number.isInteger(maxActive) || maxActive < 1 || maxActive > 32) {
    throw new RangeError('height/maxGap must be valid; maxActive must be 1 to 32');
  }
  let active = [], completed = [], nextId = 1, lastTime = -Infinity, maximumActive = 0, finished = false;
  const complete = track => completed.push(metadata(track));
  return {
    update(candidates, time) {
      if (finished) throw new Error('Tracker is finished');
      if (!Number.isFinite(time) || time < lastTime) throw new RangeError('Frame times must be finite and chronological');
      lastTime = time;
      active = active.filter(track => {
        if (time - track.last_time > maxGap) { complete(track); return false; }
        return true;
      });
      const used = new Set();
      for (const candidate of candidates) {
        if (!Number.isFinite(candidate.y) || !Number.isFinite(candidate.sharpness)
          || !(candidate.signature instanceof Uint8Array) || candidate.signature.length !== 768) {
          throw new TypeError('Invalid row candidate');
        }
        let track = null, bestDistance = Infinity;
        for (const possible of active) {
          // Less than half the observed row spacing: rapid scrolls create new
          // candidates instead of borrowing a neighbouring song's track.
          if (used.has(possible.id) || Math.abs(candidate.y - possible.y) > height * .04) continue;
          const difference = distance(candidate.signature, possible.signature);
          if (difference < bestDistance) { track = possible; bestDistance = difference; }
        }
        if (track && bestDistance < 15) {
          const stable = Math.abs(candidate.y - track.y) < height * .018 && bestDistance < 9;
          track.stable_pairs += Number(stable);
          track.observations++;
          track.last_time = time;
          track.y = candidate.y;
          track.signature = candidate.signature.slice();
          if (stable && (!track.best_stable || candidate.sharpness > track.best_sharpness)) {
            Object.assign(track, { best_time: time, best_y: candidate.y, best_sharpness: candidate.sharpness, best_stable: true });
          }
        } else {
          if (active.length === maxActive) {
            let oldest = 0;
            for (let i = 1; i < active.length; i++) if (active[i].last_time < active[oldest].last_time) oldest = i;
            complete(active.splice(oldest, 1)[0]);
          }
          track = { id: nextId++, first_time: time, last_time: time, y: candidate.y,
            signature: candidate.signature.slice(), observations: 1, stable_pairs: 0,
            best_time: time, best_y: candidate.y, best_sharpness: candidate.sharpness, best_stable: false };
          active.push(track);
        }
        used.add(track.id);
      }
      maximumActive = Math.max(maximumActive, active.length);
      return { active: active.length, completed: completed.length, max_active: maximumActive };
    },
    finish() {
      if (!finished) {
        active.forEach(complete);
        active = [];
        completed.sort((a, b) => a.first_time - b.first_time || a.id - b.id);
        finished = true;
      }
      return completed.map(record => ({ ...record }));
    },
    get stats() { return { active: active.length, completed: completed.length, max_active: maximumActive }; }
  };
}
