// Types for the emcc-generated geometry.js (see build.cmd). Only the surface
// the marshalling layer touches is declared.

export interface GeometryModule {
  _convex_hull(ptsPtr: number, n: number, outCountPtr: number): number;
  _free_buffer(ptr: number): void;
  _malloc(bytes: number): number;
  _free(ptr: number): void;
  // Typed-array views over the wasm heap. Re-fetch after any allocation — they
  // detach when the heap grows.
  readonly HEAPF32: Float32Array;
  readonly HEAP32: Int32Array;
}

export default function createModule(): Promise<GeometryModule>;
