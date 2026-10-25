import type { AnchorId, CanonicalReferenceId, GrandAnimationStateId, PageId, PageTarget, RuntimeObjectId } from "../../contracts/ids";

export type ReferenceKind = "term" | "symbol" | "formula" | "dataset" | "environment" | "method" | "phase" | "evidence" | "confusion" | "implementation" | "advanced";
export type SourceCategory = "PAPER_FACT" | "PAPER_RESULT" | "AUTHOR_INTERPRETATION" | "GENERAL_BACKGROUND" | "MECHANISM_INTERPRETATION" | "IMPLEMENTATION_MAPPING" | "TEACHING_EXAMPLE" | "LIMITATION";
export type ReferenceDetail = { label: string; text: string; sourceRefs?: string[] };
export type ReferenceHoverCopy = {
  title: string;
  summary: string;
  role?: string;
  confusion?: string;
  detailsTitle?: string;
  details?: ReferenceDetail[];
};

export type ReferenceItem = {
  id: CanonicalReferenceId;
  kind: ReferenceKind;
  title: string;
  fullName?: string;
  summary: string;
  role: string;
  roleInEWC?: string;
  confusion?: string;
  sourceCategory?: SourceCategory;
  sourceRefs?: string[];
  relatedIds?: CanonicalReferenceId[];
  relatedPages?: PageTarget[];
  relatedAnimationStates?: GrandAnimationStateId[];
  keywords?: string[];
  tags?: string[];
  boundary?: string;
  details?: ReferenceDetail[];
  hoverCopy: ReferenceHoverCopy;
};

export type TermReference = ReferenceItem & {
  kind: "term";
  definition: string;
  paperRole?: string;
};

export type SymbolReference = ReferenceItem & {
  kind: "symbol";
  symbol: string;
  meaning: string;
  createdWhen?: string;
  usedWhen?: string;
  runtimeObject?: RuntimeObjectId;
  typicalShape?: string;
  trainable?: string;
  gradientSource?: string;
  optimizerMembership?: string;
};

export type FormulaReference = ReferenceItem & {
  kind: "formula";
  expression: string;
  meaning: string;
  variables: CanonicalReferenceId[];
  derivationFrom?: CanonicalReferenceId[];
  runtimeMapping?: RuntimeObjectId[];
  usedIn?: PageId[];
};

export type EvidenceReference = ReferenceItem & {
  kind: "evidence";
  claim: string;
  experiment: string;
  observedEvidence: string[];
  interpretation: string;
  boundary: string;
  sourceLocator: string;
};

export type AnyReference = ReferenceItem | TermReference | SymbolReference | FormulaReference | EvidenceReference;
export type ReferenceRegistry = Partial<Record<CanonicalReferenceId, AnyReference>>;
export type ReferenceApi = {
  openReference: (target: import("../../contracts/ids").OpenReferenceTarget) => void;
  openHub: (referenceId?: CanonicalReferenceId) => void;
  closeHub: () => void;
  navigatePage: (pageId: PageId) => void;
  currentPage: PageId;
  hubOpen: boolean;
  hubReferenceId?: CanonicalReferenceId;
  activeAnimationStateId?: GrandAnimationStateId;
  activeRuntimeObject?: RuntimeObjectId;
  setActiveRuntimeObject: (objectId?: RuntimeObjectId) => void;
};
