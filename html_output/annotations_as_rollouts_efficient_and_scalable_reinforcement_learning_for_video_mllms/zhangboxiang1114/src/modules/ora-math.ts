// Refinement 2026-10-22: executable teaching examples, not measured paper results.
export const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
export const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
export const std = (values: number[]) => Math.sqrt(mean(values.map(x => (x - mean(values)) ** 2)));
export const signed = (value: number) => Math.abs(value) < 0.0005 ? '0.000' : `${value > 0 ? '+' : ''}${value.toFixed(3)}`;

/** Eqs. (6)-(10). Population standard deviations and epsilon=1e-8 in this illustration. */
export function advantageExample(rewards: number[], oracleReward: number) {
  const epsilon = 1e-8;
  const mu = mean(rewards);
  const augmented = [...rewards, oracleReward];
  const mixedMean = mean(augmented);
  const sigma = std(rewards);
  const ratio = std(augmented) / (sigma + epsilon);
  const gain = clamp(ratio ** 0.25, 1, 4);
  const base = rewards.map(r => r - mu);
  const amplified = base.map(a => a > 0 ? gain * a : a);
  const shift = mean(amplified);
  const policy = amplified.map(a => a - shift);
  const gap = clamp((oracleReward - mu) / (oracleReward + epsilon), 0, 1);
  const weight = gap ** 2;
  const maxPositive = Math.max(0, ...policy);
  const oracle = Math.min(2 * weight, clamp(1.2 * maxPositive, 0.05, 1));
  return { mu, mixedMean, sigma, ratio, gain, base, amplified, shift, policy, gap, weight, maxPositive, oracle };
}

/** Eq. (11): the oracle occupies one positive quota; fill missing signs from the other. */
export function selectBalanced(values: number[], oracle: number, retained: number) {
  const indexed = values.map((value, index) => ({ value, index }));
  const positives = indexed.filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  const negatives = indexed.filter(x => x.value < 0).sort((a, b) => a.value - b.value);
  const zeros = indexed.filter(x => x.value === 0);
  const posCount = Math.max(0, Math.floor(retained / 2) - 1);
  const negCount = retained - 1 - posCount;
  const chosen = [...positives.slice(0, posCount), ...negatives.slice(0, negCount)];
  const rest = indexed.filter(x => !chosen.some(y => y.index === x.index) && x.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  chosen.push(...[...rest, ...zeros].slice(0, Math.max(0, retained - 1 - chosen.length)));
  return { indices: chosen.map(x => x.index), values: [...chosen.map(x => x.value), oracle] };
}

/** Eqs. (12)-(13), last entry is oracle. A zero policy RMS skips scale matching. */
export function correctMoments(values: number[], policyRms: number) {
  const center = mean(values);
  const centered = values.map(a => a - center);
  const oracleCentered = centered[centered.length - 1];
  const projected = oracleCentered < 0
    ? centered.map((a, index) => index === centered.length - 1 ? 0 : a + oracleCentered / (centered.length - 1))
    : centered;
  const selectedRms = Math.sqrt(mean(projected.map(a => a * a)));
  const scale = policyRms < 1e-8 ? 1 : clamp(policyRms / (selectedRms + 1e-8), 0.25, 1);
  return { center, centered, projected, scale, corrected: projected.map(a => a * scale), projectedOracle: oracleCentered < 0 };
}
