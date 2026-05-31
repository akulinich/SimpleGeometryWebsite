import { useRef } from 'react';
import { useStore } from '../model/store';
import { exportScene, importScene } from '../io/json';
import { PRIMITIVE_KINDS, type PrimitiveKind, type ViewMode } from '../model/types';
import type { GizmoMode } from '../viewport/Viewport';

const KIND_LABEL: Record<PrimitiveKind, string> = {
  box: 'Куб',
  sphere: 'Сфера',
  cylinder: 'Цилиндр',
  plane: 'Плоскость',
};

const GIZMO_LABEL: Record<GizmoMode, string> = {
  translate: 'Перемещение',
  rotate: 'Поворот',
  scale: 'Масштаб',
};

interface Props {
  gizmoMode: GizmoMode;
  setGizmoMode: (m: GizmoMode) => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function Toolbar({ gizmoMode, setGizmoMode, viewMode, setViewMode }: Props) {
  const addPrimitive = useStore((s) => s.addPrimitive);
  const deleteSelected = useStore((s) => s.deleteSelected);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const loadScene = useStore((s) => s.loadScene);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const hasSelection = useStore((s) => s.scene.selectedId !== null);

  const fileInput = useRef<HTMLInputElement>(null);

  const onExport = () => download('scene.json', exportScene(useStore.getState().scene));

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    try {
      loadScene(importScene(await file.text()));
    } catch (err) {
      alert(`Не удалось загрузить сцену: ${(err as Error).message}`);
    }
  };

  return (
    <div className="sb-toolbar">
      <span className="sb-group-label">Добавить:</span>
      {PRIMITIVE_KINDS.map((kind) => (
        <button key={kind} className="sb-btn" onClick={() => addPrimitive(kind)}>
          {KIND_LABEL[kind]}
        </button>
      ))}

      <span className="sb-sep" />
      {(Object.keys(GIZMO_LABEL) as GizmoMode[]).map((mode) => (
        <button
          key={mode}
          className={`sb-btn${gizmoMode === mode ? ' is-active' : ''}`}
          onClick={() => setGizmoMode(mode)}
        >
          {GIZMO_LABEL[mode]}
        </button>
      ))}

      <span className="sb-sep" />
      <button
        className={`sb-btn${viewMode === '3d' ? ' is-active' : ''}`}
        onClick={() => setViewMode('3d')}
      >
        3D
      </button>
      <button
        className={`sb-btn${viewMode === '2d' ? ' is-active' : ''}`}
        onClick={() => setViewMode('2d')}
      >
        2D
      </button>

      <span className="sb-sep" />
      <button className="sb-btn" onClick={undo} disabled={!canUndo}>
        ↶ Undo
      </button>
      <button className="sb-btn" onClick={redo} disabled={!canRedo}>
        ↷ Redo
      </button>
      <button className="sb-btn" onClick={deleteSelected} disabled={!hasSelection}>
        Удалить
      </button>

      <span className="sb-sep" />
      <button className="sb-btn" onClick={onExport}>
        Экспорт
      </button>
      <button className="sb-btn" onClick={() => fileInput.current?.click()}>
        Импорт
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={onImportFile}
      />
    </div>
  );
}
