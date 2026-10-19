import React, { useState } from 'react';
import { C, useScene, txt, line, rr, dot, bar, clamp, smooth } from './scene';

// 第4章：三本账一起算
// 拖 λ：记新同学 / 保老同学 / 平新旧 三本账的重量一起变，右侧两条曲线的交叉点就是需要权衡的位置。

const W = 1000;
const H = 300;
const GX = 560;
const GY = 56;
const GW = 390;
const GH = 180;

const ceOf = (l: number) => 62 - 0.45 * l;
const kdOf = (l: number) => 2.4 * l;
const protoOf = (_l: number) => 42; // γ = 10 固定
const oldKeep = (l: number) => 55 + 42 * (1 - Math.exp(-l / 6));
const newLearn = (l: number) => 97 - 26 * Math.pow(l / 30, 1.4);

export default function LambdaSlider() {
  const [lambda, setLambda] = useState(10);
  const [touched, setTouched] = useState(false);

  const ref = useScene(W, H, (ctx, t) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    const ce = ceOf(lambda);
    const kdv = kdOf(lambda);
    const pv = protoOf(lambda);
    const total = ce + kdv + pv;
    const maxV = 75;

    // 三条账
    const items = [
      { v: ce, c: C.blue, name: 'ce' },
      { v: kdv, c: C.green, name: 'kd' },
      { v: pv, c: C.purple, name: 'proto' },
    ];
    const baseY = 250;
    items.forEach((it, i) => {
      const x = 70 + i * 130;
      const h = (it.v / maxV) * 186;
      bar(ctx, x, baseY - h, 74, h, it.c, 6);
      ctx.save();
      ctx.globalAlpha = 0.18;
      bar(ctx, x, baseY - (maxV / maxV) * 170, 74, 0, it.c, 6);
      ctx.restore();
      txt(ctx, it.v.toFixed(0), x + 37, baseY - h - 10, 13, it.c, 'center', 700);
    });
    line(ctx, 50, baseY + 2, 470, baseY + 2, C.line, 1.4);
    txt(ctx, '总损失 ' + total.toFixed(0), 70, 46, 14, C.ink, 'left', 700);

    // 右侧两条曲线
    const yOf0 = (v: number) => GY + GH - ((v - 50) / 50) * GH;
    line(ctx, GX, GY + GH, GX + GW, GY + GH, C.line, 1.2);
    line(ctx, GX, GY, GX, GY + GH, C.line, 1.2);
    [50, 60, 70, 80, 90, 100].forEach((v) => {
      const y = yOf0(v);
      line(ctx, GX - 4, y, GX, y, C.line, 1.2);
      txt(ctx, String(v), GX - 10, y + 4, 10, C.muted, 'right', 500);
    });
    const xOf = (l: number) => GX + ((l - 1) / 29) * (GW - 8);
    const yOf = (v: number) => GY + GH - ((v - 50) / 50) * GH;

    const mk = (fn: (l: number) => number, color: string) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let l = 1; l <= 30; l += 0.5) {
        const x = xOf(l);
        const y = yOf(clamp(fn(l), 50, 100));
        if (l === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };
    mk(oldKeep, C.green);
    mk(newLearn, C.blue);

    // 论文设定 λ=10
    const px = xOf(10);
    line(ctx, px, GY, px, GY + GH, C.orange, 1.6, [5, 3]);
    dot(ctx, px, GY - 2, 4, C.orange);

    // 当前 λ
    const cx = xOf(lambda);
    line(ctx, cx, GY - 4, cx, GY + GH, C.ink, 1.2, [2, 3]);
    dot(ctx, cx, yOf(clamp(oldKeep(lambda), 50, 100)), 4.6, C.green);
    dot(ctx, cx, yOf(clamp(newLearn(lambda), 50, 100)), 4.6, C.blue);

    line(ctx, GX + 6, GY - 16, GX + 22, GY - 16, C.green, 2.4);
    txt(ctx, '旧类', GX + 28, GY - 12, 12, C.green, 'left', 700);
    line(ctx, GX + 76, GY - 16, GX + 92, GY - 16, C.blue, 2.4);
    txt(ctx, '新类', GX + 98, GY - 12, 12, C.blue, 'left', 700);
    txt(ctx, 'λ', GX + GW - 4, GY + GH + 18, 12, C.muted, 'right', 600);
    void t;
  });

  const ok = oldKeep(lambda);
  const nw = newLearn(lambda);
  const total = ceOf(lambda) + kdOf(lambda) + protoOf(lambda);
  const fb =
    lambda < 5
      ? {
          cls: 'bad',
          text: `λ=${lambda} 太轻：蒸馏这一本账几乎没重量，旧类保持率只有 ${ok.toFixed(0)}%。新同学一多，老座位就散了。`,
        }
      : lambda <= 18
      ? {
          cls: 'good',
          text: `λ=${lambda}：旧类保持 ${ok.toFixed(0)}%，新类学会 ${nw.toFixed(0)}%，两本账都还在九成上下。论文直接把 λ 定在 10，不再为每个数据集单独调。`,
        }
      : {
          cls: 'bad',
          text: `λ=${lambda} 太重：旧类几乎冻住了（${ok.toFixed(0)}%），但分类损失被挤没，新类只学会 ${nw.toFixed(0)}%——等于不给新同学留座位。`,
        };

  return (
    <div>
      <canvas ref={ref} />
      <div className="ctrl">
        <label>
          蒸馏权重 λ <span className="val">{lambda}</span>
        </label>
        <input
          type="range"
          min={1}
          max={30}
          step={1}
          value={lambda}
          onChange={(e) => {
            setLambda(Number(e.target.value));
            setTouched(true);
          }}
        />
        <button className="tiny ghost" onClick={() => setLambda(10)}>
          回到论文值
        </button>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">总损失 L</div>
          <div className="v">{total.toFixed(1)}</div>
        </div>
        <div className="metric">
          <div className="l">旧类保持率（示意）</div>
          <div className="v" style={{ color: ok > 70 ? C.green : C.red }}>{ok.toFixed(0)}%</div>
        </div>
        <div className="metric">
          <div className="l">新类学会率（示意）</div>
          <div className="v" style={{ color: nw > 80 ? C.green : nw > 70 ? C.orange : C.red }}>
            {nw.toFixed(0)}%
          </div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>
        {touched ? fb.text : '三条账：蓝=记新人（L_ce），绿=保旧人（λL_kd），紫=平新旧（γL_proto）。拖 λ 看总损失怎么变。'}
      </div>
    </div>
  );
}
