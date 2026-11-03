import type { ReactNode } from "react";

export type ReferenceKind = "term" | "symbol" | "formula" | "dataset" | "method" | "evidence" | "advanced";

export type KnowledgeEntry = {
  id: string;
  kind: ReferenceKind;
  hover: {
    title: string;
    definitionZh: string;
    paperRoleZh?: string;
    confusionZh?: string;
  };
  reference: {
    titleEn: string;
    summaryEn: string;
    bodyEn?: ReactNode;
    relatedIds?: string[];
    relatedSection?: string;
    sourceRefs?: string[];
    tags?: string[];
  };
};

export type TermRefLabels = {
  definition: string;
  paperRole: string;
  easyToConfuse: string;
  openReference: string;
};

export function validateKnowledgeEntries(entries: KnowledgeEntry[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const entry of entries) {
    if (!entry.id.trim()) errors.push("An entry has an empty canonical ID.");
    if (ids.has(entry.id)) errors.push(`Duplicate canonical ID: ${entry.id}`);
    ids.add(entry.id);
    if (!entry.hover.title.trim() || !entry.hover.definitionZh.trim()) errors.push(`Missing Chinese hover content: ${entry.id}`);
    if (!entry.reference.titleEn.trim() || !entry.reference.summaryEn.trim()) errors.push(`Missing English reference content: ${entry.id}`);
  }
  for (const entry of entries) {
    for (const relatedId of entry.reference.relatedIds ?? []) {
      if (!ids.has(relatedId)) errors.push(`Unknown related ID ${relatedId} in ${entry.id}`);
    }
  }
  return errors;
}
