import { useEffect, useRef, type HTMLAttributes } from 'react';
import plotlyUrl from '../../vendor/plotly/3.6.0/plotly.min.js?url';
import { classNames } from '../utils';

export type PlotlyValue = string | number | boolean | null;
export type PlotlyTrace = Record<string, unknown>;
export type PlotlyLayout = Record<string, unknown>;
export type PlotlyConfig = Record<string, unknown>;

export interface PlotlyGraph {
  on?(event: string, handler: (event: Record<string, unknown>) => void): void;
  removeAllListeners?(event?: string): void;
}

interface PlotlyGlobal {
  newPlot(
    element: HTMLElement,
    traces: PlotlyTrace[],
    layout?: PlotlyLayout,
    config?: PlotlyConfig,
  ): Promise<PlotlyGraph>;
  purge?(element: HTMLElement): void;
  relayout?(element: HTMLElement, update: PlotlyLayout): Promise<unknown>;
  restyle?(element: HTMLElement, update: Record<string, unknown>, traceIndices?: number[]): Promise<unknown>;
}

declare global {
  interface Window {
    Plotly?: PlotlyGlobal;
  }
}

let plotlyPromise: Promise<PlotlyGlobal> | null = null;

function loadPlotly(): Promise<PlotlyGlobal> {
  if (window.Plotly) return Promise.resolve(window.Plotly);
  if (plotlyPromise) return plotlyPromise;

  plotlyPromise = new Promise<PlotlyGlobal>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-shared-plotly]');
    const finish = () => window.Plotly ? resolve(window.Plotly) : reject(new Error('本地 Plotly 全局对象不可用'));
    if (existing) {
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => reject(new Error('本地 Plotly 加载失败')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = plotlyUrl;
    script.async = true;
    script.dataset.sharedPlotly = 'true';
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('本地 Plotly 加载失败')), { once: true });
    document.head.appendChild(script);
  });

  return plotlyPromise;
}

export interface PlotlyChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  data: PlotlyTrace[];
  layout?: PlotlyLayout;
  config?: PlotlyConfig;
  minHeight?: number;
  onGraphReady?: (graph: PlotlyGraph, host: HTMLDivElement) => void;
}

/** A lifecycle-safe wrapper around the repository's vendored Plotly build. */
export function PlotlyChart({ data, layout, config, minHeight = 260, className, style, onGraphReady, ...props }: PlotlyChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let graph: PlotlyGraph | null = null;
    let disposed = false;

    loadPlotly().then((plotly) => {
      if (disposed || !host.isConnected) return;
      return plotly.newPlot(host, data, layout, {
        responsive: true,
        scrollZoom: true,
        doubleClick: 'reset+autosize',
        displaylogo: false,
        displayModeBar: false,
        ...config,
      });
    }).then((created) => {
      if (!disposed) {
        // Plotly 的事件 API 挂在实际 host 元素上；不同构建的 Promise 返回值并不总是同一对象。
        const graphHost = host as HTMLDivElement & PlotlyGraph;
        graph = created ?? graphHost;
        onGraphReady?.(graphHost, host);
      }
    }).catch(() => {
      if (!disposed) host.dataset.chartError = 'true';
    });

    return () => {
      disposed = true;
      graph?.removeAllListeners?.();
      if (window.Plotly?.purge) window.Plotly.purge(host);
      graph = null;
    };
  }, [config, data, layout, onGraphReady]);

  return <div ref={hostRef} className={classNames('shared-plotly', className)} style={{ minHeight, ...style }} {...props} />;
}
