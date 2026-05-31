// Canonical scene model — the single source of truth.
// Deliberately independent of three.js: three.js objects are a *view* rebuilt
// from this model. Everything serializable lives here.

export type Vec3 = [number, number, number];

export type PrimitiveKind = 'box' | 'sphere' | 'cylinder' | 'plane';

export interface SceneObject {
  id: string;
  name: string;
  kind: PrimitiveKind;
  position: Vec3;
  rotation: Vec3; // Euler angles, radians
  scale: Vec3;
  color: string; // hex, e.g. '#4f8cff'
}

export interface SceneModel {
  objects: Record<string, SceneObject>;
  order: string[]; // object ids, controls scene-tree ordering
  selectedId: string | null;
}

export type ViewMode = '3d' | '2d';

export const PRIMITIVE_KINDS: PrimitiveKind[] = ['box', 'sphere', 'cylinder', 'plane'];

export function emptyScene(): SceneModel {
  return { objects: {}, order: [], selectedId: null };
}
