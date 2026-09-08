import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const ROUTE = '#92400e';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const TEXT = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';

function useCanvas(draw: (ctx: CanvasRenderingContext2D, time: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const tick = (time: number) => {
      draw(ctx, time / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf.current === null) raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [draw]);

  return ref;
}

function drawBase(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#edf2e6';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f8faf4';
  ctx.fillRect(16, 14, W - 32, H - 28);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(16, 14, W - 32, H - 28);
  ctx.fillStyle = '#e4ecd7';
  ctx.fillRect(24, 166, W - 48, 28);
  ctx.fillStyle = ROUTE;
  ctx.fillRect(84, 66, 390, 4);
  ctx.fillStyle = LIGHT;
  ctx.fillRect(130, 52, 170, 104);
  ctx.fillStyle = DARK;
  ctx.fillRect(66, 52, 52, 108);
  ctx.fillRect(442, 48, 46, 104);
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = TEXT) {
  ctx.fillStyle = color;
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.fillText(text, x, y);
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  blur: number,
  tint: string,
  label: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#fffdf6';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = BORDER;
  ctx.strokeRect(0, 0, w, h);
  ctx.fillStyle = `rgba(35,50,74,${0.12 + blur * 0.28})`;
  ctx.fillRect(8, 8, w - 16, h - 16);
  ctx.fillStyle = tint;
  ctx.globalAlpha = 0.88 - blur * 0.26;
  ctx.fillRect(18, 20, w - 36, 28);
  ctx.fillStyle = '#efe7d8';
  ctx.fillRect(26, 62, w - 52, h - 88);
  ctx.fillStyle = blur > 0.55 ? RED : blur > 0.25 ? ORANGE : GREEN;
  ctx.globalAlpha = 0.5 + 0.35 * (1 - blur);
  ctx.beginPath();
  ctx.arc(w * 0.34, h * 0.63, 28 + 8 * blur, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = TEXT;
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.fillText(label, 16, h - 16);
  ctx.restore();
}

function drawPanelTitle(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.font = '700 15px "Segoe UI", sans-serif';
  ctx.fillText(text, x, y);
}

export const HeroDarkroom: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useCanvas((ctx) => {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawBase(ctx);
    const isOld = moduleId === 'old';
    drawPhoto(ctx, 146, 42, 268, 146, isOld ? 0.78 : 0.12, isOld ? RED : GREEN, isOld ? '旧路线' : '统一空间');
    ctx.fillStyle = isOld ? RED : BLUE;
    ctx.fillRect(isOld ? 128 : 412, 30, 24, 88);
    drawPanelTitle(ctx, isOld ? '分裂式处理' : '统一建模', 28, 36, isOld ? RED : BLUE);
  });
  return <canvas ref={canvasRef} width={W} height={H} />;
};

export const DarkroomSlider: React.FC<WidgetProps> = () => {
  const [noise, setNoise] = useState(74);
  const [fixed, setFixed] = useState(false);
  const feedback = fixed
    ? { text: '统一表示把噪点压下去了，底片开始回到可读状态。', cls: 'good' as const }
    : noise > 70
      ? { text: '噪点偏高，细节已经被打散。', cls: 'bad' as const }
      : { text: '还在中间区间，结构刚开始变清楚。', cls: '' as const };
  const canvasRef = useCanvas((ctx) => {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawBase(ctx);
    const blur = fixed ? 0.08 : clamp(noise / 100, 0, 1);
    drawPhoto(ctx, 144, 40, 270, 146, blur, fixed ? GREEN : RED, fixed ? '统一显影' : '分散显影');
    drawLabel(ctx, '噪点', 28, 48, MUTED);
    drawLabel(ctx, String(noise), 72, 48, TEXT);
    drawLabel(ctx, fixed ? '统一显影' : '分散显影', 28, 76, fixed ? GREEN : RED);
    ctx.fillStyle = BORDER;
    ctx.fillRect(28, 98, 206, 8);
    ctx.fillStyle = fixed ? GREEN : noise > 70 ? RED : BLUE;
    ctx.fillRect(28, 98, 206 * noise / 100, 8);
    ctx.strokeStyle = ROUTE;
    ctx.strokeRect(28, 98, 206, 8);
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(28 + 206 * noise / 100, 102, 8, 0, Math.PI * 2);
    ctx.fill();
    drawLabel(ctx, fixed ? '修复后更稳' : noise > 70 ? '太糊了' : '还能看', 256, 48, fixed ? GREEN : noise > 70 ? RED : BLUE);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>显影噪点 <span className="val">{noise}</span></label>
        <input type="range" min={0} max={100} value={noise} onInput={(e) => setNoise(Number((e.target as HTMLInputElement).value))} />
      </div>
      <div className="ctrl">
        <button className="chip" onClick={() => setFixed((v) => !v)}>{fixed ? '切回分散显影' : '切换统一显影'}</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export const DarkroomHotspots: React.FC<WidgetProps> = ({ moduleId }) => {
  const modes = moduleId === '9.1'
    ? ['去重', '审美', '水印', '任务一致性']
    : ['图像', '文本', '条件', '目标'];
  const [sel, setSel] = useState(0);
  const copy = moduleId === '9.1'
    ? [
        '去重打开时，重复片会被压下去。',
        '审美过滤让样本更顺眼，也更适合训练。',
        '水印太重或任务不匹配，会被筛掉。',
        '任务一致性打开后，留下的才是真正能学的样本。'
      ]
    : [
        '图像 token 还没和文字对齐。',
        '文本 token 已经可以一起看了。',
        '条件 token 加进来后，统一空间开始成形。',
        '目标 token 让后续预测有了明确落点。'
      ];
  const canvasRef = useCanvas((ctx) => {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawBase(ctx);
    ctx.fillStyle = '#fbfbf7';
    ctx.fillRect(48, 42, 220, 136);
    ctx.strokeStyle = BORDER;
    ctx.strokeRect(48, 42, 220, 136);
    modes.forEach((m, i) => {
      const x = 286 + (i % 2) * 112;
      const y = 48 + Math.floor(i / 2) * 56;
      ctx.fillStyle = i === sel ? (moduleId === '9.1' ? ORANGE : BLUE) : '#eef3e7';
      ctx.fillRect(x, y, 94, 36);
      ctx.strokeStyle = i === sel ? (moduleId === '9.1' ? ORANGE : BLUE) : BORDER;
      ctx.strokeRect(x, y, 94, 36);
      drawLabel(ctx, m, x + 12, y + 23, i === sel ? TEXT : MUTED);
    });
    drawPhoto(ctx, 72, 60, 176, 102, [0.2, 0.45, 0.12, 0.3][sel], [BLUE, ORANGE, PURPLE, GREEN][sel], modes[sel]);
    drawLabel(ctx, moduleId === '9.1' ? '样本库' : '统一 token', 320, 34, TEXT);
    drawLabel(ctx, moduleId === '9.1' ? '筛选前' : '输入样本', 60, 34, TEXT);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) * W / rect.width;
        const y = (e.clientY - rect.top) * H / rect.height;
        if (x > 286 && y > 44) {
          const idx = Math.min(3, Math.floor((y - 48) / 56) * 2 + (x > 398 ? 1 : 0));
          setSel(idx);
        }
      }} />
      <div className="ctrl">
        {modes.map((m, i) => (
          <button key={m} className={`chip ${i === sel ? 'sel' : ''}`} onClick={() => setSel(i)}>{m}</button>
        ))}
      </div>
      <div className={`feedback ${moduleId === '9.1' && sel === 2 ? 'bad' : sel === modes.length - 1 ? 'good' : ''}`}>{copy[sel]}</div>
    </div>
  );
};

export const DarkroomStepper: React.FC<WidgetProps> = ({ moduleId }) => {
  const steps = moduleId === '3.1'
    ? ['原始提示', '补充主体', '补齐空间', '完整说明']
    : ['低粒度', '中粒度', '高粒度', '最细说明'];
  const tips = moduleId === '3.1'
    ? ['太短会漏掉布局。', '主体、空间和方向先说清。', '结构化提示词更稳。', '这一步生成会最明确。']
    : ['太粗会丢信息。', '中等粒度通常最平衡。', '更细能压住歧义。', '但别写成流水账。'];
  const [step, setStep] = useState(0);
  const canvasRef = useCanvas((ctx, time) => {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawBase(ctx);
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(36, 44, 488, 124);
    ctx.strokeStyle = BORDER;
    ctx.strokeRect(36, 44, 488, 124);
    drawPhoto(ctx, 64, 58, 156, 92, [0.6, 0.35, 0.15, 0.05][step], step < 2 ? RED : GREEN, steps[step]);
    steps.forEach((s, i) => {
      ctx.fillStyle = i === step ? BLUE : MUTED;
      ctx.fillRect(286 + i * 64, 72, 40, i <= step ? 26 : 12);
      drawLabel(ctx, s, 274 + i * 64, 120, i === step ? TEXT : MUTED);
    });
    drawLabel(ctx, '当前阶段', 64, 34, TEXT);
    drawLabel(ctx, tips[step], 286, 148, step < 2 ? RED : GREEN);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        {steps.map((s, i) => (
          <button key={s} className={`tiny ${i === step ? '' : 'ghost'}`} onClick={() => setStep(i)}>{s}</button>
        ))}
      </div>
      <div className={`feedback ${step < 2 ? 'bad' : 'good'}`}>{tips[step]}</div>
    </div>
  );
};

export const DarkroomChips: React.FC<WidgetProps> = ({ moduleId }) => {
  const modes = moduleId === '4.1' ? ['像素', '文本', '条件'] : moduleId === '8.2' ? ['8B', '200B+', '同骨架'] : ['弱引导', '中引导', '强引导'];
  const labels = moduleId === '4.1'
    ? ['像素 token 直接承接底片信息。', '文本 token 携带提示语义。', '条件 token 把参考图和任务条件带进来。']
    : moduleId === '8.2'
      ? ['轻量版适合快速部署。', '超大版更能承载复杂推理。', '两者共享同一骨架。']
      : ['引导太弱，条件不够稳。', '中档通常最平衡。', '过强会把主体拉偏。'];
  const [sel, setSel] = useState(1);
  const canvasRef = useCanvas((ctx) => {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawBase(ctx);
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(38, 48, 286, 128);
    ctx.strokeStyle = BORDER;
    ctx.strokeRect(38, 48, 286, 128);
    const bars = [0.35, 0.55, 0.85];
    bars.forEach((b, i) => {
      ctx.fillStyle = i === sel ? (i === 2 ? GREEN : i === 0 ? RED : BLUE) : '#e7eee0';
      ctx.fillRect(62 + i * 76, 152 - b * 70, 40, b * 70);
      ctx.strokeStyle = i === sel ? TEXT : BORDER;
      ctx.strokeRect(62 + i * 76, 152 - b * 70, 40, b * 70);
      drawLabel(ctx, modes[i], 56 + i * 76, 172, i === sel ? TEXT : MUTED);
    });
    drawPhoto(ctx, 356, 52, 152, 102, sel === 0 ? 0.45 : sel === 1 ? 0.22 : 0.07, sel === 0 ? RED : sel === 1 ? BLUE : GREEN, modes[sel]);
    drawLabel(ctx, moduleId === '8.2' ? '模型规模' : moduleId === '4.1' ? 'token 类型' : '引导强度', 52, 36, TEXT);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">{modes.map((m, i) => <button key={m} className={`chip ${i === sel ? 'sel' : ''}`} onClick={() => setSel(i)}>{m}</button>)}</div>
      <div className={`feedback ${sel === 0 ? 'bad' : sel === 2 ? 'good' : ''}`}>{labels[sel]}</div>
    </div>
  );
};

export const DarkroomCompare: React.FC<WidgetProps> = ({ moduleId }) => {
  const [go, setGo] = useState(false);
  const [t0, setT0] = useState(0);
  const canvasRef = useCanvas((ctx, time) => {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawBase(ctx);
    const p = go ? clamp((time - t0) / 2.2, 0, 1) : 0;
    const left = clamp(p * 1.1, 0, 1);
    const right = clamp(p * 1.45, 0, 1);
    ctx.fillStyle = BORDER;
    ctx.fillRect(94, 36, 2, 170);
    drawPhoto(ctx, 46, 52, 182, 110, 0.78 - left * 0.46, RED, moduleId === '10.2' ? '方案 A' : '完整轨迹');
    drawPhoto(ctx, 300, 52, 182, 110, 0.6 - right * 0.52, GREEN, moduleId === '10.2' ? '方案 B' : '28 步蒸馏');
    drawLabel(ctx, moduleId === '10.2' ? '验证方案 A' : '完整轨迹', 46, 40, RED);
    drawLabel(ctx, moduleId === '10.2' ? '验证方案 B' : '28 步蒸馏', 300, 40, GREEN);
    ctx.fillStyle = MUTED;
    ctx.fillRect(48, 180, 412, 6);
    ctx.fillStyle = RED;
    ctx.fillRect(48, 180, 160 * left, 6);
    ctx.fillStyle = GREEN;
    ctx.fillRect(254, 180, 160 * right, 6);
    drawLabel(ctx, go ? '轨迹在同步展开' : '尚未开始', 212, 202, go ? BLUE : MUTED);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip sel" onClick={() => { setT0(performance.now() / 1000); setGo(true); }}>{go ? '重新对比' : '开始比较'}</button>
      </div>
      <div className={`feedback ${go ? 'good' : ''}`}>{go ? '两条轨迹已并排展开，差异会更容易看见。' : '按按钮后，完整轨迹和蒸馏版会一起动起来。'}</div>
    </div>
  );
};

export const DarkroomDrag: React.FC<WidgetProps> = ({ moduleId }) => {
  const [v, setV] = useState(0.45);
  const dragging = useRef(false);
  const canvasRef = useCanvas((ctx, time) => {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawBase(ctx);
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(42, 50, 476, 118);
    ctx.strokeStyle = BORDER;
    ctx.strokeRect(42, 50, 476, 118);
    const x = 92 + v * 340;
    ctx.fillStyle = '#e8efe2';
    ctx.fillRect(92, 104, 340, 10);
    ctx.fillStyle = BORDER;
    ctx.strokeRect(92, 104, 340, 10);
    ctx.fillStyle = BLUE;
    ctx.fillRect(92, 104, 340 * (1 - v), 10);
    ctx.fillStyle = GREEN;
    ctx.fillRect(92 + 340 * (1 - v), 104, 340 * v, 10);
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(x, 109, 14, 0, Math.PI * 2);
    ctx.fill();
    drawLabel(ctx, moduleId === '7.1' ? '损失配比' : '比例尺', 62, 38, TEXT);
    drawLabel(ctx, v < 0.3 ? '感知项偏轻' : v > 0.7 ? '主体项偏重' : '三项较平衡', 318, 38, v < 0.3 || v > 0.7 ? RED : GREEN);
    const vals = [v, (1 - v) * 0.55 + 0.18, 0.38 + Math.sin(time * 1.8) * 0.04];
    vals.forEach((n, i) => {
      const h = 24 + n * 52;
      ctx.fillStyle = [BLUE, GREEN, PURPLE][i];
      ctx.fillRect(446 + i * 18, 154 - h, 14, h);
    });
  });
  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'grab' }}
        onPointerDown={(e) => {
          dragging.current = true;
          const r = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - r.left) * W / r.width;
          setV(clamp((x - 92) / 340, 0, 1));
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - r.left) * W / r.width;
          setV(clamp((x - 92) / 340, 0, 1));
        }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerLeave={() => { dragging.current = false; }}
      />
      <div className={`feedback ${v < 0.3 || v > 0.7 ? 'bad' : 'good'}`}>
        {v < 0.3 ? '感知项太轻，细节会发硬。' : v > 0.7 ? '主体项太重，画面容易发飘。' : '现在三项更平衡，训练更容易收敛。'}
      </div>
    </div>
  );
};

export const DarkroomMap: React.FC<WidgetProps> = ({ moduleId }) => {
  const nodes = moduleId === '8.1' ? ['输入', '编码', '注意力', '预测头', '输出'] : ['收集', '去重', '过滤', '提示', '样本'];
  const [sel, setSel] = useState(0);
  const canvasRef = useCanvas((ctx) => {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawBase(ctx);
    const pts = nodes.map((_, i) => [90 + i * 82, i % 2 ? 80 : 130] as const);
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 3;
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    });
    ctx.stroke();
    pts.forEach((p, i) => {
      ctx.fillStyle = i === sel ? BLUE : '#edf2e6';
      ctx.beginPath();
      ctx.arc(p[0], p[1], i === sel ? 21 : 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = i === sel ? BLUE : BORDER;
      ctx.stroke();
      drawLabel(ctx, nodes[i], p[0] - 18, p[1] + 36, i === sel ? TEXT : MUTED);
    });
    ctx.fillStyle = TEXT;
    ctx.fillRect(74, 164, 360, 24);
    ctx.fillStyle = '#fff';
    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.fillText(moduleId === '8.1' ? '点击节点看 UiT 的数据流' : '点击节点看数据筛选过程', 86, 181);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - r.left) * W / r.width;
        const idx = Math.round((x - 90) / 82);
        if (idx >= 0 && idx < nodes.length) setSel(idx);
      }} />
      <div className="ctrl">{nodes.map((n, i) => <button key={n} className={`chip ${i === sel ? 'sel' : ''}`} onClick={() => setSel(i)}>{n}</button>)}</div>
      <div className={`feedback ${sel === nodes.length - 1 ? 'good' : ''}`}>{moduleId === '8.1' ? `当前选中：${nodes[sel]}。` : `当前筛选阶段：${nodes[sel]}。`}</div>
    </div>
  );
};

