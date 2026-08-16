import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 9.1：成绩单对比：四项指标真实数据（P4 指标芯片 + 静态柱状图）。
// 无竞速动画：切换指标即呈现静态柱状图与真实数值；1.6 柱恒为绿色并带奖杯。

const W = 560;
const H = 240;

const BLUE = '#27446e';
const GREEN = '#228d5c';
const INK = '#21324a';
const MUTED = '#68778f';
const AXIS = '#d7deea';

type MetricId = 'overall' | 'teds' | 'cdm' | 'real5';

interface MetricDef {
  id: MetricId;
  label: string;
  min: number;
  max: number;
  values: number[]; // [PaddleOCR-VL-1.5, GLM-OCR, MinerU2.5-Pro, PaddleOCR-VL-1.6]
  feedback: string;
}

const METRICS: MetricDef[] = [
  {
    id: 'overall',
    label: '总分（OmniDocBench v1.6）',
    min: 94.0,
    max: 97.0,
    values: [94.93, 95.22, 95.75, 96.33],
    feedback: '总分视角：1.6 以 96.33 登顶，比 1.5 高 1.40 分——0.9B 的专用模型超过了更大体量的通用大模型。',
  },
  {
    id: 'teds',
    label: '表格 TEDS',
    min: 91.0,
    max: 95.0,
    values: [91.67, 92.83, 93.42, 94.76],
    feedback: '表格视角：TEDS 94.76 登顶，比 1.5 的 91.67 高 3.09 分，是各单项里涨幅最大的一个。',
  },
  {
    id: 'cdm',
    label: '公式 CDM',
    min: 96.8,
    max: 97.6,
    values: [96.89, 97.18, 97.45, 97.49],
    feedback: '公式视角：97.49 对 97.45——优势仅 0.04 分，属于微弱领先。',
  },
  {
    id: 'real5',
    label: '真实拍摄（Real5）',
    min: 88.5,
    max: 93.5,
    values: [92.05, 90.32, 88.96, 93.19],
    feedback: '真实拍摄视角：Real5 93.19 登顶，比 1.5 高 1.14 分，也领先 GLM-OCR 2.87 分——手拍场景同样最稳。',
  },
];

const ROW_LABELS = ['PaddleOCR-VL-1.5', 'GLM-OCR', 'MinerU2.5-Pro', 'PaddleOCR-VL-1.6'];
const ROW_Y = [70, 104, 138, 172];
const AXIS_X = 120;
const CHART_W = 428;
const BAR_COLORS = [BLUE, AXIS, AXIS, GREEN]; // 1.5 蓝、竞品灰、1.6 绿

const EVIDENCE_ROWS = [
  { metric: '总分 ↑（越高越好）', vals: ['94.93', '95.22', '95.75', '96.33'] },
  { metric: '表格 TEDS ↑', vals: ['91.67', '92.83', '93.42', '94.76'] },
  { metric: '公式 CDM ↑', vals: ['96.89', '97.18', '97.45', '97.49'] },
  { metric: '真实拍摄 Real5 ↑', vals: ['92.05', '90.32', '88.96', '93.19'] },
];

const rr = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metric, setMetric] = useState<MetricId>('overall');
  const [feedback, setFeedback] = useState({ text: METRICS[0].feedback, cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const m = METRICS.find((x) => x.id === metric) ?? METRICS[0];

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);

    // 指标标题 + 越高越好说明
    ctx.fillStyle = MUTED;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(m.label, 10, 22);
    ctx.font = '11px sans-serif';
    ctx.fillText('越高越好', 10, 42);

    // 四行标签（右对齐）
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = MUTED;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(ROW_LABELS[i], AXIS_X - 6, ROW_Y[i] + 22);
    }

    // 基线轴 + 刻度标签
    ctx.strokeStyle = AXIS;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(AXIS_X, 72);
    ctx.lineTo(AXIS_X, 206);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = MUTED;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(m.max.toFixed(1), AXIS_X + 6, 96);
    ctx.fillText(m.min.toFixed(1), AXIS_X + 6, 226);

    // 静态柱：1.5（蓝）与竞品（灰）先画，1.6（绿）最后画
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 4; i++) {
        if (pass === 0 && i === 3) continue;
        if (pass === 1 && i !== 3) continue;
        const len = ((m.values[i] - m.min) / (m.max - m.min)) * CHART_W;
        const barY = ROW_Y[i] + 12;
        ctx.fillStyle = BAR_COLORS[i];
        rr(ctx, AXIS_X, barY, Math.max(len, 2), 10, 5);
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(m.values[i].toFixed(2), AXIS_X + len + 6, ROW_Y[i] + 30);
      }
    }

    // 奖杯：1.6 柱尖（四项均为核验后的第一，恒显示）
    const lenW = ((m.values[3] - m.min) / (m.max - m.min)) * CHART_W;
    ctx.font = '18px sans-serif';
    ctx.fillText('🏆', AXIS_X + lenW + 8, ROW_Y[3] + 18);
    ctx.textAlign = 'left';

    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [metric]);

  const onChip = (id: MetricId) => {
    setMetric(id);
    const m = METRICS.find((x) => x.id === id) ?? METRICS[0];
    setFeedback({ text: m.feedback, cls: 'good' });
  };

  const muted: React.CSSProperties = { color: MUTED, fontSize: '14px' };
  const best: React.CSSProperties = { color: GREEN, fontWeight: 700 };

  return (
    <div>
      <div className="chip-row">
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={'chip' + (metric === m.id ? ' selected' : '')}
            onClick={() => onChip(m.id)}
            aria-pressed={metric === m.id}
          >
            {m.label}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
      <div style={{ color: MUTED, fontSize: '13px', margin: '8px 0' }}>绿=本文方法 · 蓝=旧版基线 · 灰=竞品</div>
      <table className="paper">
        <thead>
          <tr>
            <th>指标（方向）</th>
            <th>PaddleOCR-VL-1.5</th>
            <th>GLM-OCR</th>
            <th>MinerU2.5-Pro</th>
            <th>PaddleOCR-VL-1.6</th>
          </tr>
        </thead>
        <tbody>
          {EVIDENCE_ROWS.map((r) => (
            <tr key={r.metric}>
              <td>{r.metric}</td>
              {r.vals.map((v, i) => (
                <td key={i} style={i === 3 ? best : undefined}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={muted}>
        通用大模型阵营（同一榜单，总分 ↑）：GPT-5.2 86.59、Gemini 3 Pro 92.91——0.9B 的专用模型领先更大体量的通用大模型，体现参数效率。
      </p>
      <p style={muted}>
        阅读顺序与文本编辑距离为"越低越好"，不放入本柱状图；1.6 的阅读顺序 0.127 非最优（最优 0.116），文本编辑距离 0.033 优于 1.5 的 0.038。
      </p>
      <p style={{ fontSize: '14px' }}>
        ① 消融显示 RL 增益只有 +0.08——论文自述这是高性能区余量小的预期结果；② 阅读顺序 0.127 并非最优（最优 0.116）；③ 表格/图表/印章等内部基准不公开，外部无法复现。
      </p>
      <p style={muted}>
        <b>内部基准</b>：内部难表格 TEDS 91.71 / TEDS-S 94.67、图表 RMS-F1 91.74、9 维定位识别 87.47（7 维第一）、印章 NED 0.119 均领先——但全部不公开，领先幅度也仅在内部口径下成立。
      </p>
    </div>
  );
};

export default Ch7Mod1;
