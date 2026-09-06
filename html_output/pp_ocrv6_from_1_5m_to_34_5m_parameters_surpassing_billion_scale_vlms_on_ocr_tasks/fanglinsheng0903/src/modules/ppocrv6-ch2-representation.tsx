import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LineIcon } from '../components/LineIcon';
import type { WidgetProps } from './registry';

type IntroStage = 0 | 1 | 2 | 3 | 4;
type BboxPreset = 'tight' | 'good' | 'loose';
type BboxState = BboxPreset | 'offset';
type DragMode = 'left' | 'right' | 'move';
type CompressionChoice = 'both' | 'height';

const INTRO_STAGE_COPY = [
  '完整页面出现：先找到需要读取的文字区域。',
  'Detection 在页面的二维空间中圈出文字位置。',
  '检测结果被真实裁出，成为 Recognition 的输入来源。',
  'Crop & Resize 固定高度，并保留与文字行长宽比相关的输入宽度。',
  'Recognition 把高度压到 1，沿横向 feature positions 完成解码。',
] as const;

const INTRO_NAV = [
  { label: 'Detection', detail: '完整页面 · 二维位置', stage: 1 as IntroStage },
  { label: 'Crop & Resize', detail: '3 × 48 × W_in', stage: 2 as IntroStage },
  { label: 'Recognition', detail: '1 × W_feat sequence', stage: 4 as IntroStage },
] as const;

function useIntroPlayback() {
  const rootRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);
  const hasAutoPlayedRef = useRef(false);
  const [stage, setStage] = useState<IntroStage>(0);
  const [playing, setPlaying] = useState(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const goToStage = useCallback((nextStage: IntroStage) => {
    clearTimers();
    setPlaying(false);
    setStage(nextStage);
  }, [clearTimers]);

  const play = useCallback(() => {
    clearTimers();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage(4);
      setPlaying(false);
      return;
    }

    setStage(0);
    setPlaying(true);
    const schedule: Array<[number, IntroStage]> = [
      [850, 1],
      [1750, 2],
      [2850, 3],
      [3950, 4],
    ];
    timersRef.current = schedule.map(([delay, nextStage]) =>
      window.setTimeout(() => setStage(nextStage), delay),
    );
    timersRef.current.push(window.setTimeout(() => setPlaying(false), 4750));
  }, [clearTimers]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!('IntersectionObserver' in window)) {
      hasAutoPlayedRef.current = true;
      play();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAutoPlayedRef.current) return;
        hasAutoPlayedRef.current = true;
        play();
        observer.disconnect();
      },
      { threshold: 0.38 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [play]);

  useEffect(() => clearTimers, [clearTimers]);

  return { rootRef, stage, playing, play, goToStage };
}

export const Ch2PipelineIntro: React.FC<WidgetProps> = () => {
  const { rootRef, stage, playing, play, goToStage } = useIntroPlayback();
  const activeSegment = stage <= 1 ? 0 : stage === 2 ? 1 : 2;

  return (
    <div className={`rep3-intro rep3-intro-stage-${stage}`} ref={rootRef}>
      <div className="rep3-intro-toolbar">
        <span>同一段文字如何从页面进入识别模型？</span>
        <button
          className="rep3-icon-command ui-replay"
          type="button"
          onClick={play}
          disabled={playing}
          title="重新播放流程动画"
          aria-label="重新播放检测、裁剪和识别流程动画"
        >
          <LineIcon name="rotate" />
          重播
        </button>
      </div>

      <div className="rep3-intro-nav" role="group" aria-label="OCR 三段流程">
        {INTRO_NAV.map((item, index) => (
          <React.Fragment key={item.label}>
            {index > 0 ? <span className="rep3-nav-arrow" aria-hidden="true">→</span> : null}
            <button
              type="button"
              className={index === activeSegment ? 'active' : index < activeSegment ? 'done' : ''}
              aria-pressed={index === activeSegment}
              onClick={() => goToStage(item.stage)}
            >
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </button>
          </React.Fragment>
        ))}
      </div>

      <div className="rep3-intro-scene">
        <section className="rep3-intro-panel rep3-intro-detect">
          <span className="rep3-panel-kicker">完整页面</span>
          <div className="rep3-mini-ticket">
            <span>客户：减论科技</span>
            <strong>TEH 2026<i aria-hidden="true" /></strong>
            <span>金额 ¥128.00</span>
            <small>日期 2026-08-16</small>
          </div>
          <p>Detection <b>二维位置</b></p>
        </section>

        <span className="rep3-scene-arrow" aria-hidden="true">→</span>

        <section className="rep3-intro-panel rep3-intro-crop">
          <span className="rep3-panel-kicker">Actual Crop</span>
          <div className="rep3-mini-crop">TEH 2026</div>
          <div className="rep3-resize-mark">
            <span>固定高度</span>
            <code>3 × 48 × W_in</code>
          </div>
        </section>

        <span className="rep3-scene-arrow" aria-hidden="true">→</span>

        <section className="rep3-intro-panel rep3-intro-recognize">
          <span className="rep3-panel-kicker">Recognition</span>
          <div className="rep3-mini-sequence" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
          </div>
          <code>B × C × 1 × W_feat</code>
          <p>CTC Decode <b>TEH 2026</b></p>
        </section>
      </div>

      <p className="rep3-intro-status" role="status" aria-live="polite">
        {INTRO_STAGE_COPY[stage]}
      </p>
    </div>
  );
};

