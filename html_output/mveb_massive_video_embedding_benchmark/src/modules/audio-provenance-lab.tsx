import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const MODULE_W = 560;
const MODULE_H = 240;
const ANALOGY_W = 244;
const ANALOGY_H = 130;

const C = {
  field: '#f5f8f0',
  wall: '#b8c9a7',
  contour: '#76906a',
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

type Provenance = 'av' | 'v';
type Endpoint = 'v' | 'transition' | 'va';
type AudioState = { provenance: Provenance; audioMix: number };

const MEAN_DELTA: Record<Provenance, number> = { av: 0.016, v: -0.046 };
const PAIR_COUNT: Record<Provenance, number> = { av: 475, v: 195 };

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke = C.border,
  lineWidth = 1,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function clearGallery(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.field;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.wall;
  ctx.globalAlpha = 0.22;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.globalAlpha = 1;
}

function drawVisitor(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(0, -14 * scale, 8 * scale, 0, Math.PI * 2);
  ctx.fill();
  roundedRect(ctx, -11 * scale, -4 * scale, 22 * scale, 27 * scale, 9 * scale, C.blue, C.blue, 2);
  ctx.restore();
}

function drawExhibit(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  roundedRect(ctx, x, y, w, h, 5, '#fffdf7', C.route, 2);
  ctx.strokeStyle = C.contour;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.46, Math.min(w, h) * 0.17, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 9, y + h - 13);
  ctx.lineTo(x + w - 9, y + h - 13);
  ctx.stroke();
}

function drawClueCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  roundedRect(ctx, x, y, w, h, 7, C.white, C.route, 2);
}

function drawGuidePath(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  color = C.blue,
  width = 3,
  dashed = false,
) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(dashed ? [4, 4] : []);
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.stroke();
  ctx.restore();
}

function drawVerificationSeal(ctx: CanvasRenderingContext2D, x: number, y: number, r = 10) {
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - r * 0.5, y);
  ctx.lineTo(x - r * 0.1, y + r * 0.4);
  ctx.lineTo(x + r * 0.58, y - r * 0.42);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.text,
  align: CanvasTextAlign = 'left',
  size = 12,
) {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<{ color: string; label: string }>,
  x: number,
  y: number,
) {
  let cursor = x;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  items.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(cursor, y - 4, 9, 8);
    ctx.fillStyle = C.muted;
    ctx.fillText(item.label, cursor + 13, y);
    cursor += 13 + ctx.measureText(item.label).width + 11;
  });
}

function drawHeadphones(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color = C.orange) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 11 * scale, Math.PI, 0);
  ctx.stroke();
  ctx.fillRect(x - 13 * scale, y - 1, 5 * scale, 12 * scale);
  ctx.fillRect(x + 8 * scale, y - 1, 5 * scale, 12 * scale);
  ctx.restore();
}

function drawAudioWave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  color = C.orange,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.25 + 0.75 * progress;
  [10, 18, 26].forEach((radius, index) => {
    if (progress < index / 3) return;
    ctx.beginPath();
    ctx.arc(x, y, radius, -0.65, 0.65);
    ctx.stroke();
  });
  ctx.restore();
}

function drawConflictMark(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 8);
  ctx.lineTo(x + 8, y + 8);
  ctx.moveTo(x + 8, y - 8);
  ctx.lineTo(x - 8, y + 8);
  ctx.stroke();
}

function endpointOf(audioMix: number): Endpoint {
  return audioMix === 0 ? 'v' : audioMix === 100 ? 'va' : 'transition';
}

function deltaX(value: number) {
  return 190 + ((value + 0.05) / 0.07) * 190;
}

function drawDeltaArrow(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  y: number,
  color: string,
) {
  drawGuidePath(ctx, [[startX, y], [endX, y]], color, 4);
  const direction = endX >= startX ? 1 : -1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(endX, y);
  ctx.lineTo(endX - direction * 8, y - 5);
  ctx.lineTo(endX - direction * 8, y + 5);
  ctx.closePath();
  ctx.fill();
}

