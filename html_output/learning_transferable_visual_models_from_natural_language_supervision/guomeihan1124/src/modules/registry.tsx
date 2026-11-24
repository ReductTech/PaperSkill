import React from 'react';
import { ClipCover, PairingMatrix, DualEncoder, SymmetricLoss, PromptClassifier, PromptEnsemble, EvidenceScene, LimitsScene } from './ClipScenes';
export interface WidgetProps { chapterId: string; moduleId: string }
export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {
  clipCover: ClipCover, pairingMatrix: PairingMatrix, dualEncoder: DualEncoder, symmetricLoss: SymmetricLoss,
  promptClassifier: PromptClassifier, promptEnsemble: PromptEnsemble, evidenceScene: EvidenceScene, limitsScene: LimitsScene,
};
