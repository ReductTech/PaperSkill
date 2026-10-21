export type Figure2Benchmark = "cifar" | "small" | "full";
export type Figure2FocusRect = { x: number; y: number; width: number; height: number };

export const FIGURE2_SOURCE_FRAME = { width: 2134, height: 2183 } as const;

/** Subfigure bounds in the original Figure 2 PNG's pixel coordinates. */
export const FIGURE2_FOCUS_RECTS: Readonly<Record<string, Figure2FocusRect>> = {
  "cifar-2": { x: 209, y: 41, width: 522, height: 397 },
  "cifar-5": { x: 891, y: 41, width: 506, height: 397 },
  "cifar-10": { x: 1532, y: 41, width: 525, height: 397 },
  "cifar-20": { x: 371, y: 574, width: 529, height: 386 },
  "cifar-50": { x: 1032, y: 574, width: 544, height: 386 },
  "ilsvrc-small": { x: 235, y: 1244, width: 600, height: 441 },
  "ilsvrc-full": { x: 1378, y: 1244, width: 600, height: 441 },
};

export function figure2Selection(benchmark: Figure2Benchmark, batch: number) {
  const focusId = benchmark === "cifar" ? `cifar-${batch}` : benchmark === "small" ? "ilsvrc-small" : "ilsvrc-full";
  const dataset = benchmark === "cifar" ? "iCIFAR-100" : `iILSVRC-${benchmark}`;
  const shownBatch = benchmark === "cifar" ? batch : benchmark === "small" ? 10 : 100;
  const metric = benchmark === "cifar" ? "多类准确率" : "验证集 Top-5";
  return {
    focusId,
    rect: FIGURE2_FOCUS_RECTS[focusId],
    protocolLabel: `${dataset} · 每批 ${shownBatch} 类 · ${metric}`,
  };
}
