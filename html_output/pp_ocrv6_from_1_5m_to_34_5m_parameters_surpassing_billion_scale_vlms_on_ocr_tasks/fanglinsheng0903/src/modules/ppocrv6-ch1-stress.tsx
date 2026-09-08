import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LineIcon } from '../components/LineIcon';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  RESOLUTION_SCALES,
  deriveChapter2Scene,
  resetChapter2Stress,
  updateChapter2Scene,
  useChapter2Scene,
  type CropMargin,
  type ResolutionScale,
  type RiskLevel,
  type ScenePreset,
} from './ppocrv6-ch2-state';

const C = {
  bg: '#eef4f8',
  paper: '#ffffff',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

const PRIMARY_PRESETS: { value: ScenePreset; label: string }[] = [
  { value: 'print', label: '标准' },
  { value: 'blur', label: '模糊' },
  { value: 'rotate', label: '旋转' },
  { value: 'industrial', label: '工业场景' },
];

const INDUSTRIAL_PRESETS: { value: ScenePreset; label: string }[] = [
  { value: 'industrial', label: '工业字符' },
  { value: 'display', label: '数字屏' },
  { value: 'dot', label: '点阵字符' },
];

const CROP_OPTIONS: { value: CropMargin; label: string; note: string }[] = [
  { value: -2, label: '太紧', note: '字符证据被截断。' },
  { value: 0, label: '合适', note: '文字完整，额外背景较少。' },
  { value: 2, label: '太松', note: '更多背景或邻近字段进入识别区域。' },
];

const RESOLUTION_ZOOM: Record<ResolutionScale, number> = {
  0.35: 0.72,
  0.5: 0.8,
  0.71: 0.9,
  1: 1,
  1.41: 1.06,
  2: 1.11,
  2.83: 1.16,
};

function label(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.ink,
  align: CanvasTextAlign = 'left',
  font = '600 13px Segoe UI, sans-serif',
) {
  context.fillStyle = color;
  context.font = font;
  context.textAlign = align;
  context.fillText(text, x, y);
  context.textAlign = 'left';
}

function drawSpacedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
) {
  let cursor = x;
  Array.from(text).forEach((char) => {
    context.fillText(char, cursor, y);
    cursor += context.measureText(char).width + spacing;
  });
}

