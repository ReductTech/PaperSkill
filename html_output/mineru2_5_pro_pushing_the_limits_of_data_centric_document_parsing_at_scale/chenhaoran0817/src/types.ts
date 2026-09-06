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

// PaperSkill contract §2.3: each chapter is 引入节 (bridge + analogy) →
// 讲解节 (modules) → 总结节 (takeaways, exactly 3). §4: an analogy keeps one
// subject, one verb and one goal, and names a self-built visual scene.
export type AnalogyVisualId =
  | 'grocery-budget'
  | 'melon-picking'
  | 'answer-checking'
  | 'dish-tasting'
  | 'exam-prep'
  | 'puzzle-grading';

export interface Analogy {
  title: string;
  text: string;
  visual: AnalogyVisualId;
  /** Optional mini interaction embedded in the analogy band. */
  interaction?: 'add-cabbage' | 'same-teacher' | 'exam-steps';
}

export interface Takeaway {
  icon: string;
  title: string;
  desc: string;
}

export interface ChapterDef {
  kind: 'chapter';
  id: string;
  step: number;
  question: string;
  shortLabel: string;
  badge: Badge;
  badgeLabel: string;
  bridge: string;
  analogy: Analogy;
  problem: string;
  plainAnswer: string;
  modules: ModuleDef[];
  takeaways: readonly [Takeaway, Takeaway, Takeaway];
  evidence: EvidenceRef[];
  checkpoint: Checkpoint;
}

export interface TutorialData {
  meta: Meta;
  chapters: ChapterDef[];
}

export interface MediaCrop {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface MediaAsset {
  id: string;
  kind: 'paper-figure' | 'paper-page' | 'teaching-art' | 'external-video';
  src: string;
  width?: number;
  height?: number;
  alt: string;
  role: 'problem-example' | 'mechanism-diagram' | 'result-evidence';
  source?: {
    title: string;
    url: string;
    page?: number;
    figure?: string;
    licenseReview: 'pending' | 'verified';
  };
  allowedClaim: string;
  forbiddenClaims?: string[];
  crops?: Record<string, MediaCrop>;
}

export type PaperMediaVariant = 'card' | 'stage' | 'thumbnail';
export type PaperMediaViewerMode = 'full' | 'crop' | false;

export interface ExperienceStateChange {
  moduleId: string;
  state: string;
}

export interface ChapterExperienceProps {
  stepId: string;
  modules: readonly ModuleDef[];
  restoredModuleState?: ExperienceStateChange;
  onInteract: (moduleId: string) => void;
  onStateChange: (change: ExperienceStateChange) => void;
  onComplete: () => void;
}
