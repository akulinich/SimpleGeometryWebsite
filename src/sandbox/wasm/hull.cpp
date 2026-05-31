// 2D convex hull — own implementation (Andrew's monotone chain).
//
// This is the first algorithm moved across the JS↔Wasm boundary: deliberately
// simple, its job is to exercise the whole pipeline (worker → wasm → back), not
// to be something that *needs* C++.
//
// Boundary contract (bare extern "C", manual malloc/free — see marshalling.ts):
//   - input  : pts = [x0,y0, x1,y1, ...], n points, in a wasm-heap buffer.
//   - output : malloc'd float buffer [x0,y0, ...] of hull vertices, CCW order;
//              vertex count written to *out_count. Caller frees via free_buffer.

#include <emscripten.h>
#include <algorithm>
#include <cstdlib>
#include <cstring>
#include <vector>

extern "C" {

EMSCRIPTEN_KEEPALIVE
float* convex_hull(const float* pts, int n, int* out_count) {
  if (n < 3) {
    // Degenerate: the hull is just the points themselves.
    float* out = n > 0 ? static_cast<float*>(std::malloc(sizeof(float) * 2 * n)) : nullptr;
    if (n > 0) std::memcpy(out, pts, sizeof(float) * 2 * n);
    *out_count = n;
    return out;
  }

  std::vector<int> idx(n);
  for (int i = 0; i < n; ++i) idx[i] = i;

  auto px = [&](int i) { return pts[2 * i]; };
  auto py = [&](int i) { return pts[2 * i + 1]; };

  // Sort points lexicographically by (x, y).
  std::sort(idx.begin(), idx.end(), [&](int a, int b) {
    return px(a) < px(b) || (px(a) == px(b) && py(a) < py(b));
  });

  // Cross product of OA × OB; > 0 means counter-clockwise turn.
  auto cross = [&](int o, int a, int b) -> double {
    double ox = px(o), oy = py(o);
    return (px(a) - ox) * (py(b) - oy) - (py(a) - oy) * (px(b) - ox);
  };

  std::vector<int> hull(2 * n);
  int k = 0;

  // Build lower hull.
  for (int i = 0; i < n; ++i) {
    while (k >= 2 && cross(hull[k - 2], hull[k - 1], idx[i]) <= 0) --k;
    hull[k++] = idx[i];
  }

  // Build upper hull.
  for (int i = n - 2, lower = k + 1; i >= 0; --i) {
    while (k >= lower && cross(hull[k - 2], hull[k - 1], idx[i]) <= 0) --k;
    hull[k++] = idx[i];
  }

  const int m = k - 1; // last point repeats the first, drop it
  float* out = static_cast<float*>(std::malloc(sizeof(float) * 2 * m));
  for (int i = 0; i < m; ++i) {
    out[2 * i] = px(hull[i]);
    out[2 * i + 1] = py(hull[i]);
  }
  *out_count = m;
  return out;
}

EMSCRIPTEN_KEEPALIVE
void free_buffer(float* p) { std::free(p); }

} // extern "C"
