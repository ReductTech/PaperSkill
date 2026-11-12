// CVPR 2025, main paper, Table 1. Arrays follow the benchmark order below.
// Keep printed raw scores, percentages, and averages separate: the PDF
// reports rounded values and not every printed ratio matches a recomputation.
export const benchmarks = [
  { name: 'GQA', baseline: 61.9 },
  { name: 'MMBench', column: 'MMB', baseline: 64.7 },
  { name: 'MME', baseline: 1862 },
  { name: 'POPE', baseline: 85.9 },
  { name: 'ScienceQA', column: 'SQA', baseline: 69.5 },
  { name: 'VQAv2', baseline: 78.5 },
  { name: 'TextVQA', baseline: 58.2 },
  { name: 'MMMU', baseline: 36.3 },
  { name: 'SEED-Bench', column: 'SEED', baseline: 58.6 },
  { name: 'MMVet', baseline: 31.1 },
  { name: 'LLaVA-Bench', column: 'LLaVA-B', baseline: 66.8 },
];

export const table1 = {
  64: {
    fast: {
      raw: [46.1, 48.0, 1256, 48.0, 51.1, 55.0, 47.8, 34.0, 51.9, 25.8, 46.1],
      percent: [74.5, 74.2, 67.5, 55.9, 73.5, 70.1, 82.1, 93.7, 88.6, 83.0, 69.0],
      average: 75.6,
    },
    sparse: {
      raw: [52.7, 56.2, 1505, 75.1, 62.2, 68.2, 51.8, 32.7, 51.1, 23.3, 57.5],
      percent: [85.1, 86.9, 80.8, 87.4, 89.4, 86.9, 89.0, 90.1, 87.2, 74.5, 86.1],
      average: 85.8,
    },
    free: {
      raw: [55.1, 60.1, 1690, 77.0, 69.0, 72.4, 55.5, 36.2, 52.2, 31.7, 62.9],
      percent: [89.0, 92.9, 90.8, 89.6, 99.3, 92.2, 95.4, 99.7, 89.1, 101.9, 94.2],
      average: 94.0,
    },
    tuned: {
      raw: [57.0, 61.5, 1756, 80.9, 68.8, 74.2, 56.0, 35.6, 53.4, 30.2, 63.6],
      percent: [92.1, 95.1, 94.3, 94.2, 99.0, 94.5, 96.2, 98.1, 91.1, 97.1, 95.2],
      average: 95.2,
    },
  },
  128: {
    fast: {
      raw: [49.6, 56.1, 1490, 59.6, 60.2, 61.8, 50.6, 34.9, 55.9, 28.1, 52.0],
      percent: [80.1, 86.7, 80.0, 69.4, 86.6, 78.7, 86.9, 96.1, 95.4, 90.9, 77.8],
      average: 83.5,
    },
    sparse: {
      raw: [56.0, 60.0, 1696, 80.5, 67.1, 73.8, 54.9, 33.8, 53.4, 30.0, 62.7],
      percent: [90.5, 92.7, 91.1, 93.7, 96.5, 94.0, 94.3, 93.1, 91.1, 96.5, 93.9],
      average: 93.4,
    },
    free: {
      raw: [57.6, 62.0, 1761.7, 83.2, 68.9, 75.6, 56.8, 37.9, 54.9, 32.6, 64.8],
      percent: [93.1, 95.8, 94.6, 96.9, 99.1, 96.3, 97.6, 104.4, 93.7, 104.8, 97.6],
      average: 97.6,
    },
    tuned: {
      raw: [58.9, 62.6, 1823, 83.7, 68.3, 76.6, 57.0, 37.3, 55.8, 32.9, 64.8],
      percent: [95.2, 96.8, 97.9, 97.4, 98.3, 97.6, 97.9, 102.8, 95.2, 105.8, 97.0],
      average: 98.4,
    },
  },
  192: {
    fast: {
      raw: [52.7, 61.2, 1612, 64.8, 67.3, 67.1, 52.5, 34.3, 57.1, 27.7, 49.4],
      percent: [85.1, 94.6, 86.6, 75.4, 96.8, 85.5, 90.2, 94.5, 97.4, 89.7, 74.0],
      average: 88.2,
    },
    sparse: {
      raw: [57.6, 62.5, 1721, 83.6, 69.1, 75.6, 56.1, 33.8, 55.8, 31.5, 66.1],
      percent: [93.1, 96.6, 92.4, 97.3, 99.4, 96.3, 96.4, 93.1, 95.2, 101.3, 99.0],
      average: 96.4,
    },
    free: {
      raw: [59.3, 63.0, 1782.6, 85.3, 68.9, 76.8, 57.3, 36.6, 56.4, 31.7, 67.7],
      percent: [95.8, 97.4, 95.7, 99.3, 99.1, 97.8, 98.5, 100.8, 96.2, 101.9, 101.3],
      average: 98.5,
    },
    tuned: {
      raw: [60.1, 63.4, 1834, 84.9, 68.2, 77.4, 57.8, 36.2, 57.1, 32.6, 66.7],
      percent: [97.1, 98.0, 98.5, 98.8, 98.1, 98.6, 99.3, 99.7, 97.4, 104.8, 99.9],
      average: 99.1,
    },
  },
};

export type ResultBudget = keyof typeof table1;
