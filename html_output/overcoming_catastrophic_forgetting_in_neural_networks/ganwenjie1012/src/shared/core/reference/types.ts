import type { ReactNode } from "react";

export type ReferenceKind = "term" | "symbol" | "formula" | "dataset" | "method" | "evidence" | "implementation" | "advanced";

export type TermDefinition = {
  id: string;
  label: string;
  fullName?: string;
  definition: string;
  paperRole?: string;
  confusion?: string;
  sourceKind?: string;
};

export type ReferenceItem = {
  id: string;
  title: string;
  kind: ReferenceKind;
  summary: string;
  content?: ReactNode;
  relatedSection?: string;
  tags?: string[];
};