function drawAnalogy(ctx: CanvasRenderingContext2D, elapsed: number, reducedMotion: boolean) {
  clearGallery(ctx, ANALOGY_W, ANALOGY_H);
  drawExhibit(ctx, 18, 22, 88, 74);
  drawVisitor(ctx, 196, 84, 0.95);
  const progress = reducedMotion ? 1 : clamp((elapsed - 300) / 750, 0, 1);
  const headphoneX = 171 - progress * 36;
  const headphoneY = 76 - progress * 20;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(189, 72);
  ctx.lineTo(headphoneX + 6, headphoneY + 5);
  ctx.stroke();
  drawHeadphones(ctx, headphoneX, headphoneY, 0.78);
  drawAudioWave(ctx, 116, 58, progress);
  drawGuidePath(ctx, [[170, 76], [135, 56], [108, 56]], C.orange, 2, true);
  if (reducedMotion || elapsed >= 1050) drawVerificationSeal(ctx, 98, 21, 9);
  drawSceneLabel(ctx, 'AV 标注', 24, 14, C.purple);
  drawSceneLabel(ctx, '声音入题', 220, 14, C.green, 'right');
}

function drawModule(ctx: CanvasRenderingContext2D, state: AudioState) {
  clearGallery(ctx, MODULE_W, MODULE_H);
  roundedRect(ctx, 12, 16, 146, 208, 9, 'rgba(255,255,255,0.88)');
  roundedRect(ctx, 170, 16, 236, 208, 9, 'rgba(255,255,255,0.9)');
  roundedRect(ctx, 418, 16, 130, 208, 9, 'rgba(255,255,255,0.88)');

  drawSceneLabel(ctx, '同一展品', 85, 34, C.text, 'center', 11);
  drawExhibit(ctx, 26, 47, 64, 62);
  drawVisitor(ctx, 128, 95, 0.82);
  const mixProgress = state.audioMix / 100;
  drawHeadphones(ctx, 111, 63, 0.65);
  drawAudioWave(ctx, 93, 67, mixProgress);
  drawGuidePath(ctx, [[31, 195], [139, 195]], C.border, 2);
  drawGuidePath(ctx, [[31, 195], [31 + 108 * mixProgress, 195]], C.orange, 4);
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(31 + 108 * mixProgress, 195, 6, 0, Math.PI * 2);
  ctx.fill();
  drawSceneLabel(ctx, 'v', 26, 214, C.blue, 'center', 10);
  drawSceneLabel(ctx, 'va', 144, 214, C.orange, 'center', 10);

  const zero = deltaX(0);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(zero, 50);
  ctx.lineTo(zero, 188);
  ctx.stroke();
  drawSceneLabel(ctx, '音频增量 Δ', 288, 34, C.text, 'center', 12);
  drawSceneLabel(ctx, '−0.05', 190, 51, C.muted, 'center', 9);
  drawSceneLabel(ctx, '0', zero, 51, C.blue, 'center', 9);
  drawSceneLabel(ctx, '+0.02', 380, 51, C.muted, 'center', 9);

  const rows: Array<{ key: Provenance; label: string; y: number }> = [
    { key: 'av', label: 'AV 标注', y: 99 },
    { key: 'v', label: 'V 标注', y: 154 },
  ];
  rows.forEach((row) => {
    const selected = state.provenance === row.key;
    roundedRect(ctx, 180, row.y - 22, 216, 44, 7, selected ? '#f7fbff' : C.white, selected ? C.blue : C.border, selected ? 3 : 1);
    drawSceneLabel(ctx, row.label, 190, row.y - 9, selected ? C.blue : C.muted, 'left', 10);
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.arc(zero, row.y + 7, 4, 0, Math.PI * 2);
    ctx.fill();
    const target = deltaX(MEAN_DELTA[row.key]);
    ctx.strokeStyle = row.key === 'av' ? C.green : C.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(target, row.y + 7, 5, 0, Math.PI * 2);
    ctx.stroke();
    drawSceneLabel(
      ctx,
      `${MEAN_DELTA[row.key] > 0 ? '+' : '−'}${Math.abs(MEAN_DELTA[row.key]).toFixed(3)}`,
      target,
      row.y - 9,
      row.key === 'av' ? C.green : C.red,
      'center',
      10,
    );
    if (selected && endpointOf(state.audioMix) === 'va') {
      drawDeltaArrow(ctx, zero, target, row.y + 7, row.key === 'av' ? C.green : C.red);
    }
  });

  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(392, 99);
  ctx.lineTo(401, 99);
  ctx.lineTo(401, 154);
  ctx.lineTo(392, 154);
  ctx.stroke();
  drawSceneLabel(ctx, '差 0.062', 398, 127, C.purple, 'right', 9);

  const selectedDelta = MEAN_DELTA[state.provenance];
  const endpoint = endpointOf(state.audioMix);
  drawSceneLabel(ctx, state.provenance === 'av' ? 'AV 标注' : 'V 标注', 483, 38, C.purple, 'center', 12);
  drawSceneLabel(
    ctx,
    state.provenance === 'av' ? '声音与画面共同标注' : '只由画面产生标签',
    483,
    61,
    C.text,
    'center',
    9,
  );
  drawSceneLabel(ctx, `实测终点 ${selectedDelta > 0 ? '+' : '−'}${Math.abs(selectedDelta).toFixed(3)}`, 483, 93, selectedDelta > 0 ? C.green : C.red, 'center', 10);
  drawSceneLabel(ctx, `配对数 N=${PAIR_COUNT[state.provenance]}`, 483, 116, C.muted, 'center', 9);
  drawSceneLabel(ctx, '48 个任务组', 483, 143, C.text, 'center', 9);
  drawSceneLabel(ctx, '14 个音频模型', 483, 161, C.text, 'center', 9);
  drawSceneLabel(
    ctx,
    endpoint === 'v' ? '当前：v 基线' : endpoint === 'va' ? `当前：${selectedDelta > 0 ? '+' : '−'}${Math.abs(selectedDelta).toFixed(3)}` : '当前：无实测值',
    483,
    192,
    endpoint === 'transition' ? C.orange : C.blue,
    'center',
    9,
  );
  if (endpoint === 'va' && state.provenance === 'av') drawVerificationSeal(ctx, 528, 210, 9);
  if (endpoint === 'va' && state.provenance === 'v') drawConflictMark(ctx, 528, 210);
  drawLegend(ctx, [
    { color: C.blue, label: 'v 基线' },
    { color: C.green, label: '正增量' },
    { color: C.red, label: '负增量' },
  ], 188, 215);
}

