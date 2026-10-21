export type ArchitectureNode = { id: string; label: string; group?: string; detail?: string; status?: "normal" | "frozen" | "trainable" | "inactive"; position?: { x: number; y: number } };
export type ArchitectureEdge = { id?: string; from: string; to: string; label?: string; branch?: string; path?: "straight" | "curve" | "orthogonal" };
export type ArchitectureSpec = { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] };

export function validateArchitectureSpec(spec: ArchitectureSpec): string[] {
  const ids = new Set(spec.nodes.map((node) => node.id));
  const errors: string[] = [];
  if (!spec.nodes.length) errors.push("ArchitectureExplorer requires at least one node.");
  for (const node of spec.nodes) {
    if (node.position && (!Number.isFinite(node.position.x) || !Number.isFinite(node.position.y) || node.position.x < 0 || node.position.y < 0)) {
      errors.push(`Architecture node '${node.id}' has an invalid position; x and y must be finite, non-negative canvas coordinates.`);
    }
  }
  for (const edge of spec.edges) if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push(`Architecture edge '${edge.from} → ${edge.to}' references an unknown node.`);
  return errors;
}
