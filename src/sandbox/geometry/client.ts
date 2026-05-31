// Main-thread API for the geometry worker. The editor calls `convexHull()` and
// awaits a Float32Array — it never sees the worker or wasm.

import HullWorker from './worker?worker';
import type { HullRequest, HullResponse } from './protocol';

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, (hull: Float32Array) => void>();

function ensureWorker(): Worker {
  if (!worker) {
    worker = new HullWorker();
    worker.onmessage = (e: MessageEvent<HullResponse>) => {
      const { id, hull } = e.data;
      const resolve = pending.get(id);
      if (resolve) {
        pending.delete(id);
        resolve(hull);
      }
    };
  }
  return worker;
}

export function convexHull(points: Float32Array): Promise<Float32Array> {
  const w = ensureWorker();
  const id = ++seq;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    // No transfer of `points`: the caller keeps it (e.g. to draw the cloud). The
    // input is structured-cloned across the boundary — cheap at this scale, and
    // exactly the "copy geometry each call" choice from the plan.
    const request: HullRequest = { id, points };
    w.postMessage(request);
  });
}
