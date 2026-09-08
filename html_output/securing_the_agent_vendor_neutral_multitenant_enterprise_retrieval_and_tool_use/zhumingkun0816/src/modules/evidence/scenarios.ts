export type Tenant = 'Finance' | 'Engineering' | 'Legal';

export interface QueryAnchor {
  id: 'budget' | 'incident' | 'contract';
  label: string;
  position: number;
}

export interface ScenarioDocument {
  id: string;
  title: string;
  tenant: Tenant;
  anchor: number;
  relevanceScore: number;
}

export const LIBRARY_SCENARIO = {
  illustrative: true,
  activeTenant: 'Finance' as Tenant,
  queryAnchors: [
    { id: 'budget', label: '预算问题', position: 0.08 },
    { id: 'incident', label: '事故问题', position: 0.5 },
    { id: 'contract', label: '合同问题', position: 0.92 },
  ] satisfies QueryAnchor[],
  documents: [
    { id: 'finance-budget', title: 'Q4 预算', tenant: 'Finance', anchor: 0.08, relevanceScore: 86 },
    { id: 'engineering-incident', title: '事故复盘', tenant: 'Engineering', anchor: 0.5, relevanceScore: 76 },
    { id: 'legal-contract', title: '并购合同', tenant: 'Legal', anchor: 0.92, relevanceScore: 95 },
    { id: 'finance-travel', title: '差旅制度', tenant: 'Finance', anchor: 0.2, relevanceScore: 63 },
  ] satisfies ScenarioDocument[],
} as const;

export const SHARED_INFERENCE_SCENARIO = {
  illustrative: true,
  tenants: ['Finance', 'Engineering', 'Legal'] as const,
  activeTenant: 'Finance' as Tenant,
  authorizedContext: {
    Finance: 'Finance 预算片段',
    Engineering: 'Engineering 事故片段',
    Legal: 'Legal 合同片段',
  },
} as const;

export function illustrativeSimilarity(queryPosition: number, documentAnchor: number): number {
  return Math.max(0, 1 - Math.abs(queryPosition - documentAnchor) / 0.55);
}
