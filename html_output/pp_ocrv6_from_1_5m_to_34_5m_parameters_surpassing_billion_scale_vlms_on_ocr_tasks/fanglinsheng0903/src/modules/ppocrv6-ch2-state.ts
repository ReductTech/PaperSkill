import { useSyncExternalStore } from 'react';

export const RESOLUTION_SCALES = [0.35, 0.5, 0.71, 1, 1.41, 2, 2.83] as const;

export type RecognitionPolicy = 'prior' | 'visual';
export type ScenePreset = 'print' | 'blur' | 'rotate' | 'industrial' | 'display' | 'dot';
export type CropMargin = -2 | 0 | 2;
export type ResolutionScale = (typeof RESOLUTION_SCALES)[number];
export type PredictionChoice = 'TEH 2026' | 'THE 2026' | null;

export interface Chapter2SceneState {
  pressure: number;
  cropMargin: CropMargin;
  resolution: ResolutionScale;
  preset: ScenePreset;
  policy: RecognitionPolicy;
  predictionChoice: PredictionChoice;
  lessonRevealed: boolean;
}

export const DEFAULT_CHAPTER2_SCENE: Chapter2SceneState = {
  pressure: 18,
  cropMargin: 0,
  resolution: 1,
  preset: 'print',
  policy: 'prior',
  predictionChoice: null,
  lessonRevealed: false,
};

let sceneState = DEFAULT_CHAPTER2_SCENE;
const listeners = new Set<() => void>();

export function updateChapter2Scene(patch: Partial<Chapter2SceneState>) {
  sceneState = { ...sceneState, ...patch };
  listeners.forEach((listener) => listener());
}

export function resetChapter2Stress() {
  updateChapter2Scene({
    pressure: DEFAULT_CHAPTER2_SCENE.pressure,
    cropMargin: DEFAULT_CHAPTER2_SCENE.cropMargin,
    resolution: DEFAULT_CHAPTER2_SCENE.resolution,
    preset: DEFAULT_CHAPTER2_SCENE.preset,
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useChapter2Scene() {
  return useSyncExternalStore(subscribe, () => sceneState, () => sceneState);
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const resolutionPenalty: Record<ResolutionScale, number> = {
  0.35: 24,
  0.5: 16,
  0.71: 8,
  1: 0,
  1.41: 0,
  2: 1,
  2.83: 2,
};

const presetPenalty: Record<ScenePreset, number> = {
  print: 0,
  blur: 14,
  rotate: 12,
  industrial: 10,
  display: 9,
  dot: 16,
};

export type RiskLevel = 0 | 1 | 2;

export interface DerivedChapter2Scene {
  effectivePressure: number;
  pressureBand: '低' | '中' | '高' | '极高';
  predictedText: 'TEH 2026' | 'THE 2026';
  rewriteTriggered: boolean;
  localizationRisk: RiskLevel;
  rewriteRisk: RiskLevel;
  evidenceLoss: RiskLevel;
  bboxOffsetX: number;
  bboxOffsetY: number;
  blurPx: number;
  rotationDeg: number;
  characterSpacing: number;
  cropInset: number;
  backgroundNoise: number;
}

export function deriveChapter2Scene(state: Chapter2SceneState): DerivedChapter2Scene {
  const cropPenalty = state.cropMargin === -2 ? 22 : state.cropMargin === 2 ? 8 : 0;
  const effectivePressure = clamp(
    state.pressure + cropPenalty + resolutionPenalty[state.resolution] + presetPenalty[state.preset],
    0,
    100,
  );
  const localizationRisk: RiskLevel = effectivePressure >= 72 ? 2 : effectivePressure >= 38 ? 1 : 0;
  const evidenceScore =
    Math.max(0, effectivePressure - 48) +
    (state.cropMargin < 0 ? Math.abs(state.cropMargin) * 12 : 0) +
    (state.resolution <= 0.5 ? 15 : state.resolution === 0.71 ? 6 : 0);
  const evidenceLoss: RiskLevel = evidenceScore >= 48 ? 2 : evidenceScore >= 20 ? 1 : 0;
  const rewriteTriggered = effectivePressure >= 64;
  const rewriteRisk: RiskLevel = rewriteTriggered ? (evidenceLoss === 2 ? 2 : 1) : 0;
  const pressureBand = effectivePressure >= 82 ? '极高' : effectivePressure >= 62 ? '高' : effectivePressure >= 38 ? '中' : '低';
  const pressureRotation = effectivePressure >= 72 ? 4.5 : effectivePressure >= 48 ? 1.4 : 0;
  const presetRotation = state.preset === 'rotate' ? 8 : 0;
  const presetBlur = state.preset === 'blur' ? 2.4 : state.preset === 'dot' ? 0.8 : 0;

  return {
    effectivePressure,
    pressureBand,
    predictedText: rewriteTriggered ? 'THE 2026' : 'TEH 2026',
    rewriteTriggered,
    localizationRisk,
    rewriteRisk,
    evidenceLoss,
    bboxOffsetX: localizationRisk === 0 ? 0 : localizationRisk === 1 ? 10 : 23,
    bboxOffsetY: localizationRisk === 0 ? 0 : localizationRisk === 1 ? 5 : 11,
    blurPx: presetBlur + (effectivePressure >= 78 ? 1.8 : effectivePressure >= 50 ? 0.65 : 0) + (state.resolution <= 0.5 ? 1.1 : 0),
    rotationDeg: presetRotation + pressureRotation,
    characterSpacing: Math.max(-3.4, 1.2 - Math.max(0, effectivePressure - 55) * 0.075),
    cropInset: state.cropMargin === -2 ? 30 : state.cropMargin === 2 ? -44 : 0,
    backgroundNoise: clamp((effectivePressure >= 76 ? 0.62 : effectivePressure >= 48 ? 0.22 : 0) + (state.preset === 'industrial' ? 0.25 : 0), 0, 1),
  };
}
