export const CLASSES_PER_BATCH = [2, 5, 10, 20, 50] as const;

export type AblationResult = {
  batchSize: (typeof CLASSES_PER_BATCH)[number];
  icarL: number;
  hybrid1: number;
  hybrid2: number;
  hybrid3: number;
  lwfMC: number;
};

export type NCMComparison = {
  batchSize: (typeof CLASSES_PER_BATCH)[number];
  icarL: number;
  ncm: number;
};

/** Table 1(a), average incremental multi-class accuracy (%) on iCIFAR-100. */
export const TABLE1A: readonly AblationResult[] = [
  { batchSize: 2, icarL: 57.0, hybrid1: 36.6, hybrid2: 57.6, hybrid3: 57.0, lwfMC: 11.7 },
  { batchSize: 5, icarL: 61.2, hybrid1: 50.9, hybrid2: 57.9, hybrid3: 56.7, lwfMC: 32.6 },
  { batchSize: 10, icarL: 64.1, hybrid1: 59.3, hybrid2: 59.9, hybrid3: 58.1, lwfMC: 44.4 },
  { batchSize: 20, icarL: 67.2, hybrid1: 65.6, hybrid2: 63.2, hybrid3: 60.5, lwfMC: 54.4 },
  { batchSize: 50, icarL: 68.6, hybrid1: 68.2, hybrid2: 65.3, hybrid3: 61.5, lwfMC: 64.5 },
];

/** Table 1(b), iCaRL compared with full-data NCM on the same learned representation (%). */
export const TABLE1B: readonly NCMComparison[] = [
  { batchSize: 2, icarL: 57.0, ncm: 59.3 },
  { batchSize: 5, icarL: 61.2, ncm: 62.1 },
  { batchSize: 10, icarL: 64.1, ncm: 64.5 },
  { batchSize: 20, icarL: 67.2, ncm: 67.5 },
  { batchSize: 50, icarL: 68.6, ncm: 68.7 },
];
