import { useEffect, useRef, type HTMLAttributes } from 'react';
import echartsUrl from '../../vendor/echarts/5.6.0/echarts.min.js?url';
import { classNames } from '../utils';

export interface EChartsOption {
  [key: string]: unknown;
}

interface EChartsInstance {
  setOption(option: EChartsOption): void;
  resize(): void;
  dispose(): void;
}

interface EChartsGlobal {
  init(element: HTMLElement, theme?: unknown, options?: { renderer?: 'canvas' | 'svg' }): EChartsInstance;
}

declare global {
  interface Window {
    echarts?: EChartsGlobal;
  }
}

let echartsPromise: Promise<EChartsGlobal> | null = null;

function loadECharts(): Promise<EChartsGlobal> {
  if (window.echarts) return Promise.resolve(window.echarts);
  if (echartsPromise) return echartsPromise;

  echartsPromise = new Promise<EChartsGlobal>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-shared-echarts]');
    if (existing) {
      existing.addEventListener('load', () => window.echarts ? resolve(window.echarts) : reject(new Error('ECharts global unavailable')), { once: true });
      existing.addEventListener('error', () => reject(new Error('Local ECharts failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = echartsUrl;
    script.async = true;
    script.dataset.sharedEcharts = 'true';
    script.onload = () => window.echarts ? resolve(window.echarts) : reject(new Error('ECharts global unavailable'));
    script.onerror = () => reject(new Error('Local ECharts failed to load'));
    document.head.appendChild(script);
  });

  return echartsPromise;
}

export interface EChartsChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  option: EChartsOption;
  minHeight?: number;
}

export function EChartsChart({ option, minHeight = 260, className, style, ...props }: EChartsChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let chart: EChartsInstance | null = null;
    let disposed = false;

    loadECharts().then((echarts) => {
      if (disposed || !host.isConnected) return;
      chart = echarts.init(host, null, { renderer: 'canvas' });
      chart.setOption(option);
    }).catch(() => {
      if (!disposed) host.dataset.chartError = 'true';
    });

    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => chart?.resize());
    resizeObserver?.observe(host);

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      chart?.dispose();
      chart = null;
    };
  }, [option]);

  return <div ref={hostRef} className={classNames('shared-echarts', className)} style={{ minHeight, ...style }} {...props} />;
}
