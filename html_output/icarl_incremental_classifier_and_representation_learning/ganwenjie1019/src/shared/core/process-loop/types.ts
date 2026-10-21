export type ProcessNode = {
  id: string;
  label: string;
  kind?: "input" | "module" | "parameter" | "output" | "loss" | "memory" | "state";
  group?: string;
  description?: string;
  position?: { x: number; y: number };
};

export type ProcessEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  kind?: "data" | "gradient" | "control" | "memory";
  path?: "straight" | "curve" | "orthogonal";
  direction?: "forward" | "reverse";
};

export type ProcessStep = {
  id: string;
  title: string;
  summary: string;
  activeNodes?: string[];
  activeEdges?: string[];
  dimNodes?: string[];
  annotations?: { target: string; text: string }[];
  detail?: { title: string; bullets: string[] };
};

export type ProcessLoopSpec = { nodes: ProcessNode[]; edges: ProcessEdge[]; steps: ProcessStep[] };

export function validateProcessLoopSpec(spec: ProcessLoopSpec): string[] {
  const nodeIds = new Set(spec.nodes.map((node) => node.id));
  const stepIds = new Set<string>();
  const problems: string[] = [];
  if (!spec.nodes.length) problems.push("ProcessLoopExplorer requires at least one node.");
  if (!spec.steps.length) problems.push("ProcessLoopExplorer requires at least one step.");
  for (const edge of spec.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) problems.push(`Edge '${edge.id}' references an unknown node ('${edge.from}' → '${edge.to}').`);
  }
  for (const node of spec.nodes) {
    if (node.position && (!Number.isFinite(node.position.x) || !Number.isFinite(node.position.y) || node.position.x < 0 || node.position.y < 0)) {
      problems.push(`Node '${node.id}' has an invalid position; x and y must be finite, non-negative canvas coordinates.`);
    }
  }
  for (const step of spec.steps) {
    if (stepIds.has(step.id)) problems.push(`Duplicate process step id '${step.id}'.`);
    stepIds.add(step.id);
    for (const id of [...(step.activeNodes ?? []), ...(step.dimNodes ?? []), ...(step.annotations ?? []).map((item) => item.target)]) {
      if (!nodeIds.has(id)) problems.push(`Step '${step.id}' references unknown node '${id}'.`);
    }
    for (const id of step.activeEdges ?? []) {
      if (!spec.edges.some((edge) => edge.id === id)) problems.push(`Step '${step.id}' references unknown edge '${id}'.`);
    }
  }
  return problems;
}