function feedbackFor(state: AudioState): { tone: 'blue' | 'green' | 'red'; text: string } {
  const endpoint = endpointOf(state.audioMix);
  if (endpoint === 'v') {
    return { tone: 'blue', text: '蓝｜当前是 v 基线：同一批片段只送入视频；先不把音频增量解释为帮助或伤害。' };
  }
  if (endpoint === 'transition') {
    return { tone: 'blue', text: '蓝｜音频正在加入：这是输入过渡示意，不是论文测量点；论文只比较 v 与 va 两个端点。' };
  }
  return state.provenance === 'av'
    ? { tone: 'green', text: '绿｜AV 标注：va−v = +0.016，平均小幅受益；这只说明标签生成时声音与画面共同参与。' }
    : { tone: 'red', text: '红｜V 标注：va−v = −0.046，该配对组平均呈负增量；实验未判定造成这一差异的机制。' };
}

const groupLabelStyle: React.CSSProperties = { color: C.muted, fontWeight: 700, fontSize: 14 };
const boundaryStyle: React.CSSProperties = {
  marginTop: 10,
  padding: '9px 12px',
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.muted,
  fontSize: 14,
  lineHeight: 1.6,
  background: '#fff',
};

export const AudioProvenanceLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAnalogy = moduleId === 'ana';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const stateRef = useRef<AudioState>({ provenance: 'av', audioMix: 0 });
  const [state, setState] = useState<AudioState>(stateRef.current);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = isAnalogy ? ANALOGY_W : MODULE_W;
    const h = isAnalogy ? ANALOGY_H : MODULE_H;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, w, h);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = `${w}px`;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let startTime = performance.now();
    const tick = (now: number) => {
      if (isAnalogy) drawAnalogy(ctx, reducedMotion ? 1450 : (now - startTime) % 3000, reducedMotion);
      else drawModule(ctx, stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) {
        startTime = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [isAnalogy]);

  const setMixFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (MODULE_W / rect.width);
    const mix = Math.round(clamp(((x - 31) / 108) * 100, 0, 100));
    setState((prev) => ({ ...prev, audioMix: mix }));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAnalogy) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (MODULE_W / rect.width);
    const y = (event.clientY - rect.top) * (MODULE_H / rect.height);
    if (x >= 180 && x <= 396 && y >= 77 && y <= 121) {
      setState((prev) => ({ ...prev, provenance: 'av' }));
      return;
    }
    if (x >= 180 && x <= 396 && y >= 132 && y <= 176) {
      setState((prev) => ({ ...prev, provenance: 'v' }));
      return;
    }
    if (x >= 21 && x <= 149 && y >= 180 && y <= 220) {
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setMixFromPointer(event);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingRef.current) setMixFromPointer(event);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onProvenanceKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, provenance: Provenance) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: Provenance = provenance === 'av' ? 'v' : 'av';
    document.getElementById(`audio-provenance-lab-provenance-${next}`)?.focus();
  };

  const feedback = feedbackFor(state);
  const endpoint = endpointOf(state.audioMix);
  const ariaValueText = endpoint === 'v' ? '仅视频' : endpoint === 'va' ? '视频加音频' : '过渡示意，非实测点';
  const canvasLabel = isAnalogy
    ? '一名访客把耳机举向一件展品，检查声音是否参与了答案的标注过程。'
    : `当前选择${state.provenance === 'av' ? 'AV 标注' : 'V 标注'}，输入位于${endpoint === 'v' ? 'v 基线' : endpoint === 'va' ? 'va 端点' : '非实测过渡位置'}${endpoint === 'va' ? `，平均音频增量为${MEAN_DELTA[state.provenance] > 0 ? '正' : '负'} ${Math.abs(MEAN_DELTA[state.provenance]).toFixed(3)}` : ''}。`;

  if (isAnalogy) {
    return (
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={ANALOGY_W}
        height={ANALOGY_H}
        role="img"
        aria-label={canvasLabel}
      />
    );
  }

  return (
    <div>
      <div className="chip-row" id="audio-provenance-lab-provenance" role="group" aria-label="标注模态来源">
        <span style={groupLabelStyle}>标注模态来源</span>
        {(['av', 'v'] as Provenance[]).map((key) => (
          <button
            key={key}
            id={`audio-provenance-lab-provenance-${key}`}
            type="button"
            className={`chip ${state.provenance === key ? 'selected' : ''}`}
            aria-pressed={state.provenance === key}
            onClick={() => setState((prev) => ({ ...prev, provenance: key }))}
            onKeyDown={(event) => onProvenanceKeyDown(event, key)}
          >
            {key === 'av' ? 'AV 标注' : 'V 标注'}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label htmlFor="audio-provenance-lab-audio-mix">
          音频输入演示 <span className="val">{state.audioMix}%</span>
        </label>
        <span style={{ color: C.blue, fontSize: 13 }}>v：仅视频</span>
        <input
          id="audio-provenance-lab-audio-mix"
          type="range"
          min={0}
          max={100}
          step={1}
          value={state.audioMix}
          aria-valuetext={ariaValueText}
          onChange={(event) => setState((prev) => ({ ...prev, audioMix: Number(event.target.value) }))}
        />
        <span style={{ color: C.orange, fontSize: 13 }}>va：视频+音频</span>
        <button
          id="audio-provenance-lab-reset"
          type="button"
          className="tiny ghost"
          disabled={state.audioMix === 0}
          onClick={() => setState((prev) => ({ ...prev, audioMix: 0 }))}
        >
          回到 v 基线
        </button>
      </div>
      <div style={{ color: C.orange, fontSize: 13, textAlign: 'center', marginBottom: 6 }}>
        过渡示意，非实测点；中间位置统一显示“无实测值”。
      </div>
      <div className="ctrl" aria-label="不可配对条件">
        <button id="audio-provenance-lab-no-audio" type="button" className="tiny ghost" disabled>
          数据没有可用音频
        </button>
        <span style={{ color: C.red, fontSize: 13 }}>数据没有可用音频，无法生成 va 配对。</span>
        <button id="audio-provenance-lab-no-model-audio" type="button" className="tiny ghost" disabled>
          模型没有音频接口
        </button>
        <span style={{ color: C.red, fontSize: 13 }}>模型没有音频接口，无法运行 va。</span>
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={MODULE_W}
        height={MODULE_H}
        role="img"
        aria-label={canvasLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'none' }}
      />
      <div
        className={`feedback ${feedback.tone === 'green' ? 'good' : feedback.tone === 'red' ? 'bad' : ''}`}
        role="status"
        aria-live="polite"
      >
        {feedback.text}
      </div>
      <div style={boundaryStyle}>
        <strong>判断边界：</strong>只有同一批片段、同一兼容模型、同一任务指标且非音频输入保持不变时，Δ 才可解释。标注模态来源描述标签如何产生，不代表数据集整体质量；检索使用有序方向，不使用这里的 v/va 配对。
      </div>
    </div>
  );
};

export default AudioProvenanceLab;
