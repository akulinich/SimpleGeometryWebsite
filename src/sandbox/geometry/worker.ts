/// <reference lib="webworker" />
// Geometry worker: keeps heavy compute off the UI thread. The wasm module lives
// here (loaded lazily by marshalling.ts on first call) and stays single-threaded
// — no pthreads, per the MVP plan.

import { convexHull } from './marshalling';
import type { HullRequest, HullResponse } from './protocol';

self.onmessage = async (e: MessageEvent<HullRequest>) => {
  const { id, points } = e.data;
  const hull = await convexHull(points);
  const response: HullResponse = { id, hull };
  // Transfer the result buffer back (zero-copy at the postMessage boundary).
  (self as DedicatedWorkerGlobalScope).postMessage(response, [hull.buffer]);
};
