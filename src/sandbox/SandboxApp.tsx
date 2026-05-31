import { useEffect, useRef, useState } from 'react';
import { useStore } from './model/store';
import { Viewport, type GizmoMode } from './viewport/Viewport';
import type { ViewMode } from './model/types';
import { Toolbar } from './ui/Toolbar';
import { SceneTree } from './ui/SceneTree';
import { Inspector } from './ui/Inspector';
import { convexHull } from './geometry/client';
import './sandbox.css';

const isEditableTarget = (el: EventTarget | null) =>
  el instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);

// Scatter n random points on the XY plane for the hull demo.
function randomPoints(n: number): Float32Array {
  const a = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    a[i * 2] = (Math.random() * 2 - 1) * 5;
    a[i * 2 + 1] = (Math.random() * 2 - 1) * 3.5;
  }
  return a;
}

export default function SandboxApp() {
  const viewportHost = useRef<HTMLDivElement>(null);
  const viewport = useRef<Viewport | null>(null);
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>('translate');
  const [viewMode, setViewMode] = useState<ViewMode>('3d');

  // Create the imperative viewport once and bridge it to the store.
  useEffect(() => {
    if (!viewportHost.current) return;
    const vp = new Viewport(viewportHost.current, {
      onSelect: (id) => useStore.getState().select(id),
      onTransformCommit: (id, t) => useStore.getState().setTransform(id, t),
    });
    viewport.current = vp;
    vp.sync(useStore.getState().scene);

    // Push model changes into three.js; this is the model → view sync point.
    const unsub = useStore.subscribe((s, prev) => {
      if (s.scene !== prev.scene) vp.sync(s.scene);
    });

    return () => {
      unsub();
      vp.dispose();
      viewport.current = null;
    };
  }, []);

  useEffect(() => viewport.current?.setGizmoMode(gizmoMode), [gizmoMode]);
  useEffect(() => viewport.current?.setViewMode(viewMode), [viewMode]);

  // Keyboard shortcuts (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) useStore.getState().redo();
        else useStore.getState().undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        useStore.getState().redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        useStore.getState().deleteSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Full round trip: TS makes points → worker → C++/wasm hull → three.js draws.
  const runHullDemo = async () => {
    const vp = viewport.current;
    if (!vp) return;
    const points = randomPoints(40);
    const hull = await convexHull(points);
    setViewMode('2d');
    vp.showHullDemo(points, hull);
  };

  const base = import.meta.env.BASE_URL;

  return (
    <div className="sb-root">
      <div className="sb-topbar">
        <a className="sb-home" href={base}>
          ← Simple Geometry
        </a>
        <span className="sb-title">Песочница</span>
      </div>

      <Toolbar
        gizmoMode={gizmoMode}
        setGizmoMode={setGizmoMode}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onHullDemo={runHullDemo}
      />

      <div className="sb-body">
        <div className="sb-viewport" ref={viewportHost} />
        <aside className="sb-side">
          <SceneTree />
          <Inspector />
        </aside>
      </div>
    </div>
  );
}
