import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import type { PrimitiveKind, SceneModel, SceneObject, Vec3, ViewMode } from '../model/types';

export type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface ViewportCallbacks {
  // Picking result (TS-side raycast).
  onSelect: (id: string | null) => void;
  // Fired once when a gizmo drag ends — the only time we write back to the model.
  onTransformCommit: (
    id: string,
    t: { position: Vec3; rotation: Vec3; scale: Vec3 },
  ) => void;
}

const SELECTED_EMISSIVE = 0x335599;
const CLICK_DRAG_THRESHOLD = 4; // px — beyond this a pointer move is an orbit, not a click

function makeGeometry(kind: PrimitiveKind): THREE.BufferGeometry {
  switch (kind) {
    case 'box':
      return new THREE.BoxGeometry(1, 1, 1);
    case 'sphere':
      return new THREE.SphereGeometry(0.5, 32, 16);
    case 'cylinder':
      return new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    case 'plane':
      return new THREE.PlaneGeometry(1, 1);
  }
}

// Expand 2D [x,y, ...] into 3D positions [x,y,0, ...] for three.js buffers.
function to3D(xy: Float32Array): Float32Array {
  const count = xy.length / 2;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3] = xy[i * 2];
    out[i * 3 + 1] = xy[i * 2 + 1];
    out[i * 3 + 2] = 0;
  }
  return out;
}

/**
 * Imperative three.js viewport. Owns the scene graph, camera, controls and the
 * id→mesh map. The React layer never touches three.js objects directly — it
 * pushes model snapshots through `sync()` and receives picking/transform events
 * through callbacks. Per-frame interaction (orbit, gizmo drag) stays here and
 * never round-trips through React state.
 */
export class Viewport {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly orbit: OrbitControls;
  private readonly gizmo: TransformControls;
  private readonly grid: THREE.GridHelper;
  private readonly raycaster = new THREE.Raycaster();
  private readonly meshes = new Map<string, THREE.Mesh>();
  private readonly demoGroup = new THREE.Group(); // transient hull-demo overlay

  private readonly resizeObserver: ResizeObserver;
  private rafId = 0;

