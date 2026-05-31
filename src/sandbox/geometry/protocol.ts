// Message protocol between the main thread (client.ts) and the worker (worker.ts).

export interface HullRequest {
  id: number;
  points: Float32Array; // [x0,y0, x1,y1, ...]
}

export interface HullResponse {
  id: number;
  hull: Float32Array; // hull vertices, CCW
}
