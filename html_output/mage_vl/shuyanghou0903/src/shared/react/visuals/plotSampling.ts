export interface SampledFunction2D {
  x: number[];
  y: number[];
}

export interface SampledSurface3D {
  x: number[];
  y: number[];
  z: number[][];
}

export interface Sample2DOptions {
  xMin?: number;
  xMax?: number;
  samples?: number;
}

export function sampleFunction2D(fn: (x: number) => number, options: Sample2DOptions = {}): SampledFunction2D {
  const xMin = options.xMin ?? -1.5;
  const xMax = options.xMax ?? 1.5;
  const samples = Math.max(2, Math.floor(options.samples ?? 180));
  const x = Array.from({ length: samples + 1 }, (_, index) => xMin + (index / samples) * (xMax - xMin));
  return { x, y: x.map(fn) };
}

export interface Surface3DOptions {
  min?: number;
  max?: number;
  samples?: number;
  zMin?: number;
  zMax?: number;
}

export function sampleSurface3D(fn: (x: number, y: number) => number, options: Surface3DOptions = {}): SampledSurface3D {
  const min = options.min ?? -1;
  const max = options.max ?? 1;
  const samples = Math.max(2, Math.floor(options.samples ?? 30));
  const axis = Array.from({ length: samples + 1 }, (_, index) => min + (index / samples) * (max - min));
  const z = axis.map((y) => axis.map((x) => {
    const value = fn(x, y);
    return Math.max(options.zMin ?? -Infinity, Math.min(options.zMax ?? Infinity, value));
  }));
  return { x: axis, y: axis, z };
}

export interface PlotlyAnnotation {
  xref: 'paper';
  yref: 'paper';
  x: number;
  y: number;
  xanchor: string;
  yanchor: string;
  showarrow: false;
  text: string;
  font: Record<string, unknown>;
  bgcolor: string;
  borderpad: number;
}

export function formulaAnnotation(text: string, options: Partial<Pick<PlotlyAnnotation, 'x' | 'y' | 'xanchor' | 'yanchor' | 'bgcolor' | 'borderpad'>> & { font?: Record<string, unknown> } = {}): PlotlyAnnotation {
  return {
    xref: 'paper', yref: 'paper', x: options.x ?? 0.02, y: options.y ?? 0.98,
    xanchor: options.xanchor ?? 'left', yanchor: options.yanchor ?? 'top', showarrow: false,
    text, font: { family: 'Consolas, monospace', size: 12, color: '#27446e', ...options.font },
    bgcolor: options.bgcolor ?? 'rgba(255,255,255,0.82)', borderpad: options.borderpad ?? 4,
  };
}
