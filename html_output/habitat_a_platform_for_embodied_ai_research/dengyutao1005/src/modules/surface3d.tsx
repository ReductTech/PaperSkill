import React, { useEffect, useMemo, useRef, useState } from 'react';

// 共享 3D 曲面图组件（plotly.js 动态加载，避免主包膨胀）。
// 同时渲染：三维曲面 + 等高线投影 + 颜色映射（z 轴颜色条）。

let plotlyPromise: Promise<any> | null = null;
function getPlotly() {
  if (!plotlyPromise) {
    plotlyPromise = import('plotly.js-dist-min').then((m) => (m as any).default ?? m);
  }
  return plotlyPromise;
}

export interface Surface3DSpec {
  title: string;
  xLabels: string[];
  yLabels: string[];
  z: number[][]; // z[y][x]
  xTitle?: string;
  yTitle?: string;
  zTitle?: string;
  zSuffix?: string;
  zLog?: boolean;
  height?: number;
  colorscale?: string;
}

export const Surface3D: React.FC<{ spec: Surface3DSpec }> = ({ spec }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const key = useMemo(
    () => JSON.stringify([spec.xLabels, spec.yLabels, spec.z, spec.zLog]),
    [spec.xLabels, spec.yLabels, spec.z, spec.zLog]
  );

  useEffect(() => {
    let cancelled = false;
    let plot: any = null;
    getPlotly()
      .then((Plotly) => {
        if (cancelled || !ref.current) return;
        plot = Plotly;
        const ny = spec.yLabels.length;
        const nx = spec.xLabels.length;
        // 逐点悬停文本：yLabel · xLabel：值
        const hover: string[][] = [];
        for (let yi = 0; yi < ny; yi++) {
          const row: string[] = [];
          for (let xi = 0; xi < nx; xi++) {
            const v = spec.z[yi]?.[xi] ?? 0;
            row.push(`${spec.yLabels[yi]} · ${spec.xLabels[xi]}：${v}${spec.zSuffix ?? ''}`);
          }
          hover.push(row);
        }
        const data = [
          {
            type: 'surface',
            x: spec.xLabels,
            y: spec.yLabels,
            z: spec.z,
            colorscale: spec.colorscale ?? 'Viridis',
            showscale: true,
            colorbar: {
              title: { text: spec.zTitle ?? '', side: 'right' },
              thickness: 14,
              len: 0.72,
              tickfont: { size: 10 },
            },
            // 等高线：z 面等高线 + 三个平面上的投影
            contours: {
              z: {
                show: true,
                usecolormap: true,
                width: 2,
                project: { x: true, y: true, z: true },
              },
            },
            hovertext: hover,
            hoverinfo: 'text',
            hovertemplate: '%{text}<extra></extra>',
          },
        ];
        const layout = {
          title: { text: spec.title, font: { size: 14 } },
          scene: {
            xaxis: {
              title: { text: spec.xTitle ?? '' },
              type: 'category',
              tickfont: { size: 11 },
            },
            yaxis: {
              title: { text: spec.yTitle ?? '' },
              type: 'category',
              tickfont: { size: 11 },
            },
            zaxis: {
              title: { text: spec.zTitle ?? '' },
              type: spec.zLog ? 'log' : 'linear',
              tickfont: { size: 10 },
            },
            camera: { eye: { x: 1.7, y: -1.5, z: 0.85 } },
          },
          margin: { l: 0, r: 0, t: 46, b: 0 },
          height: spec.height ?? 400,
          autosize: true,
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          font: {
            family: '-apple-system, "Segoe UI", "Microsoft YaHei", sans-serif',
            color: '#21324a',
            size: 12,
          },
        };
        Plotly.react(ref.current, data, layout, {
          displayModeBar: false,
          responsive: true,
        });
      })
      .catch((e) => {
        if (!cancelled) setErr('3D 渲染加载失败：' + (e?.message ?? e));
      });
    return () => {
      cancelled = true;
      try {
        if (plot && ref.current) plot.purge(ref.current);
      } catch {
        /* purge 失败可忽略 */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, spec.title, spec.zTitle, spec.zSuffix, spec.zLog, spec.height, spec.colorscale]);

  if (err) {
    return (
      <div className="feedback bad">
        {err}（请确认浏览器支持 WebGL，或稍后重试；下方原有图表仍可用。）
      </div>
    );
  }
  return (
    <div className="surface3d-wrap">
      <div className="surface3d-hint">可拖拽旋转 / 滚轮缩放，悬停查看精确数值；曲面颜色 = 数值大小，网格线为等高线投影。</div>
      <div ref={ref} />
    </div>
  );
};

export default Surface3D;
