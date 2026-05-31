import { useStore } from '../model/store';

export function SceneTree() {
  const order = useStore((s) => s.scene.order);
  const objects = useStore((s) => s.scene.objects);
  const selectedId = useStore((s) => s.scene.selectedId);
  const select = useStore((s) => s.select);

  return (
    <div className="sb-section">
      <h3>Сцена</h3>
      {order.length === 0 ? (
        <div className="sb-tree-empty">Пусто. Добавь примитив на панели сверху.</div>
      ) : (
        <ul className="sb-tree">
          {order.map((id) => {
            const obj = objects[id];
            if (!obj) return null;
            return (
              <li
                key={id}
                className={`sb-tree-item${id === selectedId ? ' is-selected' : ''}`}
                onClick={() => select(id)}
              >
                <span className="sb-tree-kind">{obj.kind}</span>
                <span>{obj.name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
