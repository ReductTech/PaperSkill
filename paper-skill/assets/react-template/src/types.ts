// Data schema for a paper tutorial. The generator fills `src/data/tutorial.ts`
// with a `tutorial` object matching `TutorialData`. The `kind` fields are REQUIRED:
// validate-output.js counts chapters/modules via `kind: "chapter"` / `kind: "module"`
// so do not omit them.

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

export interface HeroSide {
  title?: string; // Source-grounded method/concept name shown above the cover animation.
  desc: string;
  componentId: string; // Cover animation widget reads useCoverPlayback().
}

export interface HeroConfig {
  oldMethod: HeroSide;
  newMethod: HeroSide;
}

export interface SymbolDef {
  sym: string;
  desc: string;
}

export interface FormulaDef {
  lead: string; // plain-language lead-in (Simplified Chinese)
  unicode: string; // Unicode/HTML formula, no KaTeX
  symbols: SymbolDef[];
}

export interface ModuleDef {
  kind: 'module';
  id: string; // e.g. "1.1"
  title: string;
  desc: string;
  componentId: string; // MUST match a key in src/modules/registry.tsx
}

/** One independently composed slide with one learning objective. */
export interface SceneDef {
  id: string;
  title: string;
  goal: string;
  summary: string;
  interaction: string;
  next: string;
  notes: string;
  /** Body component receives a fixed 1472 × 622 CSS pixel region. */
  /** Every scene supplies its own paper-specific body widget. */
  componentId: string;
  moduleId?: string;
  thumbnail?: string;
}

export interface ChapterDef {
  kind: 'chapter';
  id: string; // e.g. "chap-1"
  title: string;
  modules: ModuleDef[]; // Empty for evidence/boundary-only chapters; method coverage is deck-wide.
  scenes: SceneDef[];
}

export interface BiliDef {
  bvid: string; // "BV..." or "" if unused
  title: string;
  reason: string;
  /** Optional static cover URL (https). Baked in at generation time so the cover
   *  shows without depending on the runtime Bilibili metadata fetch. */
  cover?: string;
  /** Optional static view count string (e.g. "41.5万播放"), baked in at generation
   *  time so 播放量 shows without depending on the runtime metadata fetch. */
  views?: string;
}

export interface TutorialData {
  /** Optional preview images keyed by scene ID, including cover/videos. */
  thumbnails?: Record<string, string>;
  meta: Meta;
  hero: HeroConfig;
  chapters: ChapterDef[];
  bilibili?: BiliDef[];
}
