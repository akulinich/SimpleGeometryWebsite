// The ONE module that touches the wasm heap. Everything else — the worker, the
// editor — sees only plain typed-array functions and never knows wasm exists.
//
// Memory discipline (see hull.cpp for the C side):
//   - never cache Module.HEAPF32 — it detaches when the heap grows;
//   - pair every _malloc with _free in finally;
//   - copy results OUT with .slice() (a real copy), never .subarray() (a view).

import createModule, { type GeometryModule } from '../wasm/geometry.js';

let modulePromise: Promise<GeometryModule> | null = null;

function getModule(): Promise<GeometryModule> {
  return (modulePromise ??= createModule());
}

/** 2D convex hull. `points` is [x0,y0, x1,y1, ...]; returns hull vertices CCW. */
export async function convexHull(points: Float32Array): Promise<Float32Array> {
  const m = await getModule();
  const n = points.length / 2;

  const inPtr = m._malloc(points.length * 4); // 4 bytes per float
  const countPtr = m._malloc(4);
  try {
    m.HEAPF32.set(points, inPtr >> 2); // fresh view; >>2: byte ptr -> float index
    const outPtr = m._convex_hull(inPtr, n, countPtr);
    const count = m.HEAP32[countPtr >> 2];
    if (outPtr === 0 || count === 0) return new Float32Array(0);

    const result = m.HEAPF32.slice(outPtr >> 2, (outPtr >> 2) + count * 2);
    m._free_buffer(outPtr);
    return result;
  } finally {
    m._free(inPtr);
    m._free(countPtr);
  }
}
