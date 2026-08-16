import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CanvasViewport } from '../components/CanvasViewport';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  white: '#ffffff',
};

function label(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = C.text,
  size = 13,
  weight = 600,
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.fillText(value, x, y);
}

function base(ctx: CanvasRenderingContext2D, height: number) {
  ctx.clearRect(0, 0, W, height);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, height);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(12.5, 12.5, W - 25, height - 25);
}

function useDrawCanvas(draw: (ctx: CanvasRenderingContext2D) => void, height: number) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    try {
      const ctx = setupCanvas(canvas, W, height);
      draw(ctx);
      canvas.style.width = `${W}px`;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.classList.add('is-ready');
    } catch {
      // The exact conclusion remains available in the text feedback below.
    }
  }, [draw, height]);
  return ref;
}

type EvidenceView = 'oxford' | 'window';

const WINDOW_METRICS = [
  { name: 'ATE ↓', unit: '', window: 5.98, full: 6.6, winner: 'window' },
  { name: 'RPE-trans ↓', unit: '', window: 1.33, full: 1.5, winner: 'window' },
  { name: 'RPE-rot ↓', unit: '', window: 1.93, full: 1.71, winner: 'full' },
  { name: 'FPS ↑', unit: '', window: 20.29, full: 11.87, winner: 'window' },
  { name: '显存 ↓', unit: ' GB', window: 13.28, full: 36.06, winner: 'window' },
] as const;

