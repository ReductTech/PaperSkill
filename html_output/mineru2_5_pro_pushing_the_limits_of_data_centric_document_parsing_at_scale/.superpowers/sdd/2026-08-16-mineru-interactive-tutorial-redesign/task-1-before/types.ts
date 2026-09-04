// PaperSkill keeps the `kind` discriminators because its validator counts the
// tutorial's data units and active modules from src/data/tutorial.ts.

export type Badge = 'inf' | 'trn' | 'both';
export type EvidenceKind = 'paper' | 'teaching' | 'research';

export interface Meta {
  titleEn: string;
  titleZh: string;
  venue: string;
  authors: string;
  affiliation: string;
  domain: string;
  coreProblem: string;
  coreInsight: string;
  keywords: string[];
}

export interface EvidenceRef {
  kind: EvidenceKind;
  label: string;
  text: string;
  sourceLabel?: string;
  href?: string;
}

export interface Checkpoint {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface ModuleDef {
  kind: 'module';
  id: string;
  title: string;
  desc: string;
  componentId: string;
  terms: string[];
  specimen: string;
}

export interface ChapterDef {
  kind: 'chapter';
  id: string;
  step: number;
  question: string;
  shortLabel: string;
  badge: Badge;
  badgeLabel: string;
  problem: string;
  plainAnswer: string;
  modules: ModuleDef[];
  evidence: EvidenceRef[];
  checkpoint: Checkpoint;
}

export interface TutorialData {
  meta: Meta;
  chapters: ChapterDef[];
}
