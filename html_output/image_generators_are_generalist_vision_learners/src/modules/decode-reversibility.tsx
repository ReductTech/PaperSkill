import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type SampleId = 'cat-pixel' | 'lock-pixel' | 'exit-pixel' | 'background-pixel';
type Phase = 'idle' | 'read' | 'lookup' | 'decoded';
type SemanticLabel = '猫' | '门锁' | '出口标志' | '背景';

interface DecodeState {
  sampleId: SampleId;
  phase: Phase;
  sampleRgb: [number, number, number];
  decodedLabel: SemanticLabel | null;
  isPlaying: boolean;
  startedAt: number;
  reducedMotion: boolean;
  isReady: boolean;
}

const SAMPLE_RECORDS: Record<SampleId, { label: string; rgb: [number, number, number] }> = {
  'cat-pixel': { label: '猫区域像素', rgb: [248, 8, 5] },
  'lock-pixel': { label: '门锁区域像素', rgb: [255, 182, 193] },
  'exit-pixel': { label: '出口标志像素', rgb: [190, 170, 255] },
  'background-pixel': { label: '背景区域像素', rgb: [255, 255, 0] },
};

const SEMANTIC_LEGEND: Array<{ label: SemanticLabel; rgb: [number, number, number] }> = [
  { label: '猫', rgb: [255, 0, 0] },
  { label: '门锁', rgb: [255, 182, 193] },
  { label: '出口标志', rgb: [190, 170, 255] },
  { label: '背景', rgb: [255, 255, 0] },
];

