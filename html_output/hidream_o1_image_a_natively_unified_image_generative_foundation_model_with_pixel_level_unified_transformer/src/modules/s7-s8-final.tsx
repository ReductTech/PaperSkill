import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let t = 0;
    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    resize();
    ro.observe(canvas);
    const frame = () => {
      draw(ctx, canvas.clientWidth || 1, canvas.clientHeight || 1, t);
      t += 0.016;
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [draw]);
  return ref;
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function EfficiencyCanvas() {
  const ref = useCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h * 0.5;
    const tilt = -0.18 + Math.sin(t * 2) * 0.025;
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.28, cy + tilt * 40);
    ctx.lineTo(cx + w * 0.28, cy - tilt * 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 42);
    ctx.lineTo(cx, cy + 30);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy - 44, 8, 0, Math.PI * 2);
    ctx.fill();

    const pans = [
      { x: cx - w * 0.26, y: cy + 36, label: '8B', color: '#2563eb', stars: 5 },
      { x: cx + w * 0.26, y: cy + 18, label: '27B+', color: '#64748b', stars: 3 },
    ];
    pans.forEach((pan) => {
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pan.x - 36, pan.y - 38);
      ctx.lineTo(pan.x, pan.y - 6);
      ctx.lineTo(pan.x + 36, pan.y - 38);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.strokeStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(pan.x, pan.y, 42, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pan.color;
      ctx.font = '800 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pan.label, pan.x, pan.y + 5);
      for (let i = 0; i < pan.stars; i += 1) {
        ctx.fillStyle = pan.color;
        star(ctx, pan.x - 24 + i * 12, pan.y - 34 - Math.sin(t * 3 + i) * 2, 4);
        ctx.fill();
      }
    });
  });
  return <canvas ref={ref} className="s-final-canvas" role="img" aria-label="8B 参数效率天平动画" />;
}

const RADAR_LABELS = ['Single', 'Two', 'Count', 'Color', 'Position', 'Attr', 'Overall'];
const RADAR = [
  { name: 'HiDream-O1 8B', params: '8B', color: '#2563eb', values: [100, 99, 79, 89, 93, 78, 90] },
  { name: 'HiDream-Pro', params: '200B+', color: '#db2777', values: [100, 99, 85, 94, 94, 79, 92] },
  { name: 'Qwen-Image', params: '27B', color: '#16a34a', values: [99, 92, 89, 88, 76, 77, 87] },
  { name: 'FLUX.2 Dev', params: '56B', color: '#d97706', values: [100, 99, 79, 93, 73, 78, 87] },
];

export function S7RadarPanel() {
  const [hover, setHover] = useState<string | null>(null);
  const size = 360;
  const c = size / 2;
  const r = 126;
  const points = (values: number[]) =>
    values
      .map((v, i) => {
        const a = -Math.PI / 2 + (i / RADAR_LABELS.length) * Math.PI * 2;
        return `${c + Math.cos(a) * r * (v / 100)},${c + Math.sin(a) * r * (v / 100)}`;
      })
      .join(' ');
  return (
    <div className="s-final-radar">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="GenEval 六维雷达图">
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle key={scale} cx={c} cy={c} r={r * scale} className="s-final-radar-ring" />
        ))}
        {RADAR_LABELS.map((label, i) => {
          const a = -Math.PI / 2 + (i / RADAR_LABELS.length) * Math.PI * 2;
          return (
            <g key={label}>
              <line x1={c} y1={c} x2={c + Math.cos(a) * r} y2={c + Math.sin(a) * r} />
              <text x={c + Math.cos(a) * (r + 24)} y={c + Math.sin(a) * (r + 24)} textAnchor="middle" dominantBaseline="middle">
                {label}
              </text>
            </g>
          );
        })}
        {RADAR.map((item) => (
          <polygon
            key={item.name}
            points={points(item.values)}
            fill={`${item.color}26`}
            stroke={item.color}
            strokeWidth={hover === item.name ? 3 : 2}
            opacity={!hover || hover === item.name ? 1 : 0.25}
          />
        ))}
      </svg>
      <div className="s-final-legend">
        {RADAR.map((item) => (
          <button key={item.name} onMouseEnter={() => setHover(item.name)} onMouseLeave={() => setHover(null)}>
            <i style={{ background: item.color }} />
            <span>{item.name} · {item.params} · Overall {(item.values[6] / 100).toFixed(2)}</span>
          </button>
        ))}
        <p>8B 的 HiDream-O1-Image 在 Overall 上达到 0.90，高于 27B 与 56B 对比基线的 0.87。</p>
      </div>
    </div>
  );
}

export function ObjectiveStackPanel() {
  const items = [
    { key: 'L_DMD', label: '分布匹配蒸馏', value: 52, color: '#6366f1' },
    { key: 'λ_diff · L_diff', label: '扩散监督', value: 31, color: '#b45309' },
    { key: 'λ_adv · L_adv', label: '对抗保真', value: 17, color: '#0d9488' },
  ];
  return (
    <div className="s-final-stack">
      {items.map((item) => (
        <article key={item.key}>
          <strong style={{ color: item.color }}>{item.key}</strong>
          <span>{item.label}</span>
          <div><i style={{ width: `${item.value}%`, background: item.color }} /></div>
          <em>{item.value}%</em>
        </article>
      ))}
      <p>L_total = L_DMD + λ_diff · L_diff + λ_adv · L_adv</p>
    </div>
  );
}

