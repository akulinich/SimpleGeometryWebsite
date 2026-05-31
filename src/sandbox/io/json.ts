import { PRIMITIVE_KINDS, type SceneModel, type SceneObject, type Vec3 } from '../model/types';

// On-disk format. Versioned so we can migrate later without guessing.
interface SceneFile {
  format: 'simple-geometry-sandbox';
  version: 1;
  objects: SceneObject[];
}

export function exportScene(scene: SceneModel): string {
  const file: SceneFile = {
    format: 'simple-geometry-sandbox',
    version: 1,
    objects: scene.order.map((id) => scene.objects[id]).filter(Boolean),
  };
  return JSON.stringify(file, null, 2);
}

const isVec3 = (v: unknown): v is Vec3 =>
  Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number' && Number.isFinite(n));

function parseObject(raw: unknown): SceneObject {
  if (typeof raw !== 'object' || raw === null) throw new Error('object must be an object');
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string') throw new Error('object.id must be a string');
  if (!PRIMITIVE_KINDS.includes(o.kind as never)) throw new Error(`unknown kind: ${String(o.kind)}`);
  if (!isVec3(o.position) || !isVec3(o.rotation) || !isVec3(o.scale)) {
    throw new Error('position/rotation/scale must be [x, y, z]');
  }
  return {
    id: o.id,
    name: typeof o.name === 'string' ? o.name : o.kind as string,
    kind: o.kind as SceneObject['kind'],
    position: o.position,
    rotation: o.rotation,
    scale: o.scale,
    color: typeof o.color === 'string' ? o.color : '#4f8cff',
  };
}

export function importScene(text: string): SceneModel {
  const data = JSON.parse(text) as unknown;
  if (typeof data !== 'object' || data === null) throw new Error('root must be an object');
  const file = data as Record<string, unknown>;
  if (file.format !== 'simple-geometry-sandbox') throw new Error('not a sandbox scene file');
  if (!Array.isArray(file.objects)) throw new Error('objects must be an array');

  const objects: Record<string, SceneObject> = {};
  const order: string[] = [];
  for (const raw of file.objects) {
    const obj = parseObject(raw);
    objects[obj.id] = obj;
    order.push(obj.id);
  }
  return { objects, order, selectedId: null };
}
