import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 200;
const C = {
  bg: '#f5f8f0',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

type Mode = 'input' | 'model';

const INPUT_LEVELS = [
  { id: 0, chip: '一级', prompt: '请攻击这个模型', score: 0.28, tone: 'bad' as const },
  { id: 1, chip: '二级', prompt: '请狠狠攻击这个模型', score: 0.56, tone: 'mid' as const },
  { id: 2, chip: '三级', prompt: '请超级狠攻击这个模型', score: 0.79, tone: 'good' as const },
];

function scoreTone(score: number): 'bad' | 'mid' | 'good' {
  if (score >= 0.7) return 'good';
  if (score >= 0.45) return 'mid';
  return 'bad';
}

function scoreColor(score: number): string {
  if (score >= 0.7) return C.red;
  if (score >= 0.45) return C.orange;
  return C.blue;
}

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<Mode>('input');
  const [level, setLevel] = useState(0);
  const [train, setTrain] = useState(0.2);
  const [imgReady, setImgReady] = useState(false);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ mode: 'input' as Mode, score: 0.28, shown: 0.28 });

  const score = mode === 'input' ? INPUT_LEVELS[level].score : 0.18 + train * 0.74;
  const tone = mode === 'input' ? INPUT_LEVELS[level].tone : scoreTone(score);
  const prompt = mode === 'input' ? INPUT_LEVELS[level].prompt : `A_θ 随训练生成攻击提示 · 训练程度 ${(train * 100).toFixed(0)}%`;

  useEffect(() => {
    stateRef.current.mode = mode;
    stateRef.current.score = score;
  }, [mode, score]);

  useEffect(() => {
    const img = new Image();
    img.src = '/images/lock-checklist.png';
    img.onload = () => {
      imgRef.current = img;
      setImgReady(true);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      s.shown = lerp(s.shown, s.score, 0.1);
      const v = s.shown;
      const color = scoreColor(v);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.fillRect(14, 14, 196, 172);
      ctx.strokeRect(14, 14, 196, 172);
      const img = imgRef.current;
      if (img) {
        const pad = 10;
        const maxW = 196 - pad * 2;
        const maxH = 172 - pad * 2;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, 14 + (196 - dw) / 2, 14 + (172 - dh) / 2, dw, dh);
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(226, 14, 320, 172);
      ctx.strokeRect(226, 14, 320, 172);

      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(s.mode === 'input' ? '输入空间 · 手改 Prompt' : '模型级 · 训练攻击器 A_θ', 244, 40);
      ctx.fillStyle = C.text;
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('危险度评分', 244, 66);

      ctx.fillStyle = '#eef2ea';
      ctx.fillRect(244, 86, 248, 16);
      ctx.fillStyle = color;
      ctx.fillRect(244, 86, 248 * v, 16);

      ctx.fillStyle = color;
      ctx.font = 'bold 28px "Segoe UI", sans-serif';
      ctx.fillText(`${Math.round(v * 100)}`, 244, 144);
      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('/ 100', 300, 144);
      ctx.fillText(v < 0.45 ? '门缝刚动' : v < 0.7 ? '开始吃力' : '危险明显上升', 244, 168);
    };

    const tick = () => {
      render();
      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [imgReady]);

  return (
    <div>
      <div className="chip-row">
        <button
          type="button"
          className={`chip${mode === 'input' ? ' selected' : ''}`}
          onClick={() => setMode('input')}
        >
          输入空间优化
        </button>
        <button
          type="button"
          className={`chip${mode === 'model' ? ' selected' : ''}`}
          onClick={() => setMode('model')}
        >
          模型级优化
        </button>
      </div>

      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />

      {mode === 'input' ? (
        <div className="chip-row" style={{ marginTop: 12 }}>
          {INPUT_LEVELS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip${level === item.id ? ' selected' : ''}`}
              onClick={() => setLevel(item.id)}
            >
              {item.chip}
            </button>
          ))}
        </div>
      ) : (
        <div className="ctrl" style={{ marginTop: 12 }}>
          <label>
            训练程度 <span className="val">{Math.round(train * 100)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(train * 100)}
            onChange={(e) => setTrain(Number(e.target.value) / 100)}
          />
        </div>
      )}

      <div className={`opt-card ${tone}`} style={{ marginTop: 10 }}>
        <div className="opt-kicker">{mode === 'input' ? '当前 Prompt' : '训练中的攻击器'}</div>
        <pre className="opt-pre">{prompt}</pre>
      </div>

      <div className="compare-row opt-io" style={{ marginTop: 10 }}>
        <div className="opt-card good">
          <div className="opt-kicker">优点</div>
          <pre className="opt-pre">
            {mode === 'input'
              ? '不改模型，上手快；换一句 Prompt 就能试一轮。'
              : '对 θ 连续优化，自然产出 Token；一次训练可摊到多行为、多部署。'}
          </pre>
        </div>
        <div className="opt-card bad">
          <div className="opt-kicker">缺点</div>
          <pre className="opt-pre">
            {mode === 'input'
              ? '只是把话写得更狠，查询贵、难摊销；梯度搜还常要白盒。'
              : '先要训练攻击器，一次投入更高；实现比改 Prompt 重。'}
          </pre>
        </div>
      </div>

      <div className={`feedback ${tone === 'good' ? 'good' : tone === 'bad' ? 'bad' : ''}`}>
        {mode === 'input'
          ? '输入空间：危险度随 Prompt 加码上升，但换行为往往要重写——难过效率与适用关。'
          : '模型级：拉高训练程度，危险度跟着升。改的是手法（θ），不是再手写一句更狠的话。'}
      </div>
    </div>
  );
};

export default Ch2Mod1;