export const LongSequenceEvidence: React.FC<WidgetProps> = ({ moduleId }) => {
  const [view, setView] = useState<EvidenceView>('oxford');
  const feedbackId = `${moduleId}-evidence-feedback`;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const h = view === 'oxford' ? 285 : 330;
      base(ctx, h);
      if (view === 'oxford') {
        label(ctx, 'Oxford Spires：同一方法的 sparse / dense 压力测试', 24, 36, C.text, 14, 800);
        label(ctx, 'ATE ↓（m，经 Sim(3) 对齐）', 24, 62, C.muted, 11, 700);

        const x0 = 142;
        const maxWidth = 355;
        const maxAte = 8;
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, 79);
        ctx.lineTo(x0 + maxWidth, 79);
        ctx.stroke();
        label(ctx, '0', x0 - 3, 74, C.muted, 9, 600);
        label(ctx, '8 m', x0 + maxWidth - 18, 74, C.muted, 9, 600);

        const rows = [
          { name: '320 sparse · stride 12', value: 6.42, y: 112, color: C.blue },
          { name: '3840 full dense', value: 7.11, y: 174, color: C.orange },
        ];
        rows.forEach((row) => {
          label(ctx, row.name, 24, row.y + 16, row.color, 11, 800);
          ctx.fillStyle = C.border;
          ctx.fillRect(x0, row.y, maxWidth, 22);
          ctx.fillStyle = row.color;
          ctx.fillRect(x0, row.y, (row.value / maxAte) * maxWidth, 22);
          label(ctx, `${row.value.toFixed(2)} m`, x0 + 12, row.y + 16, C.white, 11, 800);
        });
        label(ctx, '短柱更好；这里比较的是采样协议，不是逐帧因果曲线', 142, 220, C.muted, 10, 600);
        label(ctx, 'ΔATE = +0.69 m', 24, 254, C.purple, 14, 800);
        label(ctx, 'dense: 20.29 FPS', 370, 254, C.orange, 12, 800);
      } else {
        label(ctx, 'Pose-reference Window 64 vs Full Causal（论文 Table 7）', 24, 35, C.text, 14, 800);
        label(ctx, '各行 0 → 较大值', 454, 35, C.muted, 9, 600);
        label(ctx, 'Window 64', 128, 61, C.blue, 11, 800);
        label(ctx, 'Full', 303, 61, C.muted, 11, 800);
        WINDOW_METRICS.forEach((metric, index) => {
          const y = 79 + index * 45;
          const windowBest = metric.winner === 'window';
          const windowColor = windowBest ? C.green : C.orange;
          const fullColor = windowBest ? C.red : C.green;
          const pairMax = Math.max(metric.window, metric.full);
          const trackWidth = 150;
          const windowWidth = (metric.window / pairMax) * trackWidth;
          const fullWidth = (metric.full / pairMax) * trackWidth;
          label(ctx, metric.name, 24, y + 27, C.text, 11, 700);

          const windowText = `${metric.window.toFixed(2)}${metric.unit}`;
          const fullText = `${metric.full.toFixed(2)}${metric.unit}`;
          const columns = [
            { x: 128, text: windowText, color: windowColor, width: windowWidth, winner: windowBest },
            { x: 303, text: fullText, color: fullColor, width: fullWidth, winner: !windowBest },
          ];
          columns.forEach((column) => {
            label(ctx, column.text, column.x, y + 13, column.color, 10, 800);
            if (column.winner) {
              ctx.fillStyle = C.green;
              ctx.beginPath();
              ctx.arc(column.x + 139, y + 9, 8, 0, Math.PI * 2);
              ctx.fill();
              ctx.textAlign = 'center';
              label(ctx, '✓', column.x + 139, y + 13, C.white, 9, 800);
              ctx.textAlign = 'left';
            }
            ctx.fillStyle = C.border;
            ctx.fillRect(column.x, y + 20, trackWidth, 11);
            ctx.fillStyle = column.color;
            ctx.fillRect(column.x, y + 20, column.width, 11);
          });
        });
        label(ctx, 'RPE-rot 是唯一由 Full 领先的指标', 24, 306, C.orange, 12, 800);
      }
    },
    [view],
  );

  const canvasHeight = view === 'oxford' ? 285 : 330;
  const canvasRef = useDrawCanvas(draw, canvasHeight);
  const feedback = view === 'oxford'
    ? 'Oxford Spires 从 320 帧稀疏采样变为完整 3,840 帧时，ATE 从 6.42 m 增至 7.11 m，仅增加 0.69 m；不能把这两点外推成任意长度的连续误差曲线。'
    : 'Window 64 在 ATE、RPE-trans、FPS 和显存上更优；Full Causal 的 RPE-rot 为 1.71，优于 Window 64 的 1.93，这个反例必须保留。';
  const claimBoundary = view === 'oxford'
    ? {
        supported: '在 Oxford 指定协议的两个设置间，帧数从 320 增至 3,840（12×）时，ATE 从 6.42 m 变为 7.11 m；Dense 设置报告 20.29 FPS。',
        unsupported: '不能据两个采样点声称误差会按任意长度保持平缓，也不能把 20.29 FPS 外推到其他分辨率、窗口或实现条件。',
      }
    : {
        supported: '在 TartanGround 320 帧、stride 8 的 Table 7 设置中，Window 64 在四项指标领先；Full 仅在 RPE-rot 以 1.71 对 1.93 领先。',
        unsupported: '不能说 Window 64 在所有精度指标都更好，也不能把这一消融设置直接外推到其他数据集或序列长度。',
      };

  return (
    <div>
      <CanvasViewport label="长序列实验结果图，可横向滚动查看" mobileMinWidth={540}>
        <canvas
          ref={canvasRef}
          width={W}
          height={canvasHeight}
          role="img"
          aria-label={view === 'oxford'
            ? 'Oxford Spires 结果比较：320 帧 sparse ATE 6.42 米，3840 帧 dense ATE 7.11 米，差 0.69 米'
            : 'Table 7，Window 64 对比 Full Causal：ATE 5.98 对 6.60，RPE-trans 1.33 对 1.50，RPE-rot 1.93 对 1.71，FPS 20.29 对 11.87，显存 13.28 GB 对 36.06 GB；Full 仅在 RPE-rot 上领先'}
          aria-describedby={feedbackId}
        />
      </CanvasViewport>
      <div className="ctrl" role="group" aria-label="选择论文证据">
        <button
          type="button"
          className={`chip ${view === 'oxford' ? 'selected' : ''}`}
          aria-pressed={view === 'oxford'}
          onClick={() => setView('oxford')}
        >
          Oxford 长序列
        </button>
        <button
          type="button"
          className={`chip ${view === 'window' ? 'selected' : ''}`}
          aria-pressed={view === 'window'}
          onClick={() => setView('window')}
        >
          Window 64 vs Full
        </button>
      </div>
      <div id={feedbackId} className="feedback" role="status" aria-live="polite">
        {feedback}
      </div>
      <div className="compare-row" role="group" aria-label="当前证据支持与不能推出的结论">
        <div className="hotspot-info" style={{ borderLeftColor: C.green }}>
          <b>支持的结论：</b>{claimBoundary.supported}
        </div>
        <div className="hotspot-info" style={{ borderLeftColor: C.orange }}>
          <b>不能推出：</b>{claimBoundary.unsupported}
        </div>
      </div>
      <div className="hotspot-info">
        {view === 'oxford' ? (
          <>
            <b>协议：</b>论文 Table 2–3，Oxford Spires 共 13 个场景；Sparse 为 320 帧、stride 12，Dense 为完整 3,840 帧。ATE 越低越好并经 Sim(3) 对齐，20.29 FPS 对应 Dense 结果。
          </>
        ) : (
          <>
            <b>协议：</b>论文 Table 7，属于消融节的 TartanGround 验证设置（320 帧、stride 8）。箭头给出指标方向；必须保留“Full Causal 仅在 RPE-rot 上领先”这一反例。
          </>
        )}
      </div>
    </div>
  );
};

