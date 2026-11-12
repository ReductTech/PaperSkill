import { buildSelectionSnapshot, promptPoolConfig } from "./prompt-retrieval-data.ts";

export const P6_RETRIEVAL_SNAPSHOT = buildSelectionSnapshot("A");
export const P6_SELECTED_PROMPT_INDICES = P6_RETRIEVAL_SNAPSHOT.selectedKeyIndices;
export const P6_PROMPT_COUNT = P6_SELECTED_PROMPT_INDICES.length;
export const P6_PROMPT_TOKEN_COUNT = P6_PROMPT_COUNT * promptPoolConfig.promptLength;
export const P6_SEQUENCE_LENGTH = P6_PROMPT_TOKEN_COUNT + promptPoolConfig.imageLength;

export type PromptTokenRef = Readonly<{
  promptIndex: number;
  promptOrdinal: number;
  tokenIndex: number;
  sequenceIndex: number;
}>;

export function buildPromptTokenMap(promptIndices: readonly number[], promptLength: number): readonly PromptTokenRef[] {
  if (!Number.isInteger(promptLength) || promptLength <= 0) {
    throw new RangeError(`Prompt length must be a positive integer; received ${promptLength}.`);
  }
  return Object.freeze(promptIndices.flatMap((promptIndex, promptOrdinal) =>
    Array.from({ length: promptLength }, (_, tokenIndex) => Object.freeze({
      promptIndex,
      promptOrdinal,
      tokenIndex,
      sequenceIndex: promptOrdinal * promptLength + tokenIndex,
    })),
  ));
}

export const P6_PROMPT_TOKEN_MAP = buildPromptTokenMap(P6_SELECTED_PROMPT_INDICES, promptPoolConfig.promptLength);
export const P6_IMAGE_CLS_SEQUENCE_INDEX = P6_PROMPT_TOKEN_COUNT;
export const P6_FIRST_PATCH_SEQUENCE_INDEX = P6_IMAGE_CLS_SEQUENCE_INDEX + 1;
export const P6_LAST_PATCH_SEQUENCE_INDEX = P6_SEQUENCE_LENGTH - 1;

const dimensionOneValues: readonly (readonly number[])[] = Object.freeze([
  Object.freeze([0.2, 0.4, 0.1, 0.3, 0.5]),
  Object.freeze([0.1, 0.0, 0.3, 0.2, 0.4]),
  Object.freeze([0.6, 0.1, 0.2, 0.3, 0.3]),
  Object.freeze([-0.1, 0.2, 0.2, 0.0, 0.2]),
  Object.freeze([0.5, 0.4, 0.2, 0.3, 0.1]),
]);

export const P6_POOL_SAMPLE_ROWS = Object.freeze(dimensionOneValues.map((values, rowIndex) => Object.freeze({
  promptIndex: P6_SELECTED_PROMPT_INDICES[rowIndex],
  promptOrdinal: rowIndex,
  sequenceStart: rowIndex * promptPoolConfig.promptLength,
  values,
})));

export type PromptPoolProgress = Readonly<{
  includedCount: number;
  totalCount: number;
  groupSums: readonly number[];
  sum: number;
  runningMean: number | null;
}>;

export function computePromptOutputPool(
  rows: readonly (readonly number[])[] = dimensionOneValues,
  includedCount = rows.reduce((sum, row) => sum + row.length, 0),
): PromptPoolProgress {
  const totalCount = rows.reduce((sum, row) => sum + row.length, 0);
  if (totalCount === 0 || rows.some(row => row.length === 0 || row.some(value => !Number.isFinite(value)))) {
    throw new RangeError("Prompt output samples must contain finite values in non-empty rows.");
  }
  if (!Number.isInteger(includedCount) || includedCount < 0 || includedCount > totalCount) {
    throw new RangeError(`Included position count must be between 0 and ${totalCount}; received ${includedCount}.`);
  }

  let remaining = includedCount;
  const groupSums = rows.map(row => {
    const take = Math.min(row.length, remaining);
    remaining -= take;
    return row.slice(0, take).reduce((sum, value) => sum + value, 0);
  });
  const sum = groupSums.reduce((total, value) => total + value, 0);
  return Object.freeze({
    includedCount,
    totalCount,
    groupSums: Object.freeze(groupSums),
    sum,
    runningMean: includedCount === 0 ? null : sum / includedCount,
  });
}

export const P6_FINAL_POOL_EXAMPLE = computePromptOutputPool();
