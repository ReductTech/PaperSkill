export function allConditions(values: readonly boolean[]) {
  return values.length === 4 && values.every(Boolean);
}

export function callTeachingTool(name: string): {registered: boolean; result: string} {
  const registry: Record<string, string> = {
    '查库存': '本地样例：12 份库存',
    '列菜单': '本地样例：咖啡、茶',
  };
  return {registered: Object.prototype.hasOwnProperty.call(registry, name), result: registry[name] ?? '本地注册表没有这个工具'};
}

export function analyzeFeedback(text: string, negative: boolean) {
  const match = text.match(/\b(awful|this sucks)\b/i);
  const hit = Boolean(match);
  const kind = hit === negative ? '一致' : hit ? '误报' : '漏报';
  return {hit, word: match?.[0] ?? '未命中', kind};
}

/** Public teaching checksum; not a cryptographic attestation algorithm. */
export function teachingSeal(value: string) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return (hash & 0xfffff).toString(16).padStart(5, '0');
}

export interface RetryState {consecutive: number; total: number; stopped: boolean; events: string[]}
export const newSession = (): RetryState => ({consecutive: 0, total: 0, stopped: false, events: []});
export function recordAttempt(state: RetryState, success: boolean): RetryState {
  if (state.stopped) return state;
  const consecutive = success ? 0 : state.consecutive + 1;
  return {consecutive, total: state.total + 1, stopped: consecutive >= 3, events: [...state.events, success ? '成功' : '失败'].slice(-5)};
}

export function commonPrefix(before: readonly string[], after: readonly string[]) {
  let length = 0;
  while (length < before.length && length < after.length && before[length] === after[length]) length++;
  return length;
}