function drawScene(
  context: CanvasRenderingContext2D,
  state: ReturnType<typeof useChapter2Scene>,
  scene: ReturnType<typeof deriveChapter2Scene>,
) {
  const width = 640;
  const sceneHeight = 300;
  context.fillStyle = C.bg;
  context.fillRect(0, 0, width, 340);

  const source = document.createElement('canvas');
  source.width = width;
  source.height = sceneHeight;
  const sourceContext = source.getContext('2d');
  if (!sourceContext) return;

  sourceContext.fillStyle = '#eaf0f5';
  sourceContext.fillRect(0, 0, width, sceneHeight);
  sourceContext.fillStyle = '#c8d7c1';
  sourceContext.fillRect(0, 264, width, 36);

  const ticket = { x: 46, y: 34, width: 548, height: 220 };
  sourceContext.fillStyle = state.preset === 'industrial' ? '#f5f1e7' : C.paper;
  sourceContext.strokeStyle = '#cbd5e1';
  sourceContext.lineWidth = 2;
  sourceContext.fillRect(ticket.x, ticket.y, ticket.width, ticket.height);
  sourceContext.strokeRect(ticket.x, ticket.y, ticket.width, ticket.height);

  if (state.preset === 'display') {
    sourceContext.fillStyle = '#17211e';
    sourceContext.fillRect(92, 84, 454, 108);
  } else {
    sourceContext.strokeStyle = '#e2e8f0';
    sourceContext.lineWidth = 1;
    [70, 202, 226].forEach((y) => {
      sourceContext.beginPath();
      sourceContext.moveTo(74, y);
      sourceContext.lineTo(566, y);
      sourceContext.stroke();
    });
    label(sourceContext, '客户：减论科技', 76, 62, C.muted, 'left', '600 12px Segoe UI, sans-serif');
    label(sourceContext, '金额 ¥128.00', 474, 153, C.muted, 'left', '600 13px Segoe UI, sans-serif');
  }

  const trueBox = { x: 142, y: 108, width: 310, height: 66 };
  const textCenterX = trueBox.x + trueBox.width / 2;
  const textCenterY = trueBox.y + trueBox.height / 2;
  sourceContext.save();
  sourceContext.translate(textCenterX, textCenterY);
  sourceContext.rotate(scene.rotationDeg * Math.PI / 180);
  sourceContext.translate(-textCenterX, -textCenterY);
  sourceContext.filter = scene.blurPx > 0.15 ? `blur(${scene.blurPx.toFixed(2)}px)` : 'none';
  sourceContext.fillStyle = state.preset === 'display' ? '#9bf2b0' : C.ink;
  sourceContext.font = state.preset === 'industrial'
    ? '800 43px Impact, Arial Narrow, sans-serif'
    : state.preset === 'dot'
      ? '700 40px Consolas, monospace'
      : '800 42px Segoe UI, sans-serif';
  drawSpacedText(sourceContext, 'TEH 2026', 158, 156, scene.characterSpacing);
  sourceContext.restore();
  sourceContext.filter = 'none';

  if (state.preset === 'dot') {
    sourceContext.fillStyle = 'rgba(255,255,255,.44)';
    for (let x = 154; x < 448; x += 8) {
      for (let y = 116; y < 166; y += 8) {
        if ((x + y) % 16 === 0) sourceContext.fillRect(x, y, 3, 3);
      }
    }
  }

  for (let index = 0; index < Math.round(scene.backgroundNoise * 34); index += 1) {
    const x = 74 + ((index * 83) % 488);
    const y = 82 + ((index * 47) % 142);
    sourceContext.fillStyle = index % 3 === 0 ? 'rgba(217,119,6,.18)' : 'rgba(39,68,110,.13)';
    sourceContext.fillRect(x, y, 2 + (index % 4), 2 + ((index + 1) % 3));
  }

  sourceContext.save();
  sourceContext.setLineDash([7, 5]);
  sourceContext.strokeStyle = C.green;
  sourceContext.lineWidth = 2;
  sourceContext.strokeRect(trueBox.x, trueBox.y, trueBox.width, trueBox.height);
  sourceContext.restore();

  const highPressureInset = scene.effectivePressure >= 82 ? 22 : 0;
  const cropInset = scene.cropInset + highPressureInset;
  const cropX = trueBox.x + cropInset + scene.bboxOffsetX;
  const cropY = trueBox.y + cropInset * 0.22 + scene.bboxOffsetY;
  const cropWidth = Math.max(122, trueBox.width - cropInset * 2);
  const cropHeight = Math.max(38, trueBox.height - cropInset * 0.44);

  sourceContext.fillStyle = 'rgba(238,244,248,.72)';
  sourceContext.fillRect(ticket.x, ticket.y, ticket.width, Math.max(0, cropY - ticket.y));
  sourceContext.fillRect(ticket.x, cropY + cropHeight, ticket.width, Math.max(0, ticket.y + ticket.height - cropY - cropHeight));
  sourceContext.fillRect(ticket.x, cropY, Math.max(0, cropX - ticket.x), cropHeight);
  sourceContext.fillRect(cropX + cropWidth, cropY, Math.max(0, ticket.x + ticket.width - cropX - cropWidth), cropHeight);

  const cropColor = scene.localizationRisk === 2 || scene.evidenceLoss === 2
    ? C.red
    : scene.localizationRisk === 1 || scene.evidenceLoss === 1
      ? C.orange
      : C.blue;
  sourceContext.strokeStyle = cropColor;
  sourceContext.lineWidth = 3;
  sourceContext.strokeRect(cropX, cropY, cropWidth, cropHeight);

  let renderedSource = source;
  if (state.resolution < 1) {
    const reduced = document.createElement('canvas');
    reduced.width = Math.max(120, Math.round(width * state.resolution));
    reduced.height = Math.max(60, Math.round(sceneHeight * state.resolution));
    const reducedContext = reduced.getContext('2d');
    if (reducedContext) {
      reducedContext.imageSmoothingEnabled = true;
      reducedContext.drawImage(source, 0, 0, reduced.width, reduced.height);
      renderedSource = reduced;
    }
  }

  const zoom = RESOLUTION_ZOOM[state.resolution];
  const destinationWidth = width * zoom;
  const destinationHeight = sceneHeight * zoom;
  const destinationX = (width - destinationWidth) / 2;
  const destinationY = (sceneHeight - destinationHeight) / 2;
  context.save();
  context.beginPath();
  context.rect(0, 0, width, sceneHeight);
  context.clip();
  context.imageSmoothingEnabled = state.resolution >= 0.71;
  context.drawImage(
    renderedSource,
    0,
    0,
    renderedSource.width,
    renderedSource.height,
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight,
  );
  context.restore();
  context.imageSmoothingEnabled = true;

  label(context, '绿色虚线：真实文字区域', 24, 324, C.green);
  label(context, '实线：当前裁剪 / 检测框', 616, 324, cropColor, 'right');
}