const COLORS = {
  desk: '#f5f8f0',
  paper: '#ffffff',
  shadow: '#b8c9a7',
  current: '#27446e',
  success: '#228d5c',
  emphasis: '#d97706',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function rgbCss(rgb: [number, number, number]) {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function drawMagnifier(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.strokeStyle = COLORS.current;
  ctx.lineWidth = 4 * scale;
  ctx.beginPath();
  ctx.arc(x, y, 16 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 11 * scale, y + 11 * scale);
  ctx.lineTo(x + 28 * scale, y + 28 * scale);
  ctx.stroke();
  ctx.restore();
}

function drawCompact(ctx: CanvasRenderingContext2D, now: number, reduced: boolean) {
  const W = 244;
  const H = 130;
  const raw = reduced ? 0.92 : (now % 2800) / 2800;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.shadow;
  roundedRect(ctx, 16, 20, 142, 88, 9);
  ctx.fill();
  ctx.fillStyle = COLORS.paper;
  roundedRect(ctx, 12, 16, 142, 88, 9);
  ctx.fill();
  ctx.fillStyle = 'rgb(255,255,0)';
  roundedRect(ctx, 20, 25, 126, 70, 5);
  ctx.fill();
  ctx.fillStyle = 'rgb(255,0,0)';
  roundedRect(ctx, 47, 48, 61, 36, 8);
  ctx.fill();
  ctx.fillStyle = 'rgb(255,182,193)';
  ctx.beginPath(); ctx.arc(126, 43, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgb(190,170,255)';
  ctx.fillRect(91, 31, 14, 7);

  ctx.fillStyle = COLORS.paper;
  ctx.strokeStyle = COLORS.border;
  roundedRect(ctx, 166, 20, 68, 76, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.fillRect(174, 31, 12, 12);
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 9px system-ui, sans-serif';
  ctx.fillText('猫', 192, 41);
  ctx.fillStyle = 'rgb(255,182,193)';
  ctx.fillRect(174, 51, 12, 12);
  ctx.fillStyle = COLORS.text;
  ctx.fillText('门锁', 192, 61);
  ctx.fillStyle = 'rgb(190,170,255)';
  ctx.fillRect(174, 71, 12, 12);
  ctx.fillStyle = COLORS.text;
  ctx.fillText('出口', 192, 81);

  const travel = easeInOutQuad(clamp(raw / 0.7, 0, 1));
  drawMagnifier(ctx, lerp(77, 180, travel), lerp(66, 37, travel), 0.78);
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('读颜色', 34, 121);
  ctx.fillText('还原含义', 172, 109);
  if (raw > 0.72) {
    ctx.fillStyle = 'rgba(34, 141, 92, 0.10)';
    ctx.strokeStyle = COLORS.success;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(222, 112, 16, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = COLORS.success;
    ctx.font = '700 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('可解码', 222, 115);
    ctx.textAlign = 'left';
  }
}

function phaseIndex(phase: Phase) {
  if (phase === 'idle') return 0;
  if (phase === 'read') return 1;
  if (phase === 'lookup') return 2;
  return 3;
}

function drawRgbBars(ctx: CanvasRenderingContext2D, rgb: [number, number, number], x: number, y: number) {
  const fills = ['#c43f52', '#228d5c', '#27446e'];
  const names = ['R', 'G', 'B'];
  rgb.forEach((value, index) => {
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(x, y + index * 20, 54, 10);
    ctx.fillStyle = fills[index];
    ctx.fillRect(x, y + index * 20, 54 * (value / 255), 10);
    ctx.fillStyle = COLORS.text;
    ctx.font = '600 9px system-ui, sans-serif';
    ctx.fillText(`${names[index]} ${value}`, x + 60, y + 9 + index * 20);
  });
}

function targetIndexFor(sampleId: SampleId) {
  if (sampleId === 'cat-pixel') return 0;
  if (sampleId === 'lock-pixel') return 1;
  if (sampleId === 'exit-pixel') return 2;
  return 3;
}

function samplePointFor(sampleId: SampleId): [number, number] {
  if (sampleId === 'cat-pixel') return [104, 112];
  if (sampleId === 'lock-pixel') return [193, 61];
  if (sampleId === 'exit-pixel') return [157, 46];
  return [42, 154];
}

function drawMain(ctx: CanvasRenderingContext2D, state: DecodeState, now: number) {
  const W = 560;
  const H = 270;
  const step = phaseIndex(state.phase);
  const elapsed = state.startedAt ? now - state.startedAt : 900;
  const travel = state.reducedMotion ? 1 : clamp(elapsed / 900, 0, 1);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLORS.shadow;
  roundedRect(ctx, 22, 26, 214, 184, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.paper;
  roundedRect(ctx, 18, 22, 214, 184, 10);
  ctx.fill();
  ctx.fillStyle = 'rgb(255,255,0)';
  roundedRect(ctx, 28, 34, 194, 136, 7);
  ctx.fill();
  ctx.fillStyle = 'rgb(255,0,0)';
  roundedRect(ctx, 62, 85, 103, 67, 16);
  ctx.fill();
  ctx.beginPath(); ctx.arc(82, 82, 22, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(65, 69); ctx.lineTo(69, 48); ctx.lineTo(83, 67); ctx.fill();
  ctx.beginPath(); ctx.moveTo(87, 66); ctx.lineTo(101, 48); ctx.lineTo(104, 72); ctx.fill();
  ctx.fillStyle = 'rgb(255,182,193)';
  ctx.beginPath(); ctx.arc(193, 61, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgb(190,170,255)';
  roundedRect(ctx, 148, 41, 20, 10, 3); ctx.fill();
  const [sampleX, sampleY] = samplePointFor(state.sampleId);
  ctx.strokeStyle = COLORS.emphasis;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sampleX - 8, sampleY);
  ctx.lineTo(sampleX + 8, sampleY);
  ctx.moveTo(sampleX, sampleY - 8);
  ctx.lineTo(sampleX, sampleY + 8);
  ctx.stroke();
  const magnifierX = lerp(42, sampleX, easeInOutQuad(clamp(travel / 0.3, 0, 1)));
  const magnifierY = lerp(186, sampleY, easeInOutQuad(clamp(travel / 0.3, 0, 1)));
  drawMagnifier(ctx, magnifierX, magnifierY, 0.9);
  ctx.fillStyle = COLORS.text;
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(SAMPLE_RECORDS[state.sampleId].label, 48, 194);
  ctx.fillStyle = rgbCss(state.sampleRgb);
  ctx.fillRect(28, 181, 13, 13);

  const nodeXs = [258, 313, 368];
  const labels = ['读 RGB', '查图例', '还原值'];
  nodeXs.forEach((x, index) => {
    const active = step >= index + 1;
    ctx.fillStyle = active ? COLORS.success : '#ffffff';
    ctx.strokeStyle = active ? COLORS.success : COLORS.border;
    ctx.lineWidth = active ? 3 : 2;
    ctx.beginPath();
    ctx.arc(x, 95, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = active ? '#ffffff' : COLORS.muted;
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(index + 1), x, 99);
    ctx.fillStyle = COLORS.text;
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillText(labels[index], x, 128);
    ctx.textAlign = 'left';
    if (index < 2) {
      ctx.strokeStyle = active ? COLORS.success : COLORS.border;
      ctx.lineWidth = active ? 3 : 1;
      ctx.setLineDash(active ? [] : [4, 4]);
      ctx.beginPath();
      ctx.moveTo(x + 18, 95);
      ctx.lineTo(nodeXs[index + 1] - 18, 95);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  if (step >= 1) drawRgbBars(ctx, state.sampleRgb, 244, 151);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  roundedRect(ctx, 394, 22, 150, 204, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('提示中声明的目标色', 408, 45);
  ctx.font = '600 11px system-ui, sans-serif';
  const targetIndex = targetIndexFor(state.sampleId);
  SEMANTIC_LEGEND.forEach((entry, index) => {
    const y = 58 + index * 27;
    if (step >= 2 && targetIndex === index) {
      ctx.fillStyle = '#fff7ed';
      ctx.strokeStyle = COLORS.emphasis;
      ctx.lineWidth = 2;
      roundedRect(ctx, 405, y - 4, 126, 24, 6); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = rgbCss(entry.rgb);
    ctx.fillRect(412, y, 20, 16);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(entry.label, 442, y + 12);
  });

  if (step >= 3) {
    ctx.fillStyle = '#edf8f2';
    ctx.strokeStyle = COLORS.success;
    roundedRect(ctx, 405, 172, 128, 42, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.success;
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText(`解码：${state.decodedLabel} ✓`, 416, 198);
  }

  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('论文图 2：生成像素 C(p) → 最近目标色 → 语义类别', 18, 254);
}

function resultFor(sampleId: SampleId) {
  if (sampleId === 'cat-pixel') {
    return {
      phase: 'decoded' as Phase,
      decodedLabel: '猫' as const,
      text: '读取 RGB(248, 8, 5) → 在提示图例中最接近红色目标色 → 解码为“猫”。生成像素存在轻微偏色，最近目标色规则仍能恢复类别。',
    };
  }
  if (sampleId === 'lock-pixel') {
    return {
      phase: 'decoded' as Phase,
      decodedLabel: '门锁' as const,
      text: '读取 RGB(255, 182, 193) → 与提示中的粉色目标色匹配 → 解码为“门锁”。',
    };
  }
  if (sampleId === 'exit-pixel') {
    return {
      phase: 'decoded' as Phase,
      decodedLabel: '出口标志' as const,
      text: '读取 RGB(190, 170, 255) → 与提示中的紫色目标色匹配 → 解码为“出口标志”。',
    };
  }
  return {
    phase: 'decoded' as Phase,
    decodedLabel: '背景' as const,
    text: '读取 RGB(255, 255, 0) → 与提示中的黄色目标色匹配 → 解码为“背景”。',
  };
}

export const DecodeReversibility: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const compact = moduleId === 'ana';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<DecodeState>({
    sampleId: 'cat-pixel',
    phase: 'idle',
    sampleRgb: SAMPLE_RECORDS['cat-pixel'].rgb,
    decodedLabel: null,
    isPlaying: false,
    startedAt: 0,
    reducedMotion: false,
    isReady: false,
  });
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setState((current) => ({ ...current, reducedMotion: media.matches }));
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!state.isPlaying) return;
    const finish = () => {
      const result = resultFor(state.sampleId);
      setState((current) => ({
        ...current,
        phase: result.phase,
        decodedLabel: result.decodedLabel,
        isPlaying: false,
      }));
    };
    if (state.reducedMotion) {
      finish();
      return;
    }
    const lookupTimer = window.setTimeout(() => setState((current) => ({ ...current, phase: 'lookup' })), 260);
    const finishTimer = window.setTimeout(finish, 900);
    return () => {
      window.clearTimeout(lookupTimer);
      window.clearTimeout(finishTimer);
    };
  }, [state.isPlaying, state.startedAt, state.sampleId, state.reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = compact ? 244 : 560;
    const H = compact ? 130 : 270;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = `${W}px`;
    const tick = (now: number) => {
      if (compact) drawCompact(ctx, now, stateRef.current.reducedMotion);
      else drawMain(ctx, stateRef.current, now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [compact]);

  if (compact) {
    return (
      <canvas
        ref={canvasRef}
        width={244}
        height={130}
        role="img"
        aria-label="放大镜读取论文语义分割结果，并沿目标色图例把 RGB 还原为语义类别"
      />
    );
  }

  const result = resultFor(state.sampleId);
  const statusText = state.phase === 'idle'
    ? '流程已复位：先读取颜色，再按约定查找，最后输出任务值。'
    : state.isPlaying
      ? '正在读取颜色并查找目标色。'
      : result.text;

  const selectSample = (sampleId: SampleId) => setState((current) => ({
    ...current,
    sampleId,
    sampleRgb: SAMPLE_RECORDS[sampleId].rgb,
    phase: 'idle',
    decodedLabel: null,
    isPlaying: false,
    startedAt: 0,
  }));
  const scan = () => setState((current) => ({
    ...current,
    phase: current.reducedMotion ? resultFor(current.sampleId).phase : 'read',
    decodedLabel: current.reducedMotion ? resultFor(current.sampleId).decodedLabel : null,
    isPlaying: !current.reducedMotion,
    startedAt: performance.now(),
  }));

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <figure className="paper-evidence-figure">
        <div className="paper-task-evidence-grid">
          <div className="paper-task-evidence-panel">
            <img src="/images/paper-semantic-input.png" alt="论文图 2：橱窗中猫、门锁和出口标志的输入图像" loading="lazy" />
            <span>输入图像</span>
          </div>
          <div className="paper-task-evidence-panel">
            <img src="/images/paper-semantic-natural.png" alt="论文图 2：按照提示颜色生成的开放词汇语义分割结果" loading="lazy" />
            <span>生成的 RGB 语义图</span>
          </div>
        </div>
        <figcaption>
          <strong>论文图 2｜开放词汇语义分割实例</strong>
          <span>提示动态声明“猫—红、门锁—粉、出口标志—紫、背景—黄”。右图是模型生成的 RGB 结果；下方可以选择其中一种像素颜色，观察它如何被还原为类别。</span>
        </figcaption>
      </figure>
      <div className="paper-choice-group" role="radiogroup" aria-label="选择生成像素样本">
        {(Object.keys(SAMPLE_RECORDS) as SampleId[]).map((sampleId) => (
          <button
            key={sampleId}
            type="button"
            role="radio"
            aria-checked={state.sampleId === sampleId}
            onClick={() => selectSample(sampleId)}
          >
            {SAMPLE_RECORDS[sampleId].label}
          </button>
        ))}
      </div>
      <div className="paper-action-group" aria-label="解码操作">
        <button type="button" onClick={scan} disabled={state.isPlaying}>
          扫描这个像素
        </button>
        {state.phase === 'decoded' ? (
          <button
            type="button"
            className="paper-secondary-action"
            onClick={() => setState((current) => ({ ...current, phase: 'idle', decodedLabel: null, isPlaying: false, startedAt: 0 }))}
          >
            重新扫描
          </button>
        ) : null}
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={560}
        height={270}
        role="img"
        aria-label={state.phase === 'decoded' ? `当前样本${SAMPLE_RECORDS[state.sampleId].label}，解码结果为${state.decodedLabel ?? '未定义'}` : `当前样本${SAMPLE_RECORDS[state.sampleId].label}，等待解码`}
      />

      <ol style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
        <li style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 9 }}><strong>1 读 RGB</strong><br />像素 p 的生成颜色向量 C(p)。</li>
        <li style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 9 }}><strong>2 查图例</strong><br />比较已声明的目标颜色。</li>
        <li style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 9 }}><strong>3 还原值</strong><br />输出对应的语义类别。</li>
      </ol>

      <div className={`feedback ${state.phase === 'decoded' ? 'good' : ''}`} role="status" aria-live="polite">
        {statusText}
      </div>

      <p style={{ margin: 0, color: COLORS.muted, fontSize: 14 }}>
        这里以论文图 2 的语义分割为例演示最近目标色解码。深度使用另一条严格可逆的连续映射，下一章再展开。
      </p>

      <p style={{ margin: 0, color: COLORS.muted, fontSize: 14 }}>
        交互中的 RGB 数值用于说明解码流程，不是论文基准结果；可解码只表示结果能够恢复为类别，不等于模型预测一定正确。
      </p>
    </div>
  );
};

export default DecodeReversibility;