type InferenceMode = 'direct' | 'vo';

const MODE_OPTIONS: Array<{ key: InferenceMode; label: string }> = [
  { key: 'direct', label: '常规连续序列 · Direct' },
  { key: 'vo', label: '数万帧序列 · VO' },
];

const MODE_FEEDBACK: Record<InferenceMode, string> = {
  direct: '执行方式选 Direct：三层上下文状态沿连续序列持续维护，不做窗口级整体状态 reset；局部窗口本身仍随当前帧滑动。约 3,000 帧是论文观察到的经验稳定范围，不是硬阈值。',
  vo: '执行方式选 VO：把数万帧序列拆成重叠窗口，窗口间 reset，并用重叠区域做 Sim(3) 对齐；这种可扩展执行方式仍可能累积边界对齐误差。',
};

function route(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  color: string,
  dashed = false,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.setLineDash(dashed ? [7, 6] : []);
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
}

export const ApplicabilityBoundary: React.FC<WidgetProps> = ({ moduleId }) => {
  const [mode, setMode] = useState<InferenceMode>('direct');
  const feedbackId = `${moduleId}-boundary-feedback`;
  const limitationsId = `${moduleId}-limitations`;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const h = 310;
      base(ctx, h);
      const isDirect = mode === 'direct';

      label(ctx, 'LingBot-Map 运行方式 · 轨迹技术示意', 24, 35, C.text, 15, 800);
      label(ctx, '同一坐标 / 时间轴；折线只解释机制，不表示论文实验数值', 24, 54, C.muted, 10, 600);

      ctx.fillStyle = isDirect ? '#edf3f9' : '#fff7ed';
      ctx.fillRect(25, 68, 510, 218);

      const axisX = 51;
      const baseline = 246;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(axisX, 92);
      ctx.lineTo(axisX, baseline);
      ctx.lineTo(520, baseline);
      ctx.stroke();
      label(ctx, '状态 / 坐标（示意）', 56, 88, C.muted, 9, 650);
      label(ctx, '时间 / 帧序 →', 436, 267, C.muted, 9, 650);

      const trajectory: Array<[number, number]> = [
        [65, 224],
        [126, 178],
        [187, 195],
        [251, 142],
        [318, 164],
        [382, 119],
        [449, 146],
        [509, 101],
      ];

      if (isDirect) {
        route(ctx, trajectory, C.blue);
        trajectory.forEach(([x, y], index) => {
          if (index % 2 !== 0 && index !== trajectory.length - 1) return;
          ctx.fillStyle = C.blue;
          ctx.beginPath();
          ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        });
        label(ctx, 'Direct · 单一连续状态', 323, 89, C.blue, 12, 800);
        label(ctx, '三层上下文持续维护；局部 Window 仍随当前帧滑动', 92, 281, C.blue, 10, 750);
      } else {
        const windows = [
          { x: 58, width: 212, name: '局部窗 A', labelX: 70 },
          { x: 210, width: 195, name: '局部窗 B', labelX: 274 },
          { x: 350, width: 170, name: '局部窗 C', labelX: 438 },
        ];
        windows.forEach((window) => {
          ctx.fillStyle = 'rgba(217, 119, 6, 0.07)';
          ctx.fillRect(window.x, 98, window.width, 136);
          ctx.strokeStyle = 'rgba(217, 119, 6, 0.42)';
          ctx.lineWidth = 1;
          ctx.strokeRect(window.x + 0.5, 98.5, window.width - 1, 135);
          label(ctx, window.name, window.labelX, 111, C.orange, 10, 800);
        });

        [
          { x: 210, width: 60 },
          { x: 350, width: 55 },
        ].forEach((overlap) => {
          ctx.fillStyle = 'rgba(124, 58, 237, 0.09)';
          ctx.fillRect(overlap.x, 99, overlap.width, 134);
        });

        const segments: Array<Array<[number, number]>> = [
          [[65, 224], [126, 178], [187, 195], [245, 147]],
          [[258, 145], [318, 164], [376, 123]],
          [[389, 122], [449, 146], [509, 101]],
        ];
        segments.forEach((segment) => route(ctx, segment, C.orange));

        const seams = [
          { x: 251, from: [245, 147] as [number, number], to: [258, 145] as [number, number] },
          { x: 382, from: [376, 123] as [number, number], to: [389, 122] as [number, number] },
        ];
        seams.forEach((seam) => {
          ctx.strokeStyle = C.purple;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(seam.x, 116);
          ctx.lineTo(seam.x, 203);
          ctx.moveTo(seam.from[0], seam.from[1]);
          ctx.lineTo(seam.to[0], seam.to[1]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = C.white;
          ctx.strokeStyle = C.purple;
          ctx.lineWidth = 1;
          ctx.fillRect(seam.x - 31, 202, 62, 32);
          ctx.strokeRect(seam.x - 30.5, 202.5, 61, 31);
          ctx.textAlign = 'center';
          label(ctx, 'reset', seam.x, 215, C.orange, 9, 800);
          label(ctx, 'Sim(3) 接缝', seam.x, 228, C.purple, 8, 800);
          ctx.textAlign = 'left';
        });

        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(396, 116);
        ctx.lineTo(396, 128);
        ctx.moveTo(392, 116);
        ctx.lineTo(400, 116);
        ctx.moveTo(392, 128);
        ctx.lineTo(400, 128);
        ctx.stroke();
        label(ctx, 'δ', 403, 126, C.red, 10, 800);

        label(ctx, 'VO · 橙色局部轨迹 + 紫色窗口接缝', 297, 89, C.orange, 12, 800);
        ctx.fillStyle = C.orange;
        ctx.fillRect(72, 274, 10, 4);
        label(ctx, '局部轨迹', 88, 281, C.orange, 9, 750);
        ctx.fillStyle = C.purple;
        ctx.fillRect(182, 274, 10, 4);
        label(ctx, 'reset + Sim(3) 接缝', 198, 281, C.purple, 9, 750);
        ctx.fillStyle = C.red;
        ctx.fillRect(364, 274, 10, 4);
        label(ctx, '边界误差可累积', 380, 281, C.red, 9, 750);
      }
    },
    [mode],
  );

  const canvasRef = useDrawCanvas(draw, 310);
  const feedback = MODE_FEEDBACK[mode];

  return (
    <div>
      <CanvasViewport label="LingBot-Map Direct 与 VO 运行轨迹技术示意，可横向滚动查看" mobileMinWidth={560}>
        <canvas
          ref={canvasRef}
          width={W}
          height={310}
          role="img"
          aria-label={`LingBot-Map 运行方式概念轨迹，使用同一坐标与时间轴，不表示论文实验数值。当前方式：${MODE_OPTIONS.find((item) => item.key === mode)?.label}。${feedback}`}
          aria-describedby={`${feedbackId} ${limitationsId}`}
        />
      </CanvasViewport>
      <div className="ctrl" role="group" aria-label="选择 LingBot-Map 推理方式">
        <b>运行方式</b>
        {MODE_OPTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`chip ${mode === item.key ? 'selected' : ''}`}
            aria-pressed={mode === item.key}
            onClick={() => setMode(item.key)}
            style={mode === item.key
              ? {
                  borderColor: item.key === 'direct' ? C.blue : C.orange,
                  background: item.key === 'direct' ? '#edf3f9' : '#fff7ed',
                  color: item.key === 'direct' ? C.blue : '#9a4f05',
                }
              : undefined}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        id={feedbackId}
        className="feedback"
        role="status"
        aria-live="polite"
        style={{
          borderLeftColor: mode === 'direct' ? C.blue : C.orange,
          background: mode === 'direct' ? '#edf3f9' : '#fff7ed',
        }}
      >
        {feedback}
      </div>
      <div id={limitationsId}>
        <b>论文明确的三项局限性</b>
        <div className="three-col-demo" aria-label="LingBot-Map 三项局限性">
          <article className="three-col-panel">
            <div className="three-col-label">无显式 loop closure</div>
            <p>Trajectory Memory 提供长程线索，但不等于闭环检测与全局图优化。</p>
          </article>
          <article className="three-col-panel">
            <div className="three-col-label">6-token 细节边界</div>
            <p>每个淘汰帧固定保留 6 个上下文 token，可能丢失超长序列中的细粒度几何。</p>
          </article>
          <article className="three-col-panel">
            <div className="three-col-label">无 test-time optimization</div>
            <p>纯前馈推理不会在线更新参数，也不会通过后端优化继续精修困难场景。</p>
          </article>
        </div>
      </div>
      <div className="hotspot-info">
        <b>边界结论：</b>LingBot-Map 组织并延伸流式三维重建状态；它不包含显式回环检测、全局图优化或测试时精修，因此不是一套完整的 SLAM 后端。
      </div>
    </div>
  );
};
