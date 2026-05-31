import { create } from 'zustand';
import { applyPatches, enablePatches, produceWithPatches, type Patch } from 'immer';
import {
  emptyScene,
  type PrimitiveKind,
  type SceneModel,
  type SceneObject,
  type Vec3,
} from './types';

enablePatches();

// One reversible edit: `redo` re-applies it, `undo` reverts it.
interface HistoryEntry {
  redo: Patch[];
  undo: Patch[];
}

interface SandboxState {
  scene: SceneModel;
  past: HistoryEntry[];
  future: HistoryEntry[];

  // Commands (recorded in history)
  addPrimitive: (kind: PrimitiveKind) => void;
  deleteSelected: () => void;
  setTransform: (id: string, t: Partial<Pick<SceneObject, 'position' | 'rotation' | 'scale'>>) => void;
  rename: (id: string, name: string) => void;
  setColor: (id: string, color: string) => void;
  loadScene: (scene: SceneModel) => void;

  // Selection (NOT recorded — selecting shouldn't pollute undo)
  select: (id: string | null) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const DEFAULT_COLOR = '#4f8cff';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function nextName(scene: SceneModel, kind: PrimitiveKind): string {
  const count = scene.order.filter((id) => scene.objects[id]?.kind === kind).length;
  return `${capitalize(kind)} ${count + 1}`;
}

export const useStore = create<SandboxState>((set, get) => {
  // Records a mutation and its inverse so undo/redo can replay it.
  const commit = (recipe: (draft: SceneModel) => void) =>
    set((state) => {
      const [scene, redo, undo] = produceWithPatches(state.scene, recipe);
      if (redo.length === 0) return {};
      return { scene, past: [...state.past, { redo, undo }], future: [] };
    });

  return {
    scene: emptyScene(),
    past: [],
    future: [],

    addPrimitive: (kind) =>
      commit((draft) => {
        const id = crypto.randomUUID();
        const obj: SceneObject = {
          id,
          name: nextName(draft, kind),
          kind,
          position: [0, kind === 'plane' ? 0 : 0.5, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: DEFAULT_COLOR,
        };
        draft.objects[id] = obj;
        draft.order.push(id);
        draft.selectedId = id;
      }),

    deleteSelected: () =>
      commit((draft) => {
        const id = draft.selectedId;
        if (!id || !draft.objects[id]) return;
        delete draft.objects[id];
        draft.order = draft.order.filter((x) => x !== id);
        draft.selectedId = null;
      }),

    setTransform: (id, t) =>
      commit((draft) => {
        const obj = draft.objects[id];
        if (!obj) return;
        if (t.position) obj.position = [...t.position] as Vec3;
        if (t.rotation) obj.rotation = [...t.rotation] as Vec3;
        if (t.scale) obj.scale = [...t.scale] as Vec3;
      }),

    rename: (id, name) =>
      commit((draft) => {
        const obj = draft.objects[id];
        if (obj) obj.name = name;
      }),

    setColor: (id, color) =>
      commit((draft) => {
        const obj = draft.objects[id];
        if (obj) obj.color = color;
      }),

    loadScene: (scene) => set({ scene, past: [], future: [] }),

    select: (id) =>
      set((state) =>
        state.scene.selectedId === id ? {} : { scene: { ...state.scene, selectedId: id } },
      ),

    undo: () =>
      set((state) => {
        const entry = state.past.at(-1);
        if (!entry) return {};
        return {
          scene: applyPatches(state.scene, entry.undo),
          past: state.past.slice(0, -1),
          future: [entry, ...state.future],
        };
      }),

    redo: () =>
      set((state) => {
        const [entry, ...rest] = state.future;
        if (!entry) return {};
        return {
          scene: applyPatches(state.scene, entry.redo),
          past: [...state.past, entry],
          future: rest,
        };
      }),

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  };
});
