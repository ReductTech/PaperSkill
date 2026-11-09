// NeurIPS 2024 AdaptiveISP, formal proceedings PDF, Tables 2 and 3.
// Values are mAP percentages in the metric order used by the page.
export const detectionMetrics = ["mAP@0.5", "mAP@0.75", "mAP@0.5:0.95"] as const;
export const datasets = ["LOD", "OnePlus", "raw COCO"] as const;
export const detectorResults = [
  { name: "YOLO-v3", rgb: [55.6, 40.9, 37.4], adaptive: [71.4, 51.7, 47.1] },
  { name: "YOLOX", rgb: [57.0, 43.5, 39.2], adaptive: [69.7, 51.4, 47.2] },
  { name: "DDQ", rgb: [50.3, 42.0, 35.9], adaptive: [74.0, 58.1, 52.0] },
] as const;
export const segmentationResults = [
  { name: "Hyperparameter Optimization", values: [46.4, 28.4] },
  { name: "Attention-aware Learning", values: [45.5, 27.9] },
  { name: "ReconfigISP", values: [42.1, 25.2] },
  { name: "Refactoring ISP", values: [40.6, 24.7] },
  { name: "AdaptiveISP", values: [47.0, 28.8] },
] as const;
