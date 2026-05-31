import { useEffect, useState } from 'react';
import { useStore } from '../model/store';
import type { SceneObject, Vec3 } from '../model/types';

const fmt = (n: number) => String(Number(n.toFixed(3)));
const rad2deg = (r: number) => (r * 180) / Math.PI;
const deg2rad = (d: number) => (d * Math.PI) / 180;

// Text-backed number input: lets you type freely, commits on blur/Enter only.
function NumberField({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [text, setText] = useState(fmt(value));
  useEffect(() => setText(fmt(value)), [value]);

  const commit = () => {
    const n = parseFloat(text);
    if (Number.isFinite(n) && n !== value) onCommit(n);
    else setText(fmt(value));
  };

  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

function Vec3Field({
  label,
  values,
  onCommitAxis,
}: {
  label: string;
  values: Vec3;
  onCommitAxis: (axis: 0 | 1 | 2, value: number) => void;
}) {
  return (
    <div className="sb-field">
      <label>{label}</label>
      <div className="sb-vec3">
        {([0, 1, 2] as const).map((axis) => (
          <NumberField key={axis} value={values[axis]} onCommit={(n) => onCommitAxis(axis, n)} />
        ))}
      </div>
    </div>
  );
}

export function Inspector() {
  const obj = useStore((s): SceneObject | null =>
    s.scene.selectedId ? s.scene.objects[s.scene.selectedId] ?? null : null,
  );
  const setTransform = useStore((s) => s.setTransform);
  const setColor = useStore((s) => s.setColor);
  const rename = useStore((s) => s.rename);

  if (!obj) {
    return (
      <div className="sb-section">
        <h3>Inspector</h3>
        <div className="sb-empty">Ничего не выбрано.</div>
      </div>
    );
  }

  const updateAxis =
    (field: 'position' | 'rotation' | 'scale') => (axis: 0 | 1 | 2, value: number) => {
      const next = [...obj[field]] as Vec3;
      next[axis] = value;
      setTransform(obj.id, { [field]: next });
    };

  return (
    <div className="sb-section">
      <h3>Inspector</h3>
      <div className="sb-inspector">
        <div className="sb-field">
          <label>Имя</label>
          <input
            className="sb-input"
            value={obj.name}
            onChange={(e) => rename(obj.id, e.target.value)}
          />
        </div>

        <Vec3Field label="Позиция" values={obj.position} onCommitAxis={updateAxis('position')} />

        <Vec3Field
          label="Поворот (°)"
          values={obj.rotation.map(rad2deg) as Vec3}
          onCommitAxis={(axis, deg) => updateAxis('rotation')(axis, deg2rad(deg))}
        />

        <Vec3Field label="Масштаб" values={obj.scale} onCommitAxis={updateAxis('scale')} />

        <div className="sb-field">
          <label>Цвет</label>
          <div className="sb-color-row">
            <input
              type="color"
              value={obj.color}
              onChange={(e) => setColor(obj.id, e.target.value)}
            />
            <span>{obj.color}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