export function JourneyCanvas() {
  const nodes = useMemo(() => ['数据', '训练', '推理', '应用'], []);
  const ref = useCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const x0 = 26;
    const x1 = w - 26;
    const baseY = h * 0.56;
    const amp = h * 0.16;
    const p = (t * 0.28) % 1;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 60; i += 1) {
      const q = i / 60;
      const x = x0 + (x1 - x0) * q;
      const y = baseY + amp * Math.cos(Math.PI * q) * 0.6 - q * amp * 0.5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    nodes.forEach((label, i) => {
      const q = i / (nodes.length - 1);
      const x = x0 + (x1 - x0) * q;
      const y = baseY + amp * Math.cos(Math.PI * q) * 0.6 - q * amp * 0.5;
      const active = p >= q - 0.06;
      ctx.fillStyle = active ? '#c2410c' : '#fcd9a0';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = active ? '#7c2d12' : '#9a5b2b';
      ctx.font = '700 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y - 14);
    });
    const gx = x0 + (x1 - x0) * p;
    const gy = baseY + amp * Math.cos(Math.PI * p) * 0.6 - p * amp * 0.5;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(gx, gy, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  return <canvas ref={ref} className="s-final-canvas" role="img" aria-label="回看整条路动画" />;
}

export function ApplicationGallery() {
  const scenes = [
    {
      title: '电影镜头控制',
      desc: '15 种镜头与机位控制，让生成结果更像可导演的分镜。',
      img: '/s8/8-1-1.png',
    },
    {
      title: '多面板故事板',
      desc: '单次推理生成连贯故事板，角色与场景在面板间保持一致。',
      img: '/s8/8-1-2.png',
    },
    {
      title: '电商产品图编辑',
      desc: '按指令替换背景、调整摆放，同时保留商品主体细节。',
      img: '/s8/8-1-3.png',
    },
    {
      title: '个性化头像生成',
      desc: '保持主体身份特征，在新风格与新场景中复用同一人物。',
      img: '/s8/8-1-4.png',
    },
  ];
  const [active, setActive] = useState(0);
  const scene = scenes[active];
  return (
    <div className="s-final-gallery">
      <div className="s-final-tabs">
        {scenes.map((item, index) => (
          <button key={item.title} className={active === index ? 'is-active' : ''} onClick={() => setActive(index)}>{item.title}</button>
        ))}
      </div>
      <div className="s-final-gallery-body">
        <figure className="s-final-gallery-art">
          <img src={scene.img} alt={`${scene.title}示例图`} />
        </figure>
        <article>
          <span>论文 Figure {active < 2 ? '3' : '4'}</span>
          <h3>{scene.title}</h3>
          <p>{scene.desc}</p>
        </article>
      </div>
    </div>
  );
}

export function PromptAgentCanvas() {
  const steps = ['主体', '属性', '场景', '空间关系', '精炼提示'];
  const ref = useCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const active = Math.floor((t * 0.9) % steps.length);
    steps.forEach((step, i) => {
      const x = 36 + i * ((w - 72) / (steps.length - 1));
      const y = h * 0.46 + Math.sin(t * 2 + i) * 5;
      ctx.fillStyle = i <= active ? '#eaf0fa' : '#f8fafc';
      ctx.strokeStyle = i <= active ? '#2563eb' : '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 35, y - 20, 70, 40, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = i <= active ? '#2563eb' : '#64748b';
      ctx.font = '700 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(step, x, y + 4);
      if (i < steps.length - 1) {
        ctx.strokeStyle = '#93c5fd';
        ctx.beginPath();
        ctx.moveTo(x + 38, y);
        ctx.lineTo(x + (w - 72) / (steps.length - 1) - 38, y);
        ctx.stroke();
      }
    });
  });
  return <canvas ref={ref} className="s-final-canvas" role="img" aria-label="Prompt Agent 思考链动画" />;
}

export function InsightCanvas() {
  return (
    <div className="s-final-insight">
      <strong>统一 Token 空间</strong>
      <span>+</span>
      <strong>原生像素建模</strong>
      <span>+</span>
      <strong>上下文推理</strong>
      <p>让 Transformer 像理解语言一样理解图像生成。</p>
    </div>
  );
}

export function KeywordFormula() {
  const terms = [
    ['Native Unification', '原生统一：所有信息进入同一个共享 Token 空间。'],
    ['In-Context Reasoning', '上下文推理：把多任务统一成视觉上下文推理。'],
    ['Scaling Law', '缩放定律：统一 Transformer 可以继续扩展并提升能力。'],
  ];
  const [active, setActive] = useState(0);
  return (
    <div className="s-final-keywords">
      <p>点击关键词查看含义</p>
      <div>
        {terms.map(([term], index) => (
          <button key={term} className={active === index ? 'is-active' : ''} onClick={() => setActive(index)}>{term}</button>
        ))}
      </div>
      <article>{terms[active][1]}</article>
    </div>
  );
}

export function FinalCanvasFrame({ children }: { children: ReactNode }) {
  return <div className="s-final-canvas-frame">{children}</div>;
}
