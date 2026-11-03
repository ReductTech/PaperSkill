/** Synthetic category coordinates, shared by scores, probabilities and pixel marks. */
export const MODEL_CLASSES = ["Claude", "GPT", "DeepSeek"] as const;
export const PROBABILITY_CLASSES = [MODEL_CLASSES[0], MODEL_CLASSES[1]] as const;
export type ModelClass = 0 | 1 | 2;
