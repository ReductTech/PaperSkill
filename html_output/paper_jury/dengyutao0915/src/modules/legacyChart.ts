// ============================================================
// 轻量级 Canvas 图表工具（自旧版 utils/chart.ts 原样移入，零依赖）
// 支持：分组柱状图、散点图、瀑布图
// ============================================================

export const CHART_STYLE = {
  primary: '#2563eb',
  baseline: '#9ca3af',
  success: '#16a34a',
  danger: '#dc2626',
  grid: '#e5e7eb',
  text: '#1f2937',
  textLight: '#6b7280',
  bg: '#ffffff',
};

/** 初始化 Canvas：按 devicePixelRatio 适配高清屏 */
export function setupChartCanvas(canvas: HTMLCanvasElement, height: number) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return { ctx, width, height };
}

/** 绘制分组柱状图 */
export function drawGroupedBarChart(
  canvas: HTMLCanvasElement,
  data: { labels: string[]; series: { name: string; values: (number | null)[]; color: string }[] },
  opts: { height?: number; yLabel?: string; showValues?: boolean } = {}
) {
  const height = opts.height ?? 320;
  const { ctx, width } = setupChartCanvas(canvas, height);
  const style = CHART_STYLE;

  const padL = 56, padR = 16, padT = 20, padB = 48;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const allVals = data.series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const maxVal = Math.max(...allVals, 0.1);
  const yMax = Math.ceil(maxVal * 1.15 * 100) / 100;

  ctx.fillStyle = style.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = style.grid;
  ctx.fillStyle = style.textLight;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const y = padT + chartH - (i / gridCount) * chartH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();
    ctx.fillText(((i / gridCount) * yMax).toFixed(2), padL - 8, y);
  }

  if (opts.yLabel) {
    ctx.save();
    ctx.translate(14, padT + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = style.text;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(opts.yLabel, 0, 0);
    ctx.restore();
  }

  const groupW = chartW / data.labels.length;
  const barGap = 4;
  const groupPad = groupW * 0.15;
  const barW = (groupW - groupPad * 2 - barGap * (data.series.length - 1)) / data.series.length;

  data.labels.forEach((label, li) => {
    const groupX = padL + li * groupW + groupPad;
    data.series.forEach((s, si) => {
      const val = s.values[li];
      if (val === null) return;
      const barH = (val / yMax) * chartH;
      const x = groupX + si * (barW + barGap);
      const y = padT + chartH - barH;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x, y, barW, barH);
      ctx.globalAlpha = 1;
      if (opts.showValues !== false) {
        ctx.fillStyle = style.text;
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(val.toFixed(3), x + barW / 2, y - 3);
      }
    });
    ctx.fillStyle = style.text;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const words = label.split(' ');
    words.forEach((w, wi) => {
      ctx.fillText(w, padL + li * groupW + groupW / 2, padT + chartH + 6 + wi * 14);
    });
  });
}

/** 绘制散点图（成本-质量权衡） */
export function drawScatterChart(
  canvas: HTMLCanvasElement,
  data: { name: string; x: number; y: number; color: string; size?: number; highlight?: boolean }[],
  opts: { height?: number; xLabel?: string; yLabel?: string } = {}
) {
  const height = opts.height ?? 340;
  const { ctx, width } = setupChartCanvas(canvas, height);
  const style = CHART_STYLE;

  const padL = 56, padR = 24, padT = 20, padB = 48;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const xMin = Math.min(...xs) * 0.8;
  const xMax = Math.max(...xs) * 1.1;
  const yMin = Math.min(...ys) * 0.9;
  const yMax = Math.max(...ys) * 1.08;

  ctx.fillStyle = style.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = style.grid;
  ctx.fillStyle = style.textLight;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 5; i++) {
    const y = padT + chartH - (i / 5) * chartH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
    ctx.fillText((yMin + (i / 5) * (yMax - yMin)).toFixed(2), padL - 8, y);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i <= 5; i++) {
    const x = padL + (i / 5) * chartW;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + chartH); ctx.stroke();
    const xv = xMin + (i / 5) * (xMax - xMin);
    ctx.fillText(xv.toFixed(1), x, padT + chartH + 6);
  }

  if (opts.yLabel) {
    ctx.save();
    ctx.translate(14, padT + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = style.text;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(opts.yLabel, 0, 0);
    ctx.restore();
  }
  if (opts.xLabel) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = style.text;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(opts.xLabel, padL + chartW / 2, height - 4);
  }

  const toX = (v: number) => padL + ((v - xMin) / (xMax - xMin)) * chartW;
  const toY = (v: number) => padT + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  data.forEach((d) => {
    const cx = toX(d.x);
    const cy = toY(d.y);
    const r = d.size ?? 8;
    if (d.highlight) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = d.color + '33';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = d.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = style.text;
    ctx.font = `${d.highlight ? 'bold ' : ''}11px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.name, cx + r + 6, cy);
  });
}