  // Pointer tracking to tell a click (select) from an orbit drag.
  private pointerDown: { x: number; y: number } | null = null;
  private selectedId: string | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly callbacks: ViewportCallbacks,
  ) {
    const { clientWidth: w, clientHeight: h } = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(w, h);
    this.scene.background = new THREE.Color(0x1a1d23);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);

    this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbit.enableDamping = true;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 7);
    this.scene.add(dir);

    this.grid = new THREE.GridHelper(20, 20, 0x444c5a, 0x2c323c);
    this.scene.add(this.grid);
    this.scene.add(this.demoGroup);

    this.gizmo = new TransformControls(this.camera, this.renderer.domElement);
    // r169+: TransformControls is not an Object3D; its visual helper is added instead.
    this.scene.add(this.gizmo.getHelper());
    this.gizmo.addEventListener('dragging-changed', (e) => {
      this.orbit.enabled = !e.value;
    });
    this.gizmo.addEventListener('mouseUp', () => this.commitTransform());

    this.setViewMode('3d');

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);

    this.animate();
  }

  // ── Reconcile three.js scene with the canonical model ────────────────────
  sync(model: SceneModel): void {
    // Remove meshes whose objects no longer exist.
    for (const [id, mesh] of this.meshes) {
      if (!model.objects[id]) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.meshes.delete(id);
      }
    }

    // Add/update meshes from the model.
    for (const id of model.order) {
      const obj = model.objects[id];
      if (!obj) continue;
      let mesh = this.meshes.get(id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          makeGeometry(obj.kind),
          new THREE.MeshStandardMaterial(),
        );
        mesh.userData.id = id;
        this.meshes.set(id, mesh);
        this.scene.add(mesh);
      }
      this.applyObject(mesh, obj, model.selectedId === id);
    }

    this.updateGizmoTarget(model.selectedId);
    this.selectedId = model.selectedId;
  }

  private applyObject(mesh: THREE.Mesh, obj: SceneObject, selected: boolean): void {
    mesh.position.fromArray(obj.position);
    mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
    mesh.scale.fromArray(obj.scale);
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.color.set(obj.color);
    mat.emissive.setHex(selected ? SELECTED_EMISSIVE : 0x000000);
  }

  private updateGizmoTarget(selectedId: string | null): void {
    const mesh = selectedId ? this.meshes.get(selectedId) : undefined;
    if (mesh) this.gizmo.attach(mesh);
    else this.gizmo.detach();
  }

  setGizmoMode(mode: GizmoMode): void {
    this.gizmo.setMode(mode);
  }

  setViewMode(mode: ViewMode): void {
    if (mode === '3d') {
      this.camera.position.set(6, 5, 7);
      this.camera.up.set(0, 1, 0);
      this.orbit.enableRotate = true;
      this.grid.rotation.set(0, 0, 0); // grid in XZ plane
    } else {
      // 2D: camera looks down +Z at the XY plane.
      this.camera.position.set(0, 0, 10);
      this.camera.up.set(0, 1, 0);
      this.orbit.enableRotate = false;
      this.grid.rotation.set(Math.PI / 2, 0, 0); // grid into XY plane
    }
    this.orbit.target.set(0, 0, 0);
    this.camera.lookAt(0, 0, 0);
    this.orbit.update();
  }

  // ── Convex-hull demo overlay (computed in C++/wasm) ──────────────────────
  showHullDemo(points: Float32Array, hull: Float32Array): void {
    this.clearHullDemo();

    const cloudGeom = new THREE.BufferGeometry();
    cloudGeom.setAttribute('position', new THREE.BufferAttribute(to3D(points), 3));
    this.demoGroup.add(
      new THREE.Points(cloudGeom, new THREE.PointsMaterial({ color: 0xffce54, size: 0.14 })),
    );

    if (hull.length >= 4) {
      const hullGeom = new THREE.BufferGeometry();
      hullGeom.setAttribute('position', new THREE.BufferAttribute(to3D(hull), 3));
      this.demoGroup.add(
        new THREE.LineLoop(hullGeom, new THREE.LineBasicMaterial({ color: 0x4f8cff })),
      );
    }
  }

  clearHullDemo(): void {
    for (const child of [...this.demoGroup.children]) {
      this.demoGroup.remove(child);
      const obj = child as THREE.Points | THREE.LineLoop;
      obj.geometry.dispose();
      (obj.material as THREE.Material).dispose();
    }
  }

  // ── Picking ──────────────────────────────────────────────────────────────
  private onPointerDown = (e: PointerEvent): void => {
    this.pointerDown = { x: e.clientX, y: e.clientY };
  };

  private onPointerUp = (e: PointerEvent): void => {
    const down = this.pointerDown;
    this.pointerDown = null;
    if (!down || this.gizmo.dragging || this.gizmo.axis) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved > CLICK_DRAG_THRESHOLD) return; // it was an orbit, not a click

    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects([...this.meshes.values()], false);
    this.callbacks.onSelect(hits.length > 0 ? (hits[0].object.userData.id as string) : null);
  };

  private commitTransform(): void {
    if (!this.selectedId) return;
    const mesh = this.meshes.get(this.selectedId);
    if (!mesh) return;
    this.callbacks.onTransformCommit(this.selectedId, {
      position: mesh.position.toArray() as Vec3,
      rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
      scale: mesh.scale.toArray() as Vec3,
    });
  }

  // ── Loop / lifecycle ───────────────────────────────────────────────────────
  private animate = (): void => {
    this.rafId = requestAnimationFrame(this.animate);
    this.orbit.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize(): void {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.gizmo.dispose();
    this.orbit.dispose();
    this.clearHullDemo();
    for (const mesh of this.meshes.values()) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
