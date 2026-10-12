// Small, explicitly assigned teaching inputs; not features extracted by a trained ViT.
export const PART_NAMES = ['屋顶块', '窗户块', '墙壁块'];
export const TOY_INPUTS = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
export const QUERY_RULES = [[1, 1], [0, 1], [-1, 1]];
export const KEY_RULES = [[1, 0], [0, 1], [-1, 0]];
export const VALUE_RULES = [[1, 0], [0, 1], [1, 1]];

export function projectRow(input: number[], rules: number[][]) {
  if (rules.length !== input.length || !rules.length || !rules[0].length || rules.some(row => row.length !== rules[0].length)) {
    throw new RangeError('输入长度必须等于系数表行数，系数表每行长度必须相同');
  }
  return rules[0].map((_, j) => input.reduce((sum, value, i) => sum + value * rules[i][j], 0));
}

export function computeQkv(part: number) {
  if (!Number.isInteger(part) || part < 0 || part >= TOY_INPUTS.length) throw new RangeError('图块编号越界');
  const input = TOY_INPUTS[part];
  return { input, q: projectRow(input, QUERY_RULES), k: projectRow(input, KEY_RULES), v: projectRow(input, VALUE_RULES) };
}

export const PATCH_INPUT = [1, 2, 3, 4];
export const PATCH_RULES = [[0.5, 0], [0.5, 0], [0, 0.5], [0, 0.5]];

export function computePatchProjection() {
  return { input: PATCH_INPUT, rules: PATCH_RULES, output: projectRow(PATCH_INPUT, PATCH_RULES) };
}
