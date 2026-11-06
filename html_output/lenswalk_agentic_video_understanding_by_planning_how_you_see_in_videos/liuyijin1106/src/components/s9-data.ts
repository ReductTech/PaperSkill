// LensWalk, CVPR 2026, Tables 1–3. A missing entry is omitted, never zero.
export type Result = { name: string; value: number; precision?: number };
export type Benchmark = {
  id: string; label: string; condition: string; table: 1 | 2;
  baseline: number; lenswalk: number; precision: number;
  comparison: string[]; results: Result[];
};

const table1 = [
  { name: 'Gemini-1.5-Pro', values: [33.1, 58.6, 67.4, null] },
  { name: 'Gemini-2.0-Flash', values: [48.3, 45.7, 63.0, 71.2] },
  { name: 'GPT-4o', values: [48.9, 60.9, 65.3, 70.4] },
  { name: 'GPT-4.1', values: [51.9, 64.6, 63.1, 72.2] },
  { name: 'o3', values: [57.1, 60.6, 64.7, 63.2] },
  { name: 'GPT-5', values: [59.8, 61.8, 68.4, 73.8] },
  { name: 'LLaVA-Video-72B', values: [38.7, null, 59.6, 74.7] },
  { name: 'InternVL2.5-78B', values: [43.6, null, 62.6, null] },
  { name: 'Qwen2.5-VL-72B', values: [47.7, 54.2, 63.1, 75.4] },
  { name: 'AdaReTaKe', values: [53.3, null, 65.0, null] },
  { name: 'VideoAgent', values: [29.3, null, null, 63.2] },
  { name: 'VCA', values: [41.3, null, null, 73.6] },
  { name: 'Ego-R1', values: [null, null, 64.9, 68.2] },
  { name: 'MR. Video', values: [60.8, 61.6, 61.8, 73.0] },
  { name: 'Deep Video Discovery', values: [74.2, 68.6, 67.3, 76.6] },
  { name: 'LensWalk (o3/GPT-4.1)', values: [66.8, 69.9, 70.0, 74.8] },
  { name: 'LensWalk (o3/Qwen2.5-VL-72B)', values: [59.4, 67.3, 66.7, 77.2] },
  { name: 'LensWalk (o3)', values: [68.6, 70.6, 71.4, 74.8] },
  { name: 'LensWalk (GPT-5)', values: [66.9, 68.8, 69.2, 74.6] },
];
const table2 = [
  { name: 'Gemini-1.5-Flash', values: [66.6, 49.78] },
  { name: 'Gemini-1.5-Pro', values: [74.7, 53.89] },
  { name: 'GPT-4o', values: [78.1, 61.22] },
  { name: 'GPT-4.1', values: [76.3, 67.44] },
  { name: 'o3', values: [78.9, 75.44] },
  { name: 'Aria', values: [60.6, 50.78] },
  { name: 'InternVL2-8B', values: [49.1, 37.44] },
  { name: 'Qwen2.5-VL-7B', values: [60.6, 47.44] },
  { name: 'Qwen2.5-VL-72B', values: [69.3, 60.22] },
  { name: 'LensWalk (o3/GPT-4.1)', values: [80.9, 77.11] },
  { name: 'LensWalk (o3)', values: [79.2, 78.33] },
];
const column = (rows: typeof table1, index: number): Result[] => rows.flatMap(row => {
  const value = row.values[index];
  return value == null ? [] : [{ name: row.name, value }];
});

export const benchmarks: Benchmark[] = [
  { id: 'lvbench', label: 'LVBench', condition: 'Overall', table: 1, baseline: 57.1, lenswalk: 68.6, precision: 1, comparison: ['o3', 'Deep Video Discovery', 'LensWalk (o3/GPT-4.1)', 'LensWalk (o3)'], results: column(table1, 0) },
  { id: 'longvideobench', label: 'LongVideoBench', condition: 'Val · Long', table: 1, baseline: 60.6, lenswalk: 70.6, precision: 1, comparison: ['o3', 'Deep Video Discovery', 'LensWalk (o3/GPT-4.1)', 'LensWalk (o3)'], results: column(table1, 1) },
  { id: 'videomme', label: 'Video-MME', condition: 'Long (w/o sub)', table: 1, baseline: 64.7, lenswalk: 71.4, precision: 1, comparison: ['o3', 'Deep Video Discovery', 'LensWalk (o3/GPT-4.1)', 'LensWalk (o3)'], results: column(table1, 2) },
  { id: 'egoschema', label: 'EgoSchema', condition: 'Val', table: 1, baseline: 63.2, lenswalk: 74.8, precision: 1, comparison: ['o3', 'Deep Video Discovery', 'LensWalk (o3/Qwen2.5-VL-72B)', 'LensWalk (o3)'], results: column(table1, 3) },
  { id: 'mmvu', label: 'MMVU', condition: 'MC', table: 2, baseline: 78.9, lenswalk: 79.2, precision: 1, comparison: ['GPT-4.1', 'o3', 'LensWalk (o3)', 'LensWalk (o3/GPT-4.1)'], results: column(table2, 0) },
  { id: 'videommmu', label: 'Video-MMMU', condition: 'Overall', table: 2, baseline: 75.44, lenswalk: 78.33, precision: 2, comparison: ['GPT-4.1', 'o3', 'LensWalk (o3/GPT-4.1)', 'LensWalk (o3)'], results: column(table2, 1) },
];

export const observerRecipes = [
  { observer: 'GPT-4.1', baseline: 63.1, o3: 70.0, qwen3: 63.2 },
  { observer: 'GPT-4.1-mini', baseline: 59.4, o3: 66.0, qwen3: 61.0 },
  { observer: 'Qwen2.5-VL-72B', baseline: 63.1, o3: 66.7, qwen3: 62.5 },
  { observer: 'Qwen2.5-VL-7B', baseline: 55.4, o3: 61.3, qwen3: 59.7 },
] as const;
