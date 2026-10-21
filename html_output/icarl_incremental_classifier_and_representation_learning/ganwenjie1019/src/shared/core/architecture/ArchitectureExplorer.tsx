import { useId, useMemo, useState } from "react";
import { createDiagramPath } from "../../foundation/layout/diagram";
import type { DiagramPoint } from "../../foundation/layout/diagram";
import type { ArchitectureSpec } from "./types";
import { validateArchitectureSpec } from "./types";

const nodeSize = { width: 220, height: 92 };

export function ArchitectureExplorer({ spec, highlightedIds = [], highlightedBranches = [], showStatus = true, onNodeSelect }: {
  spec: ArchitectureSpec;
  highlightedIds?: string[];
  highlightedBranches?: string[];
  showStatus?: boolean;
  onNodeSelect?: (nodeId: string) => void;
}) {
  const errors = useMemo(() => validateArchitectureSpec(spec), [spec]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const markerId = `rk-architecture-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const highlighted = new Set(highlightedIds);
  const branches = new Set(highlightedBranches);

  if (errors.length) return <div role="alert" className="rk-error"><strong>ArchitectureExplorer data needs attention</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>;

  const groups = Array.from(new Set(spec.nodes.map((node) => node.group ?? "System")));
  const groupedRows = groups.map((group) => spec.nodes.filter((node) => (node.group ?? "System") === group));
  const autoPositions = new Map<string, DiagramPoint>();
  groupedRows.forEach((nodes, row) => nodes.forEach((node, index) => autoPositions.set(node.id, { x: 160 + index * 270, y: 72 + row * 160 })));
  const positions = new Map(spec.nodes.map((node) => [node.id, node.position ?? autoPositions.get(node.id)!]));
  const visible = spec.nodes.filter((node) => !collapsed.includes(node.group ?? "System"));
  const width = Math.max(540, ...Array.from(positions.values(), (point) => point.x + nodeSize.width / 2 + 36));
  const height = Math.max(170, ...Array.from(positions.values(), (point) => point.y + nodeSize.height / 2 + 36));
  const visibleIds = new Set(visible.map((node) => node.id));
  const selected = spec.nodes.find((node) => node.id === selectedId);
  const toggleGroup = (group: string) => setCollapsed((items) => items.includes(group) ? items.filter((item) => item !== group) : [...items, group]);
  const branchNodes = new Set(spec.edges.filter((edge) => edge.branch && branches.has(edge.branch)).flatMap((edge) => [edge.from, edge.to]));
  const anyHighlight = highlighted.size > 0 || branches.size > 0;

  const groupBounds = (group: string) => {
    const members = visible.filter((node) => (node.group ?? "System") === group);
    if (!members.length) return null;
    const points = members.map((node) => positions.get(node.id)!);
    const left = Math.min(...points.map((point) => point.x - nodeSize.width / 2)) - 18;
    const top = Math.min(...points.map((point) => point.y - nodeSize.height / 2)) - 34;
    const right = Math.max(...points.map((point) => point.x + nodeSize.width / 2)) + 18;
    const bottom = Math.max(...points.map((point) => point.y + nodeSize.height / 2)) + 18;
    return { x: left, y: top, width: right - left, height: bottom - top };
  };

  return (
    <section className="rk-architecture" aria-label="Interactive architecture diagram">
      <div className="rk-architecture__group-controls">{groups.map((group) => <button key={group} type="button" className="rk-architecture__group-toggle" aria-expanded={!collapsed.includes(group)} onClick={() => toggleGroup(group)}>{collapsed.includes(group) ? "Expand" : "Collapse"} {group}</button>)}</div>
      <div className="rk-architecture__viewport" tabIndex={0} aria-label="Scrollable architecture diagram">
        <div className="rk-architecture__canvas" style={{ width: `${width}px`, height: `${height}px` }}>
          <svg className="rk-architecture__edges" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Architecture connections">
            <defs><marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
            <g className="rk-architecture__groups" aria-hidden="true">{groups.map((group) => { const bounds = groupBounds(group); return bounds ? <g key={group} className="rk-architecture__group-region"><rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} rx="14" /><text x={bounds.x + 12} y={bounds.y + 20}>{group}</text></g> : null; })}</g>
            {spec.edges.map((edge, index) => {
              if (!visibleIds.has(edge.from) || !visibleIds.has(edge.to)) return null;
              const from = positions.get(edge.from)!;
              const to = positions.get(edge.to)!;
              const path = createDiagramPath(from, to, nodeSize, nodeSize, edge.path ?? (from.y !== to.y ? "curve" : "straight"));
              const active = !anyHighlight || highlighted.has(edge.from) && highlighted.has(edge.to) || Boolean(edge.branch && branches.has(edge.branch));
              return <g key={edge.id ?? `${edge.from}-${edge.to}-${index}`} className={`rk-architecture__edge ${active ? "is-active" : "is-dimmed"}`} data-branch={edge.branch} data-from={edge.from} data-to={edge.to} data-path={edge.path ?? "auto"}><path d={path.d} markerEnd={`url(#${markerId})`} />{edge.label ? <text x={path.label.x} y={path.label.y - 6}>{edge.label}</text> : null}<title>{edge.label ?? `${edge.from} to ${edge.to}`}</title></g>;
            })}
          </svg>
          {visible.map((node) => {
            const point = positions.get(node.id)!;
            const active = !anyHighlight || highlighted.has(node.id) || branchNodes.has(node.id);
            return <button id={`architecture-node-${node.id}`} key={node.id} type="button" className={`rk-architecture__node rk-architecture__node--${node.status ?? "normal"} ${active ? "is-active" : "is-dimmed"} ${selectedId === node.id ? "is-selected" : ""}`} style={{ left: `${point.x}px`, top: `${point.y}px` }} aria-pressed={selectedId === node.id} onClick={() => { setSelectedId(node.id); onNodeSelect?.(node.id); }}><b>{node.label}</b>{node.group ? <small>{node.group}</small> : null}{showStatus && node.status && node.status !== "normal" ? <span className="rk-architecture__status">{node.status}</span> : null}</button>;
          })}
        </div>
      </div>
      <aside className="rk-architecture__inspector" aria-live="polite"><strong>{selected?.label ?? "Select a component"}</strong><p>{selected?.detail ?? "Inspect node ownership and the paths that connect components."}</p>{selected?.status ? <span className="rk-architecture__status">{selected.status}</span> : null}</aside>
      <p className="rk-architecture__legend">Frozen nodes preserve parameters; trainable nodes can change during optimization.</p>
    </section>
  );
}

export type { ArchitectureEdge, ArchitectureNode, ArchitectureSpec } from "./types";