export const DarkroomRace: React.FC<WidgetProps> = ({ moduleId }) => {
  const bars = moduleId === '10.1'
    ? [
        { name: 'HiDream-O1-Image', value: 0.90, color: GREEN },
        { name: 'HiDream-O1-Image-Pro', value: 0.92, color: BLUE },
        { name: 'Qwen-Image', value: 0.87, color: ORANGE },
        { name: 'FLUX.2', value: 0.87, color: PURPLE }
      ]
    : [
        { name: 'Q-PF', value: 0.865, color: BLUE },
        { name: 'Q-SC', value: 0.725, color: GREEN },
        { name: 'O', value: 0.795, color: ORANGE }
      ];
  const [go, setGo] = useState(false);
  const [t0, setT0] = useState(0);
  const canvasRef = useCanvas((ctx, time) => {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawBase(ctx);
    const p = go ? clamp((time - t0) / 2.6, 0, 1) : 0;
    bars.forEach((b, i) => {
      const x = 66;
      const y = 44 + i * 40;
      const w = 360 * clamp(p * (0.7 + i * 0.12), 0, 1);
      ctx.fillStyle = '#e6ecdf';
      ctx.fillRect(x, y, 360, 20);
      ctx.fillStyle = b.color;
      ctx.fillRect(x, y, w, 20);
      ctx.strokeStyle = BORDER;
      ctx.strokeRect(x, y, 360, 20);
      drawLabel(ctx, b.name, 442, y + 15, TEXT);
      drawLabel(ctx, Math.round(b.value * 100).toString(), 500, y + 15, b.color);
    });
    drawLabel(ctx, go ? '跑道已启动' : '按按钮开始', 66, 176, go ? BLUE : MUTED);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip sel" onClick={() => { setT0(performance.now() / 1000); setGo(true); }}>{go ? '重新比较' : '开始赛跑'}</button>
      </div>
      <div className={`feedback ${go ? 'good' : ''}`}>{go ? '最新轨迹已经冲到前面。' : '按下按钮，让验证分数一起跑起来。'}</div>
    </div>
  );
};

export default HeroDarkroom;
