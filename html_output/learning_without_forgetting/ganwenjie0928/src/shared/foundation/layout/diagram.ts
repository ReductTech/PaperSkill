export type DiagramPoint = { x: number; y: number };
export type DiagramNodeSize = { width: number; height: number };
export type DiagramPathMode = "straight" | "curve" | "orthogonal";
export type DiagramPath = { d: string; label: DiagramPoint };

function boundaryPoint(center: DiagramPoint, toward: DiagramPoint, size: DiagramNodeSize): DiagramPoint {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const scale = 1 / Math.max(Math.abs(dx) / (size.width / 2), Math.abs(dy) / (size.height / 2), 0.0001);
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

export function createDiagramPath(
  source: DiagramPoint,
  target: DiagramPoint,
  sourceSize: DiagramNodeSize,
  targetSize: DiagramNodeSize,
  mode: DiagramPathMode = "straight",
): DiagramPath {
  const start = boundaryPoint(source, target, sourceSize);
  const end = boundaryPoint(target, source, targetSize);
  const distance = Math.hypot(end.x - start.x, end.y - start.y);

  if (mode === "orthogonal") {
    if (end.x <= start.x) {
      const gutterY = Math.min(start.y, end.y) - 64;
      return { d: `M ${start.x} ${start.y} L ${start.x} ${gutterY} L ${end.x} ${gutterY} L ${end.x} ${end.y}`, label: { x: (start.x + end.x) / 2, y: gutterY } };
    }
    const middleX = (start.x + end.x) / 2;
    return { d: `M ${start.x} ${start.y} L ${middleX} ${start.y} L ${middleX} ${end.y} L ${end.x} ${end.y}`, label: { x: middleX, y: (start.y + end.y) / 2 } };
  }

  if (mode === "curve") {
    const middleX = (start.x + end.x) / 2;
    const middleY = (start.y + end.y) / 2;
    const loopBack = end.x <= start.x;
    const offset = Math.min(76, Math.max(30, distance * 0.16));
    const control = loopBack
      ? { x: middleX, y: Math.min(start.y, end.y) - offset }
      : { x: middleX, y: middleY - offset };
    return {
      d: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
      label: { x: (start.x + 2 * control.x + end.x) / 4, y: (start.y + 2 * control.y + end.y) / 4 },
    };
  }

  return { d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`, label: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 } };
}
