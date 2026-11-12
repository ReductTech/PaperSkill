const LAYERS = [3, 5, 3].map((size, layer) =>
  Array.from({ length: size }, (_, node) => ({ x: 30 + layer * 72, y: 22 + (5 - size) * 15 + node * 30 })));
const EDGES = LAYERS.slice(0, -1).flatMap((nodes, layer) =>
  nodes.flatMap(source => LAYERS[layer + 1].map(target => ({ source, target, layer }))));

export function ClassifierMotion({ phase, position }: { phase: number; position: number }) {
  return <div className="classifier-motion">
    <svg viewBox="0 0 205 166" role="img" aria-label="三层全连接分类器示意，节点数依次为 3、5、3">
      {EDGES.map(({source, target, layer}, i) => {
        const progress = Math.max(0, Math.min(1, (position - layer * 900 - i % 5 * 34) / 1060));
        return <g key={i}>
          <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} className={phase === 1 ? "trained-edge" : "network-edge"} />
          {progress > 0 && progress < 1 && <circle className={phase === 1 ? "network-pulse trained-pulse" : "network-pulse"} r="2.6"
            cx={source.x + (target.x - source.x) * progress} cy={source.y + (target.y - source.y) * progress} />}
        </g>;
      })}
      {LAYERS.flatMap((nodes, layer) => nodes.map(({x,y}, node) =>
        <circle key={layer + ":" + node} cx={x} cy={y} r="6.5" className="network-node" />))}
    </svg>
    <span className="network-shape">3 → 5 → 3</span>
  </div>;
}