const SVG_WIDTH = 900;
const MIN_BBOX_WIDTH = 88;
const MIN_BBOX_X = 38;
const MAX_BBOX_RIGHT = 862;
const TARGET_LEFT = 350;
const TARGET_RIGHT = 480;

const PRESETS: Record<BboxPreset, { x: number; width: number }> = {
  tight: { x: 340, width: 122 },
  good: { x: 334, width: 164 },
  loose: { x: 326, width: 438 },
};

const STATE_COPY: Record<BboxState, { title: string; detail: string }> = {
  tight: {
    title: '太紧：Recognition 看见的字符证据已经不完整。',
    detail: '检测框直接决定 crop 的边界；被裁掉的字符不会在后续序列中自动回来。',
  },
  good: {
    title: '刚好：完整文字被保留，邻近字段没有进入。',
    detail: 'Crop & Resize 固定高度，同时按文字行长宽比形成 W_in，再由 backbone 产生 W_feat。',
  },
  loose: {
    title: '太松：邻近的“金额 ¥128.00”也进入了 crop。',
    detail: '更多 feature positions 不等于更多有效字符证据；过松的框可能把其他字段一并交给识别模型。',
  },
  offset: {
    title: '位置偏离：框的宽度足够，但没有对准目标文字。',
    detail: '这是定位位置错误，不是边界太紧；Detection Box 偏离后，Recognition 仍会收到不完整或错误的 crop。',
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ReceiptContent() {
  return (
    <>
      <rect className="rep3-svg-paper" x="20" y="18" width="860" height="142" rx="5" />
      <line className="rep3-svg-rule" x1="46" y1="111" x2="854" y2="111" />
      <text className="rep3-svg-muted" x="52" y="85">客户：减论科技</text>
      <text className="rep3-svg-target" x={TARGET_LEFT} y="85">TEH 2026</text>
      <text className="rep3-svg-muted" x="650" y="85">金额 ¥128.00</text>
      <text className="rep3-svg-muted small" x="52" y="137">日期 2026-08-16</text>
      <text className="rep3-svg-muted small" x="696" y="137">经办 OCR-06</text>
    </>
  );
}

function classifyCrop(x: number, width: number): BboxState {
  const right = x + width;
  const completeTargetWidth = TARGET_RIGHT - TARGET_LEFT;
  const targetIsComplete = x <= TARGET_LEFT && right >= TARGET_RIGHT;
  if (!targetIsComplete) return width < completeTargetWidth ? 'tight' : 'offset';
  if (x < 300 || right > 560 || width > 240) return 'loose';
  return 'good';
}

function cropReadout(state: BboxState, x: number, width: number) {
  const right = x + width;
  if (state === 'good') return 'TEH 2026';
  if (state === 'loose') {
    if (right > 640) return 'TEH 2026    金额 ¥128.00';
    if (x < 300) return '减论科技    TEH 2026';
    return 'TEH 2026    + 邻近背景';
  }
  if (x > TARGET_LEFT - 8) return 'EH 2026';
  if (right < TARGET_RIGHT + 8) return right < 452 ? 'TEH 20' : 'TEH 202';
  return '文字证据被截断';
}

const PYRAMID_LEVELS = [
  { id: 'P1', stride: 4, className: 'p1' },
  { id: 'P2', stride: 8, className: 'p2' },
  { id: 'P3', stride: 16, className: 'p3' },
  { id: 'P4', stride: 32, className: 'p4' },
] as const;

export const Ch2Representation: React.FC<WidgetProps> = () => {
  const [bboxX, setBboxX] = useState(PRESETS.good.x);
  const [bboxWidth, setBboxWidth] = useState(PRESETS.good.width);
  const [hasInteracted, setHasInteracted] = useState(false);
  const dragRef = useRef<{
    mode: DragMode;
    pointerId: number;
    clientX: number;
    bboxX: number;
    bboxWidth: number;
  } | null>(null);

  const bboxState = classifyCrop(bboxX, bboxWidth);
  const bboxRight = bboxX + bboxWidth;
  const normalizedWidth = clamp((bboxWidth - MIN_BBOX_WIDTH) / 430, 0, 1);
  const displaySequenceLength = Math.round(10 + normalizedWidth * 10);
  const visualWidth = 42 + normalizedWidth * 54;
  const previewWidth = 56 + normalizedWidth * 44;
  const feedback = STATE_COPY[bboxState];
  const focusLeft = clamp(((bboxX - 20) / 860) * 100, 0, 94);
  const focusWidth = clamp((bboxWidth / 860) * 100, 4, 100 - focusLeft);

  const sequenceCells = useMemo(
    () => Array.from({ length: displaySequenceLength }, (_, index) => index),
    [displaySequenceLength],
  );

  const updatePreset = (preset: BboxPreset) => {
    setBboxX(PRESETS[preset].x);
    setBboxWidth(PRESETS[preset].width);
    setHasInteracted(true);
  };

  const beginDrag = (mode: DragMode, event: React.PointerEvent<SVGElement>) => {
    event.preventDefault();
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    svg.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      pointerId: event.pointerId,
      clientX: event.clientX,
      bboxX,
      bboxWidth,
    };
    setHasInteracted(true);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const delta = (event.clientX - drag.clientX) * (SVG_WIDTH / rect.width);

    if (drag.mode === 'left') {
      const fixedRight = drag.bboxX + drag.bboxWidth;
      const nextX = clamp(drag.bboxX + delta, MIN_BBOX_X, fixedRight - MIN_BBOX_WIDTH);
      setBboxX(nextX);
      setBboxWidth(fixedRight - nextX);
      return;
    }

    if (drag.mode === 'right') {
      const nextRight = clamp(
        drag.bboxX + drag.bboxWidth + delta,
        drag.bboxX + MIN_BBOX_WIDTH,
        MAX_BBOX_RIGHT,
      );
      setBboxWidth(nextRight - drag.bboxX);
      return;
    }

    setBboxX(clamp(drag.bboxX + delta, MIN_BBOX_X, MAX_BBOX_RIGHT - drag.bboxWidth));
  };

  const endDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  };

  const handleKeyboard = (mode: DragMode, event: React.KeyboardEvent<SVGElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 18 : 7);
    setHasInteracted(true);

    if (mode === 'left') {
      const fixedRight = bboxRight;
      const nextX = clamp(bboxX + delta, MIN_BBOX_X, fixedRight - MIN_BBOX_WIDTH);
      setBboxX(nextX);
      setBboxWidth(fixedRight - nextX);
    } else if (mode === 'right') {
      const nextRight = clamp(bboxRight + delta, bboxX + MIN_BBOX_WIDTH, MAX_BBOX_RIGHT);
      setBboxWidth(nextRight - bboxX);
    } else {
      setBboxX(clamp(bboxX + delta, MIN_BBOX_X, MAX_BBOX_RIGHT - bboxWidth));
    }
  };

  return (
    <div className={`rep3-workbench rep3-state-${bboxState}`}>
      <ol className="rep3-causal-chain" aria-label="检测框影响识别输入的因果链">
        <li><span>1</span><strong>bbox</strong><small>用户拖动</small></li>
        <li><span>2</span><strong>Actual Crop</strong><small>可见内容改变</small></li>
        <li><span>3</span><strong>W_in</strong><small>输入宽度改变</small></li>
        <li><span>4</span><strong>W_feat</strong><small>特征长度改变</small></li>
        <li><span>5</span><strong>sequence</strong><small>横向表示改变</small></li>
      </ol>

      <div className="rep3-workbench-grid">
        <div className="rep3-primary-column">
          <section className="rep3-panel rep3-ticket-panel">
            <header className="rep3-panel-header">
              <div>
                <span>主控制器</span>
                <strong>完整页面 + Detection Box</strong>
              </div>
              <small>拖框体移动，拖左右把手改变边界</small>
            </header>

            <div className="rep3-ticket-viewport">
              <svg
                className="rep3-ticket-svg"
                viewBox={`0 0 ${SVG_WIDTH} 180`}
                role="img"
                aria-label={`完整票据，当前检测框状态：${feedback.title}`}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <ReceiptContent />
                <rect
                  className="rep3-bbox-hitbox"
                  x={bboxX + 16}
                  y="49"
                  width={Math.max(1, bboxWidth - 32)}
                  height="53"
                  tabIndex={0}
                  role="button"
                  aria-label="水平移动检测框，使用左右方向键微调"
                  onPointerDown={(event) => beginDrag('move', event)}
                  onKeyDown={(event) => handleKeyboard('move', event)}
                />
                <rect className="rep3-bbox-outline" x={bboxX} y="49" width={bboxWidth} height="53" rx="3" />
                <g
                  className="rep3-bbox-handle left"
                  tabIndex={0}
                  role="slider"
                  aria-label="检测框左边缘"
                  aria-valuemin={MIN_BBOX_X}
                  aria-valuemax={bboxRight - MIN_BBOX_WIDTH}
                  aria-valuenow={Math.round(bboxX)}
                  onPointerDown={(event) => beginDrag('left', event)}
                  onKeyDown={(event) => handleKeyboard('left', event)}
                >
                  <rect x={bboxX - 12} y="59" width="24" height="33" rx="8" />
                  <line x1={bboxX} y1="67" x2={bboxX} y2="84" />
                </g>
                <g
                  className={`rep3-bbox-handle right ${hasInteracted ? '' : 'hint'}`}
                  tabIndex={0}
                  role="slider"
                  aria-label="检测框右边缘"
                  aria-valuemin={bboxX + MIN_BBOX_WIDTH}
                  aria-valuemax={MAX_BBOX_RIGHT}
                  aria-valuenow={Math.round(bboxRight)}
                  onPointerDown={(event) => beginDrag('right', event)}
                  onKeyDown={(event) => handleKeyboard('right', event)}
                >
                  <rect x={bboxRight - 12} y="59" width="24" height="33" rx="8" />
                  <line x1={bboxRight} y1="67" x2={bboxRight} y2="84" />
                </g>
              </svg>
            </div>

            <div className="rep3-preset-row" role="group" aria-label="典型检测框实验">
              <span>试试：</span>
              {([
                ['tight', '太紧'],
                ['good', '刚好'],
                ['loose', '太松'],
              ] as Array<[BboxPreset, string]>).map(([preset, label]) => (
                <button
                  key={preset}
                  type="button"
                  className={bboxState === preset ? 'selected' : ''}
                  aria-pressed={bboxState === preset}
                  onClick={() => updatePreset(preset)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="rep3-panel rep3-transform-panel">
            <header className="rep3-panel-header">
              <div>
                <span>识别路径</span>
                <strong>Crop 决定后续模型能看见什么</strong>
              </div>
              <small>教学示意：UI 宽度与格子数不是论文测量值</small>
            </header>

            <div className="rep3-transform-grid">
              <article className="rep3-crop-card">
                <div className="rep3-card-label"><span>Actual Crop</span><b>真实裁剪</b></div>
                <div className="rep3-live-crop-wrap" style={{ width: `${previewWidth}%` }}>
                  <svg
                    viewBox={`${bboxX} 42 ${bboxWidth} 76`}
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={`实时裁剪内容：${cropReadout(bboxState, bboxX, bboxWidth)}`}
                  >
                    <ReceiptContent />
                  </svg>
                  {bboxState === 'tight' || bboxState === 'offset' ? <i className="rep3-cut-edge" aria-hidden="true" /> : null}
                </div>
                <strong className="rep3-crop-readout">{cropReadout(bboxState, bboxX, bboxWidth)}</strong>
              </article>

              <span className="rep3-transform-arrow" aria-hidden="true">→</span>

              <article className="rep3-input-card">
                <div className="rep3-card-label"><span>Crop &amp; Resize</span><b>识别输入</b></div>
                <div className="rep3-input-visual">
                  <i style={{ width: `${visualWidth}%` }} />
                  <span>height = 48</span>
                </div>
                <code>3 × 48 × W_in</code>
                <small>W_in：缩放后图像的横向输入宽度</small>
              </article>

              <span className="rep3-transform-arrow" aria-hidden="true">→</span>

              <article className="rep3-sequence-card">
                <div className="rep3-card-label"><span>Recognition Feature</span><b>横向序列</b></div>
                <div className="rep3-sequence-track" style={{ width: `${visualWidth}%` }} aria-hidden="true">
                  {sequenceCells.map((index) => <i key={index} />)}
                </div>
                <code>B × C × 1 × W_feat</code>
                <small>W_feat：backbone 输出的横向 feature positions</small>
              </article>
            </div>

            <div className="rep3-decode-row">
              <span>格子代表 feature position，不等于字符，也不表示 W_in = W_feat。</span>
              <strong>CTC Decode → {bboxState === 'good' ? 'TEH 2026' : bboxState === 'tight' ? '证据不完整' : bboxState === 'offset' ? '定位偏移，证据不完整' : '可能混入邻近字段'}</strong>
            </div>
          </section>
        </div>

        <aside className="rep3-panel rep3-pyramid-panel">
          <header className="rep3-panel-header">
            <div>
              <span>Detection Pyramid</span>
              <strong>完整页面的二维地图</strong>
            </div>
          </header>
          <p className="rep3-pyramid-lead">框在移动，但每层 Feature Map 的整体 H × W 保持不变。</p>
          <div className="rep3-pyramid-stack">
            {PYRAMID_LEVELS.map((level) => (
              <div className="rep3-map-row" key={level.id}>
                <div>
                  <strong>{level.id}</strong>
                  <span>stride {level.stride}</span>
                </div>
                <div className={`rep3-map-canvas ${level.className}`}>
                  <i
                    className="rep3-map-focus"
                    style={{ left: `${focusLeft}%`, width: `${focusWidth}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="rep3-pyramid-note">
            <strong>x / y 关系仍然存在</strong>
            <span>bbox 只改变地图内的高亮区域，不会重算整张地图的尺寸。</span>
          </div>
        </aside>
      </div>

      <div className={`rep3-feedback ${bboxState}`} role="status" aria-live="polite">
        <strong>{feedback.title}</strong>
        <span>{feedback.detail}</span>
      </div>
    </div>
  );
};

export const Ch2StrideMechanism: React.FC<WidgetProps> = () => {
  const [choice, setChoice] = useState<CompressionChoice | null>(null);
  const isDetection = choice === 'both';
  const isRecognition = choice === 'height';
  const frameAria = isDetection
    ? '高度与宽度同时逐层缩小，最终仍保留二维地图形式。'
    : isRecognition
      ? '高度逐层压缩，宽度基本保持不变，最终形成从左到右的横向序列。'
      : '等待选择 feature map 的压缩方式。';

  return (
    <div className={`rep3d-lab rep3d-${choice ?? 'pending'}`}>
      <header className="rep3d-question">
        <span>如果你是论文作者，你会怎么选？</span>
        <strong>这张 feature map 应该怎么压？</strong>
        <p>下一层还要继续压缩空间。先做选择，再看它更适合“找位置”还是“读顺序”。</p>
      </header>

      <div className="rep3d-choice-row" role="group" aria-label="选择 feature map 的压缩方式">
        <button type="button" className={isDetection ? 'selected' : ''} aria-pressed={isDetection} onClick={() => setChoice('both')}>
          <span>A</span><strong>上下左右一起压</strong><small>H ÷ 2，W ÷ 2</small>
        </button>
        <button type="button" className={isRecognition ? 'selected' : ''} aria-pressed={isRecognition} onClick={() => setChoice('height')}>
          <span>B</span><strong>只压高度</strong><small>H ÷ 2，W 不变</small>
        </button>
      </div>

      <section className="rep3d-stage" aria-label={frameAria}>
        <div className="rep3d-source-copy"><span>同一条文字</span><strong>TEH 2026</strong></div>
        <div className="rep3d-compression-flow" aria-hidden="true">
          {[0, 1, 2].map((step) => (
            <React.Fragment key={step}>
              {step > 0 ? <b>→</b> : null}
              <div className={`rep3d-frame-shell step-${step + 1}`}>
                <div className="rep3d-feature-frame">
                  {Array.from({ length: 32 }, (_, index) => <i key={index} />)}
                  {step === 0 ? <strong>TEH 2026</strong> : null}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="rep3d-visual-result">
          {!choice ? (
            <p>选择一种压缩方式，观察高度与宽度怎样变化。</p>
          ) : isDetection ? (
            <div className="rep3d-map-result">
              <div aria-hidden="true"><i /><i /><i /></div>
              <p><span>适合 Detection</span><strong>Detection → 二维地图</strong><small>关心“文字在哪里”</small></p>
            </div>
          ) : (
            <div className="rep3d-sequence-result">
              <div aria-hidden="true">{Array.from('TEH2026').map((char, index) => <i key={`${char}-${index}`}>{char}</i>)}</div>
              <p><span>适合 Recognition</span><strong>Recognition → 横向序列</strong><small>关心“按什么顺序读”</small></p>
            </div>
          )}
        </div>
      </section>

      <div className="rep3d-explanation" role="status" aria-live="polite">
        {!choice ? (
          <p>两种压缩方式没有脱离任务的“统一正确答案”；关键是下游需要保留什么。</p>
        ) : isDetection ? (
          <p><strong>为什么适合检测？</strong> Detection 要回答“文字在哪里”。它需要保留二维空间关系，但可以逐级缩小高度和宽度，形成更紧凑的多尺度表示。</p>
        ) : (
          <p><strong>为什么适合识别？</strong> Recognition 最终要从左到右读出字符。高度可以继续压缩，横向位置承载字符顺序，不能过早压掉。<em>论文实现：Stage 3–4 使用 asymmetric stride (2,1)。</em></p>
        )}
      </div>

      <div className="rep3d-summary" aria-label="同一个 LCNetV4 为检测与识别保留不同表示">
        <strong>同一个 LCNetV4</strong><b aria-hidden="true">↓</b>
        <div><span className={isDetection ? 'active' : ''}><b>Detection</b><small>二维地图 · 在哪里</small></span><span className={isRecognition ? 'active' : ''}><b>Recognition</b><small>横向序列 · 什么顺序</small></span></div>
        <p>不是换一套 backbone，而是改变空间压缩方式。</p>
      </div>

      <details className="rep3d-details">
        <summary>查看技术细节：LCNetV4 的 stride 配置</summary>
        <div>
          <article><span>Detection</span><strong>常规 stride-2 transition</strong><p>高度与宽度同步下采样，输出 stride 4 / 8 / 16 / 32 的二维多尺度 feature maps。</p></article>
          <article><span>Recognition</span><strong>Stage 3–4 使用 (2,1)</strong><p>只继续压缩高度，不同步压缩宽度；随后沿高度 average pooling，得到 F ∈ R^(B × C × 1 × W_feat)。</p></article>
          <p><b>边界：</b>统一的是 LCNetV4 block primitive。Detection 与 Recognition 使用任务特定的 stride 配置，并不共享同一次前向中的 feature tensor。</p>
        </div>
      </details>

      <p className="rep3d-takeaway"><strong>你应该记住：</strong> Detection 需要二维“地图”，Recognition 需要横向“序列”。因此 LCNetV4 可以共享同一个 backbone，只需要为两个任务采用不同的 stride 配置。</p>
    </div>
  );
};
