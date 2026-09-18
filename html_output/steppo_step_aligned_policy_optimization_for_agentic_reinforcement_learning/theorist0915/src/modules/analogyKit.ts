/** Shared helpers for differentiated road-trip analogy scenes. */
import { C, clearScene, drawCar, drawFlag, drawLabel, drawRoad } from './roadKit';

export type AnalogyScene =
  | 'jitter'
  | 'ledger'
  | 'turn'
  | 'stations'
  | 'scorecard'
  | 'hops'
  | 'trailer'
  | 'dispatch'
  | 'fairrace'
  | 'finishboard';

export function drawAnalogyScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  u: number,
  scene: AnalogyScene,
) {
  clearScene(ctx, w, h);
  if (scene === 'jitter') {
    drawRoad(ctx, 90, w);
    drawFlag(ctx, w - 48, 78);
    const x = 40 + u * (w - 140);
    const y = 82 + Math.sin(u * Math.PI * 14) * 12;
    drawCar(ctx, x, y, C.red);
    drawLabel(ctx, 'token 微调', 16, 28, C.red);
    return;
  }
  if (scene === 'ledger') {
    // Trip ledger pages
    for (let i = 0; i < 3; i++) {
      const x = 40 + i * 160;
      const on = Math.floor(u * 3) % 3 === i;
      ctx.fillStyle = on ? '#fff' : '#eef3e8';
      ctx.strokeStyle = on ? C.blue : C.axis;
      ctx.lineWidth = on ? 3 : 1;
      ctx.fillRect(x, 28, 140, 90);
      ctx.strokeRect(x, 28, 140, 90);
      drawLabel(ctx, `第${i + 1}站`, x + 40, 55, on ? C.blue : C.muted);
      drawLabel(ctx, on ? 's / a / r' : '……', x + 36, 85, C.muted);
    }
    drawLabel(ctx, '按站记账', 16, 140, C.blue);
    return;
  }
  if (scene === 'turn') {
    drawRoad(ctx, 100, w);
    const complete = u > 0.55;
    ctx.strokeStyle = complete ? C.green : C.red;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(160, 100, 48, -Math.PI * 0.2, complete ? Math.PI * 0.9 : Math.PI * (0.2 + u));
    ctx.stroke();
    drawCar(ctx, complete ? 280 : 160 + Math.cos(u) * 20, complete ? 90 : 70, complete ? C.green : C.orange);
    drawFlag(ctx, w - 50, 88);
    drawLabel(ctx, complete ? '完整转向 → 换地图' : '未完成：地图不换', 16, 28, complete ? C.green : C.red);
    return;
  }
  if (scene === 'stations') {
    drawRoad(ctx, 95, w);
    const n = 4;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((w - 120) / (n - 1));
      ctx.fillStyle = i / (n - 1) <= u ? C.green : C.axis;
      ctx.beginPath();
      ctx.arc(x, 95, 10, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, `站${i + 1}`, x - 12, 70, C.muted);
    }
    drawCar(ctx, 70 + u * (w - 140), 87, C.blue);
    drawLabel(ctx, '终点分沿站回传', 16, 28, C.blue);
    return;
  }
  if (scene === 'scorecard') {
    const modes = [
      { title: 'token', vals: [0.1, 0.12, 0.11, 0.9], color: C.red },
      { title: '轨迹', vals: [0.5, 0.5, 0.5, 0.5], color: C.orange },
      { title: '步级', vals: [0.2, 0.85, -0.1, 0.55], color: C.green },
    ];
    const m = modes[Math.floor(u * 3) % 3];
    drawLabel(ctx, `评分卡：${m.title}`, 16, 28, m.color);
    m.vals.forEach((v, i) => {
      const x = 60 + i * 120;
      const hgt = Math.abs(v) * 70;
      ctx.fillStyle = v >= 0 ? m.color : C.red;
      ctx.fillRect(x, v >= 0 ? 110 - hgt : 110, 36, hgt);
      drawLabel(ctx, `转向${i + 1}`, x - 4, 130, C.muted);
    });
    ctx.strokeStyle = C.axis;
    ctx.beginPath();
    ctx.moveTo(40, 110);
    ctx.lineTo(w - 30, 110);
    ctx.stroke();
    return;
  }
  if (scene === 'hops') {
    const labels = ['问', '检索', '再问', '答'];
    const idx = Math.min(labels.length - 1, Math.floor(u * labels.length));
    for (let i = 0; i < labels.length; i++) {
      const x = 50 + i * 120;
      const on = i === idx;
      ctx.fillStyle = on ? C.blue : '#fff';
      ctx.strokeStyle = on ? C.blue : C.axis;
      ctx.lineWidth = on ? 3 : 1;
      ctx.beginPath();
      ctx.roundRect(x, 45, 90, 50, 8);
      ctx.fill();
      ctx.stroke();
      drawLabel(ctx, labels[i], x + 30, 75, on ? '#fff' : C.text);
      if (i < labels.length - 1) {
        ctx.strokeStyle = i < idx ? C.green : C.axis;
        ctx.beginPath();
        ctx.moveTo(x + 90, 70);
        ctx.lineTo(x + 120, 70);
        ctx.stroke();
      }
    }
    drawLabel(ctx, '多跳工具交互', 16, 28, C.blue);
    return;
  }
  if (scene === 'trailer') {
    drawRoad(ctx, 100, w);
    const L = 2 + Math.floor(u * 8);
    ctx.fillStyle = C.blue;
    ctx.fillRect(90, 78, 30 + L * 22, 28);
    drawCar(ctx, 80, 92, C.blue);
    drawLabel(ctx, `车节×${L}，评分看整段`, 16, 28, C.blue);
    drawFlag(ctx, w - 48, 88);
    return;
  }
  if (scene === 'dispatch') {
    const nodes = ['记录', '评分', '更新', '调度'];
    nodes.forEach((n, i) => {
      const x = 40 + i * 125;
      const on = Math.floor(u * 4) % 4 === i;
      ctx.fillStyle = on ? C.purple : '#fff';
      ctx.strokeStyle = on ? C.orange : C.axis;
      ctx.lineWidth = on ? 3 : 1;
      ctx.fillRect(x, 48, 100, 44);
      ctx.strokeRect(x, 48, 100, 44);
      drawLabel(ctx, n, x + 28, 75, on ? '#fff' : C.text);
      if (i < nodes.length - 1) {
        ctx.strokeStyle = C.axis;
        ctx.beginPath();
        ctx.moveTo(x + 100, 70);
        ctx.lineTo(x + 125, 70);
        ctx.stroke();
      }
    });
    drawLabel(ctx, '旅行系统分层', 16, 28, C.purple);
    return;
  }
  if (scene === 'fairrace') {
    drawRoad(ctx, 70, w);
    drawRoad(ctx, 115, w);
    drawCar(ctx, 60 + u * (w - 160), 62, C.red);
    drawCar(ctx, 60 + u * (w - 160), 107, C.green);
    drawLabel(ctx, '同车同图 · 只换计分', 16, 28, C.text);
    drawLabel(ctx, 'PPO', 16, 75, C.red);
    drawLabel(ctx, 'StepPO', 16, 120, C.green);
    return;
  }
  // finishboard
  drawLabel(ctx, '终点成绩单（约值）', 16, 28, C.text);
  [
    { name: 'PPO', v: 0.57, c: C.red },
    { name: 'StepPO', v: 0.64, c: C.green },
  ].forEach((r, i) => {
    const y = 55 + i * 40;
    ctx.fillStyle = C.axis;
    ctx.fillRect(40, y, 420, 16);
    ctx.fillStyle = r.c;
    ctx.fillRect(40, y, r.v * 420, 16);
    drawLabel(ctx, `${r.name} ≈ ${r.v}`, 470, y + 13, r.c);
  });
}
