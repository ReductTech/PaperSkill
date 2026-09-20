export type EchoPhase = 'discovery' | 'diagnostic' | 'reframe' | 'repaired';
export type EchoAnswer = 'vision' | 'language' | 'gap';
export type EchoEvent =
  | { type: 'choose'; answer: EchoAnswer }
  | { type: 'verifyVision' }
  | { type: 'verifyLanguage' }
  | { type: 'focusGap' };

export interface EchoState {
  phase: EchoPhase;
  answer: EchoAnswer | null;
  visionOnline: boolean;
  languageOnline: boolean;
  crossModalFailed: boolean;
  fragment: string | null;
}

export const initialEchoState: EchoState = {
  phase: 'discovery', answer: null, visionOnline: false, languageOnline: false,
  crossModalFailed: false, fragment: null,
};

export function unlockSpace(chapterId: string) {
  window.dispatchEvent(new CustomEvent('space:navigate', { detail: { chapterId } }));
}

export function reduceEcho(state: EchoState, event: EchoEvent): EchoState {
  if (event.type === 'choose') return { ...state, answer: event.answer, phase: event.answer === 'gap' ? 'reframe' : 'diagnostic' };
  if (event.type === 'verifyVision') return { ...state, visionOnline: true, phase: 'diagnostic' };
  if (event.type === 'verifyLanguage') return { ...state, languageOnline: true, phase: 'diagnostic' };
  if (event.type === 'focusGap' && state.visionOnline && state.languageOnline) {
    return { ...state, phase: 'repaired', crossModalFailed: true, fragment: 'MODALITY GAP' };
  }
  return state;
}
