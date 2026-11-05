import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { BowingDancers, Chips, Feedback, useFrame, INK } from './danceKit';
import { forward, gaussian, makeMlp, makeRng, Mlp, Pt, sampleShape, Shape, trainStep } from './driftCore';

const SIZE = 620;
const MAX_ITER = 2400;
const SHAPES: { id: Shape; label: string }[] = [{ id: 'modes', label: '双团' }, { id: 'checker', label: '棋盘' }, { id: 'swiss', label: '瑞士卷' }];
const toCanvas = (p: Pt): Pt => [SIZE / 2 + p[0] * 255, SIZE / 2 - p[1] * 255];

export function AlgorithmMlp(_: WidgetProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [shape, setShape] = useState<Shape>('modes');
  const [running, setRunning] = useState(false);
  const [iter, setIter] = useState(0);
  const [loss, setLoss] = useState<number | null>(null);
  const [curve, setCurve] = useState<number[]>([]);
  const fixedNoise = useMemo(() => { const r = makeRng(81); return Array.from({ length: 320 }, () => [gaussian(r), gaussian(r)] as Pt); }, []);
  const net = useRef<Mlp>(makeMlp([2, 64, 64, 2], 3));
  const rand = useRef(makeRng(82));
  const data = useRef<Pt[]>(sampleShape('modes', 320, makeRng(83)));
  const count = useRef(0);

  const draw = () => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#f6efe2';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = INK.mark;
    data.current.forEach(p => { const [x, y] = toCanvas(p); ctx.fillRect(x - 2.5, y - 2.5, 5, 5); });
    ctx.fillStyle = INK.dancer;
    fixedNoise.forEach(e => { const [x, y] = toCanvas(forward(net.current, e)); ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); });
  };
  const start = (next: Shape) => {
    setShape(next);
    net.current = makeMlp([2, 64, 64, 2], 3);
    rand.current = makeRng(82);
    data.current = sampleShape(next, 320, makeRng(83));
    count.current = 0;
    setIter(0); setLoss(null); setCurve([]); setRunning(true);
    draw();
  };
  useEffect(() => { draw(); });
  useFrame(() => {
    let current = 0;
    for (let s = 0; s < 3 && count.current < MAX_ITER; s++) {
      const noise = Array.from({ length: 96 }, () => [gaussian(rand.current), gaussian(rand.current)] as Pt);
      const yPos = sampleShape(shape, 96, rand.current);
      current = trainStep(net.current, noise, yPos, 0.08, 2e-3).loss;
      count.current += 1;
    }
    setIter(count.current);
    setLoss(current);
    if (count.current % 30 === 0) setCurve(c => [...c, current]);
    if (count.current >= MAX_ITER) setRunning(false);
  }, running);

  const logs = curve.map(v => Math.log10(Math.max(v, 1e-5)));
  const hi = logs.length ? Math.max(...logs) : 0;
  const lo = logs.length ? Math.min(...logs) : -1;
  const line = logs.map((v, i) => `${(i / (MAX_ITER / 30)) * 560},${88 - ((v - lo) / Math.max(hi - lo, 1e-6)) * 80}`).join(' ');
  const done = iter >= MAX_ITER;
  return <div className="dk-split" style={{ gridTemplateColumns: '620px minmax(0,1fr)', columnGap: 28 }}>
    <div className="dk-stage" style={{ height: 620, width: 620, border: 0 }}>
      <canvas ref={canvas} width={SIZE} height={SIZE} style={{ display: "block", width: SIZE, height: SIZE, margin: 0 }} role="img" aria-label={`蓝色为目标数据，橙色为小网络一次前向生成的样本，当前第 ${iter} 步`} />
    </div>
    <div className="dk-panel">
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <Chips value={running || iter > 0 ? shape : ('' as Shape)} options={SHAPES} onChange={start} />
        <BowingDancers width={170} height={70} />
      </div>
      <pre className="dk-code">{`e = randn([N, C])
x = f(e)
y_neg = x
V = compute_V(x, y_pos, y_neg)
x_drifted = stopgrad(x + V)
loss = mse_loss(x - x_drifted)`}</pre>
      <div className="dk-row"><span>第 <b>{iter}</b> / {MAX_ITER} 步</span><span>L = <b className="dk-green">{loss === null ? '—' : loss.toExponential(1)}</b></span></div>
      <svg viewBox="0 0 560 92" width="100%" height="92" role="img" aria-label="损失曲线，纵轴对数">
        <line x1={0} x2={560} y1={90} y2={90} stroke={INK.axis} strokeWidth={3} />
        {logs.length > 1 && <polyline points={line} fill="none" stroke={INK.net} strokeWidth={5} strokeLinejoin="round" />}
      </svg>
      <Feedback tone={done ? 'good' : iter ? 'mid' : 'mid'}>{iter === 0
        ? '点一个目标：小 MLP 就在你的浏览器里按上面的算法开始训练。'
        : done ? '排练结束：橙点都由一次前向 f(ε) 得到，没有逐步求解。' : '每一步都重新算 V、冻结目标、更新网络，橙点随之漂移。'}</Feedback>
    </div>
  </div>;
}