function useStressCanvas(
  state: ReturnType<typeof useChapter2Scene>,
  scene: ReturnType<typeof deriveChapter2Scene>,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let context: CanvasRenderingContext2D;
    try {
      context = setupCanvas(canvas, 640, 340);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    drawScene(context, state, scene);
    canvas.classList.add('is-ready');
  }, [state, scene]);
  return ref;
}

function RiskRow({ label: name, level, value, note }: { label: string; level: RiskLevel; value: string; note: string }) {
  return (
    <div className={`stress-risk level-${level}`}>
      <div className="stress-risk-head"><strong>{name}</strong><span>{value}</span></div>
      <div className="stress-risk-track" aria-label={`${name}：${value}`}>
        {[0, 1, 2].map((index) => <i key={index} className={index === level ? 'active' : ''} />)}
      </div>
      <p>{note}</p>
    </div>
  );
}

export const Ch1Stress: React.FC<WidgetProps> = () => {
  const state = useChapter2Scene();
  const scene = useMemo(() => deriveChapter2Scene(state), [state]);
  const canvasRef = useStressCanvas(state, scene);
  const [thresholdPulse, setThresholdPulse] = useState(false);
  const previousRewrite = useRef(scene.rewriteTriggered);

  useEffect(() => {
    if (!previousRewrite.current && scene.rewriteTriggered) {
      setThresholdPulse(true);
      if ('vibrate' in navigator) navigator.vibrate(18);
      const timer = window.setTimeout(() => setThresholdPulse(false), 620);
      previousRewrite.current = scene.rewriteTriggered;
      return () => window.clearTimeout(timer);
    }
    previousRewrite.current = scene.rewriteTriggered;
  }, [scene.rewriteTriggered]);

  const localizationText = scene.localizationRisk === 0 ? '稳定' : scene.localizationRisk === 1 ? '轻微漂移' : '明显漂移';
  const evidenceText = scene.evidenceLoss === 0 ? '完整' : scene.evidenceLoss === 1 ? '部分受损' : '严重缺失';
  const recognitionLevel: RiskLevel = scene.rewriteTriggered ? 2 : scene.effectivePressure >= 48 ? 1 : 0;
  const recognitionText = recognitionLevel === 0 ? '忠实读取' : recognitionLevel === 1 ? '不稳定' : '发生改写';
  const cropOption = CROP_OPTIONS.find((option) => option.value === state.cropMargin) ?? CROP_OPTIONS[1];
  const primaryPreset = state.preset === 'display' || state.preset === 'dot' ? 'industrial' : state.preset;

  const feedback = scene.rewriteTriggered
    ? '视觉证据变弱了，但错误输出仍然很“像真的”。'
    : scene.evidenceLoss === 2
      ? '字符边缘已经明显缺失；此时即使输出仍像文字，也不能据此判断识别正确。'
      : scene.localizationRisk > 0
        ? '检测框开始偏离真实文字，后续裁剪得到的视觉证据也随之改变。'
        : scene.evidenceLoss > 0
          ? '部分字符证据正在受损，识别行为开始变得不稳定。'
          : '当前文字、检测框和裁剪区域都保持稳定。';

  return (
    <div className="ocr-stress-test">
      <div className="stress-inheritance">
        <span>字符级核验完成</span>
        <strong>现在破坏同一张票据的视觉证据</strong>
        <em>教学样例：TEH 2026</em>
      </div>

      <div className="stress-main">
        <section className="stress-scene" aria-label="退化后的文字场景">
          <div className="stress-section-head"><strong>视觉压力实验台</strong><span>交互状态 / 教学示意</span></div>
          <div className="stress-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={640}
              height={340}
              role="img"
              aria-label={`真实文字 TEH 2026。定位${localizationText}，视觉证据${evidenceText}，识别行为${recognitionText}，当前输出${scene.predictedText}。`}
            />
          </div>
          <div className={`stress-output ${scene.rewriteTriggered ? 'rewritten' : 'faithful'} ${thresholdPulse ? 'threshold-pulse' : ''}`}>
            <span>当前识别结果</span>
            <strong>{scene.predictedText}</strong>
            <small>{scene.rewriteTriggered ? '看起来合理，但已偏离图像' : '当前仍与可见字符一致'}</small>
          </div>
        </section>

        <aside className="stress-status" aria-label="OCR 压力测试状态">
          <div className="stress-section-head"><strong>离散状态</strong><span>不代表论文指标</span></div>
          <RiskRow
            label="定位"
            level={scene.localizationRisk}
            value={localizationText}
            note={scene.localizationRisk === 0 ? '检测框仍覆盖真实文字。' : '实线框正在偏离绿色真实区域。'}
          />
          <RiskRow
            label="视觉证据"
            level={scene.evidenceLoss}
            value={evidenceText}
            note={scene.evidenceLoss === 0 ? '字符边缘和裁剪边界完整。' : '裁切、缩放或退化正在削弱字符证据。'}
          />
          <RiskRow
            label="识别行为"
            level={recognitionLevel}
            value={recognitionText}
            note={scene.rewriteTriggered ? 'TEH 被语言先验改写成更常见的 THE。' : recognitionLevel === 1 ? '输出尚未改写，但视觉依据已经变弱。' : '输出忠实保留 TEH。'}
          />
        </aside>
      </div>

      <div className="stress-primary-control">
        <div className="stress-control-label">
          <label htmlFor="scene-pressure">逐步破坏视觉证据</label>
          <span>教学压力测试 · 教学示意</span>
        </div>
        <input
          id="scene-pressure"
          type="range"
          min="0"
          max="100"
          value={state.pressure}
          aria-valuetext={`${localizationText}，视觉证据${evidenceText}，识别行为${recognitionText}`}
          onChange={(event) => updateChapter2Scene({ pressure: Number(event.target.value) })}
        />
        <div className="stress-thresholds" aria-hidden="true">
          <span>稳定</span><span>轻微干扰</span><span>证据开始受损</span><span>可能改写</span>
        </div>
      </div>

      <div className={`stress-feedback ${scene.rewriteTriggered ? 'bad' : scene.localizationRisk === 0 && scene.evidenceLoss === 0 ? 'good' : ''}`} role="status" aria-live="polite">
        <span>教学示意</span>{feedback}
      </div>

      <details className="stress-experiments">
        <summary>用论文实验变量继续测试</summary>
        <div className="stress-experiment-body">
          <section className="stress-experiment-card">
            <div className="stress-experiment-title"><span>论文实验变量</span><strong>Crop margin</strong></div>
            <div className="stress-option-row crop-options" role="group" aria-label="选择裁切边界">
              {CROP_OPTIONS.map((option) => (
                <button key={option.value} type="button" className={state.cropMargin === option.value ? 'selected' : ''} aria-pressed={state.cropMargin === option.value} onClick={() => updateChapter2Scene({ cropMargin: option.value })}>
                  {option.label}
                </button>
              ))}
            </div>
            <p className="stress-variable-note">{cropOption.note}</p>
          </section>

          <section className="stress-experiment-card resolution-control">
            <div className="stress-experiment-title"><span>论文实验变量 · Table 5</span><strong>Input resolution</strong></div>
            <div className="resolution-scale-row" role="group" aria-label="选择输入分辨率尺度">
              {RESOLUTION_SCALES.map((scale) => (
                <button key={scale} type="button" className={state.resolution === scale ? 'selected' : ''} aria-pressed={state.resolution === scale} onClick={() => updateChapter2Scene({ resolution: scale })}>
                  {scale.toFixed(2)}×
                </button>
              ))}
            </div>
            <p className="stress-variable-note">切换尺度会直接改变上方票据的视觉尺寸和可见细节。</p>
          </section>

          <section className="stress-experiment-card preset-control">
            <div className="stress-experiment-title"><span>论文覆盖场景</span><strong>Scene preset</strong></div>
            <div className="stress-option-row" role="group" aria-label="选择场景预设">
              {PRIMARY_PRESETS.map((preset) => (
                <button key={preset.value} type="button" className={primaryPreset === preset.value ? 'selected' : ''} aria-pressed={primaryPreset === preset.value} onClick={() => updateChapter2Scene({ preset: preset.value })}>
                  {preset.label}
                </button>
              ))}
            </div>
            {primaryPreset === 'industrial' ? (
              <div className="stress-industrial-subtypes" role="group" aria-label="选择工业场景类型">
                {INDUSTRIAL_PRESETS.map((preset) => (
                  <button key={preset.value} type="button" className={state.preset === preset.value ? 'selected' : ''} aria-pressed={state.preset === preset.value} onClick={() => updateChapter2Scene({ preset: preset.value })}>
                    {preset.label}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <button className="stress-reset ui-replay" type="button" onClick={resetChapter2Stress}><LineIcon name="rotate" />恢复标准场景</button>
        </div>
      </details>

    </div>
  );
};
