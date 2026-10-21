// 每章顶部的教室类比动画：一个主体、一个动作、一个目标，560 x 140。
import React from 'react';
import {
  C,
  useScene,
  drawRoom,
  drawBoard,
  drawDesk,
  drawChair,
  drawDoor,
  drawStudent,
  drawTeacher,
  rr,
  line,
  dot,
  ring,
  hl,
  loopT,
  smooth,
  clamp,
  lerp,
  easeInOutQuad,
} from './scene';

const W = 560;
const H = 140;
const FLOOR = 118;

/** 一排老同学的座位（静态支撑道具）。 */
function seatedRow(
  ctx: CanvasRenderingContext2D,
  xs: number[],
  baseY: number,
  s = 16,
  color: string = C.old
) {
  xs.forEach((x) => {
    drawStudent(ctx, x, baseY, s, color);
    drawDesk(ctx, x - s * 0.75, baseY - s * 0.45, s * 1.5, s * 0.62);
  });
}

// 1. 新同学背着书包走进来，坐到最后一排的空位
export function Ana1() {
  const ref = useScene(W, H, (ctx, t) => {
    drawRoom(ctx, W, H);
    drawBoard(ctx, 34, 10, 250, 50);
    seatedRow(ctx, [104, 168, 232, 296], FLOOR, 17);
    drawChair(ctx, 452, FLOOR, 30); // 目标：空位
    drawDoor(ctx, 524, FLOOR, 62);
    drawTeacher(ctx, 370, FLOOR, 18, { arm: 0.9, facing: 1 });

    const p = loopT(t, 4.4);
    const walk = smooth(clamp((p - 0.08) / 0.58, 0, 1));
    const x = lerp(516, 452, walk);
    drawStudent(ctx, x, FLOOR, 17, C.novice, { bag: true, mood: walk > 0.9 ? 1 : 0 });
    if (walk > 0.6) ring(ctx, 452, FLOOR - 16, 16, C.orange, t);
  });
  return <canvas ref={ref} />;
}

// 2. 粉笔在黑板上一圈，圈出一堆相似的特点
export function Ana2() {
  const ref = useScene(W, H, (ctx, t) => {
    drawRoom(ctx, W, H);
    drawBoard(ctx, 60, 10, 440, 110);
    const pts: [number, number][] = [
      [180, 52], [204, 44], [216, 66], [188, 76], [164, 66],
      [330, 58], [356, 50], [372, 72], [338, 80],
    ];
    pts.forEach(([x, y], i) => dot(ctx, x, y, 4, i < 5 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)'));

    const p = loopT(t, 3.8);
    const draw = smooth(clamp((p - 0.15) / 0.6, 0, 1));
    const a0 = -0.5;
    const a1 = a0 + Math.PI * 2 * draw;
    ctx.save();
    ctx.strokeStyle = '#f7f2e6';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(190, 60, 44, 34, 0, a0, a1);
    ctx.stroke();
    ctx.restore();
    // 粉笔头跟着笔画走
    const cx = 190 + Math.cos(a1) * 44;
    const cy = 60 + Math.sin(a1) * 34;
    if (draw > 0 && draw < 1) {
      rr(ctx, cx - 2, cy - 6, 6, 12, 2);
      ctx.fillStyle = '#fdf9ef';
      ctx.fill();
    }
  });
  return <canvas ref={ref} />;
}

// 3. 老师把一把椅子搬到后排，教室后面多出一排座位
export function Ana3() {
  const ref = useScene(W, H, (ctx, t) => {
    drawRoom(ctx, W, H);
    drawBoard(ctx, 30, 12, 140, 40);
    seatedRow(ctx, [140, 192, 244], 84, 14);
    seatedRow(ctx, [140, 192, 244], FLOOR, 14);

    const p = loopT(t, 4.6);
    const move = smooth(clamp((p - 0.05) / 0.5, 0, 1));
    const tx = lerp(320, 400, move);
    const ty = lerp(84, FLOOR, smooth(clamp((p - 0.3) / 0.35, 0, 1)));
    drawDesk(ctx, 388, FLOOR - 8, 34, 20); // 新座位：目标
    if (move > 0.55) ring(ctx, 405, FLOOR - 10, 15, C.green, t);
    // 老师抱着椅子走
    drawTeacher(ctx, tx, ty, 17, { arm: -0.6, hold: 'none' });
    drawChair(ctx, tx + 26, ty - 6, 24, C.wood);
  });
  return <canvas ref={ref} />;
}

// 4. 老师把第三本账叠到另外两本上，三本账变成一摞
export function Ana4() {
  const ref = useScene(W, H, (ctx, t) => {
    drawRoom(ctx, W, H);
    // 讲台
    rr(ctx, 232, 96, 176, 22, 4);
    ctx.fillStyle = C.desk;
    ctx.fill();
    ctx.strokeStyle = C.wood; 
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 已有两本（静态）
    [0, 1].forEach((i) => {
      rr(ctx, 292, 90 - i * 11, 56, 10, 2);
      ctx.fillStyle = i ? '#e8d9c2' : '#dccbb0';
      ctx.fill();
      ctx.strokeStyle = C.woodDark;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    drawTeacher(ctx, 420, FLOOR, 18, { arm: -1.15, hold: 'none' });

    const p = loopT(t, 3.6);
    const lift = smooth(clamp((p - 0.1) / 0.45, 0, 1));
    const bx = lerp(190, 292, lift);
    const by = lerp(104, 68, lift);
    rr(ctx, bx, by, 56, 10, 2);
    ctx.fillStyle = C.noviceChip;
    ctx.fill();
    ctx.strokeStyle = C.novice;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // 手
    dot(ctx, bx + 48, by + 5, 3.6, C.skin);
    if (lift > 0.92) hl(ctx, 288, 58, 64, 36, C.green, 8);
  });
  return <canvas ref={ref} />;
}

// 5. 老师沿着过道走，给三个老同学贴上"样板"牌子
export function Ana5() {
  const ref = useScene(W, H, (ctx, t) => {
    drawRoom(ctx, W, H);
    drawBoard(ctx, 26, 12, 120, 36);
    const xs = [120, 192, 264, 336, 408];
    xs.forEach((x) => {
      drawStudent(ctx, x, FLOOR, 16, C.old);
      drawDesk(ctx, x - 12, FLOOR - 7, 24, 10);
    });
    const p = loopT(t, 5.0);
    const walk = smooth(clamp((p - 0.05) / 0.72, 0, 1));
    const tx = lerp(70, 420, walk);
    drawTeacher(ctx, tx, FLOOR, 18, { arm: 0.2, hold: 'card', facing: 1 });
    // 走过的同学被贴上牌子
    [0, 2, 4].forEach((i) => {
      const markAt = (xs[i] - 70) / 350;
      if (walk > markAt) {
        const x = xs[i];
        rr(ctx, x - 10, FLOOR - 52, 20, 13, 3);
        ctx.fillStyle = C.noviceChip;
        ctx.fill();
        ctx.strokeStyle = C.novice;
        ctx.lineWidth = 1.3;
        ctx.stroke();
        line(ctx, x, FLOOR - 39, x, FLOOR - 33, C.novice, 1.3);
      }
    });
  });
  return <canvas ref={ref} />;
}

// 6. 新同学从门口走到其中一组旁边坐下
export function Ana6() {
  const ref = useScene(W, H, (ctx, t) => {
    drawRoom(ctx, W, H);
    drawBoard(ctx, 30, 12, 150, 40);
    seatedRow(ctx, [96, 148, 200], FLOOR, 16);
    seatedRow(ctx, [380, 432, 484], FLOOR, 16);
    drawTeacher(ctx, 290, FLOOR, 18, { arm: 0.55, facing: 1 });
    drawDoor(ctx, 8, FLOOR, 58);

    const p = loopT(t, 4.2);
    const walk = smooth(clamp((p - 0.1) / 0.6, 0, 1));
    const x = lerp(40, 340, walk);
    drawStudent(ctx, x, FLOOR, 17, C.novice, { bag: true });
    if (walk > 0.9) ring(ctx, 340, FLOOR - 18, 17, C.green, t);
  });
  return <canvas ref={ref} />;
}

// 7. 老师在墙上挂上"第二学期"的牌子，学期一块块往上加
export function Ana7() {
  const ref = useScene(W, H, (ctx, t) => {
    drawRoom(ctx, W, H);

    // 墙上的软木板
    rr(ctx, 158, 24, 196, 78, 6);
    ctx.fillStyle = 'rgba(169, 143, 107, 0.16)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(122, 97, 66, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    const plaque = (x: number, y: number, ticks: number, active: boolean) => {
      rr(ctx, x, y, 34, 44, 4);
      ctx.fillStyle = active ? C.noviceChip : '#fdfaf3';
      ctx.fill();
      ctx.strokeStyle = active ? C.novice : C.wood;
      ctx.lineWidth = active ? 1.8 : 1.4;
      ctx.stroke();
      for (let i = 0; i < ticks; i++) {
        line(ctx, x + 8, y + 30 - i * 6, x + 26, y + 30 - i * 6, active ? C.novice : C.wood, 1.4);
      }
    };
    plaque(178, 42, 1, false);
    plaque(226, 42, 2, false);
    drawTeacher(ctx, 396, FLOOR, 20, { arm: -1.4, hold: 'none', facing: -1 });

    const p = loopT(t, 4.0);
    const lift = smooth(clamp((p - 0.08) / 0.5, 0, 1));
    const x = lerp(352, 274, lift);
    const y = lerp(74, 42, lift);
    plaque(x, y, 3, true);
    if (lift > 0.92) hl(ctx, 272, 40, 38, 48, C.green, 6);
  });
  return <canvas ref={ref} />;
}

// 8. 老师把一条窄桌板接到座位区侧面
export function Ana8() {
  const ref = useScene(W, H, (ctx, t) => {
    drawRoom(ctx, W, H);
    drawBoard(ctx, 24, 12, 120, 36);
    const rows = [64, 90, FLOOR];
    rows.forEach((y) => seatedRow(ctx, [140, 190, 240], y, 14));
    // 座位区边框
    ctx.save();
    ctx.strokeStyle = C.old;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([5, 4]);
    rr(ctx, 118, 44, 146, 84, 6);
    ctx.stroke();
    ctx.restore();

    const p = loopT(t, 4.2);
    const move = smooth(clamp((p - 0.1) / 0.45, 0, 1));
    const x = lerp(420, 268, move);
    rr(ctx, x, 44, 13, 84, 5);
    ctx.fillStyle = C.noviceChip;
    ctx.fill();
    ctx.strokeStyle = C.novice;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawTeacher(ctx, 402, FLOOR, 18, { arm: -0.9, hold: 'none', facing: -1 });
    if (move > 0.92) ring(ctx, 268, 86, 26, C.green, t);
  });
  return <canvas ref={ref} />;
}

// 9. 老师撤走两片座位之间的隔板，两片连成一片
export function Ana9() {
  const ref = useScene(W, H, (ctx, t) => {
    drawRoom(ctx, W, H);
    [70, 96, FLOOR].forEach((y) => {
      seatedRow(ctx, [90, 140], y, 14);
      seatedRow(ctx, [330, 380], y, 14);
    });
    const p = loopT(t, 4.2);
    const lift = smooth(clamp((p - 0.15) / 0.5, 0, 1));
    // 隔板：升起来被搬走
    ctx.save();
    ctx.globalAlpha = 1 - lift * 0.95;
    rr(ctx, 254, 36 - lift * 70, 12, 92, 4);
    ctx.fillStyle = '#d8c8ae';
    ctx.fill();
    ctx.strokeStyle = C.wood;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
    drawTeacher(ctx, lerp(400, 300, lift), FLOOR, 18, { arm: -1.3 - lift * 0.4, hold: 'none', facing: -1 });
    // 连通后的路径
    if (lift > 0.55) {
      ctx.save();
      ctx.globalAlpha = (lift - 0.55) / 0.45;
      line(ctx, 230, 86, 310, 86, C.green, 2, [6, 5]);
      ring(ctx, 270, 86, 24, C.green, t);
      ctx.restore();
    }
  });
  return <canvas ref={ref} />;
}

// 10. 三个班赛跑，本文方法先到终点
export function Ana10() {
  const ref = useScene(W, H, (ctx, t) => {
    drawRoom(ctx, W, H);
    const lanes = [70, 94, FLOOR];

    // 三条跑道
    lanes.forEach((y) => {
      rr(ctx, 40, y - 22, 446, 26, 5);
      ctx.fillStyle = 'rgba(169, 143, 107, 0.12)';
      ctx.fill();
      line(ctx, 40, y + 4, 486, y + 4, '#c9b593', 1.6);
    });
    // 起跑线与终点线
    line(ctx, 46, 44, 46, 126, C.muted, 1.6, [5, 4]);
    line(ctx, 486, 44, 486, 126, C.ink, 2);

    const p = loopT(t, 4.6);
    const run = clamp((p - 0.12) / 0.62, 0, 1);
    const d = [1, 0.93, 0.84]; // 第三道是本文，跑得最快
    const colors = [C.old, C.purple, C.green];
    lanes.forEach((y, i) => {
      const prog = smooth(clamp(run / d[i], 0, 1));
      drawStudent(ctx, lerp(62, 472, prog), y, 15, colors[i], { mood: 1 });
    });

    // 终点旗
    line(ctx, 486, 42, 486, 60, C.ink, 2);
    ctx.beginPath();
    ctx.moveTo(486, 42);
    ctx.lineTo(514, 47);
    ctx.lineTo(486, 54);
    ctx.closePath();
    ctx.fillStyle = C.support;
    ctx.fill();

    // 先到的那条（本文）挂个小奖杯
    if (run > 0.97) {
      const cx = 506;
      const cy = 22;
      ctx.save();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 7);
      ctx.lineTo(cx + 7, cy - 7);
      ctx.lineTo(cx + 4, cy + 2);
      ctx.lineTo(cx - 4, cy + 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(cx - 2, cy + 2, 4, 5);
      ctx.fillRect(cx - 6, cy + 7, 12, 3);
      ctx.restore();
    }
  });
  return <canvas ref={ref} />;
}

// ---------------------------------------------------------------- Hero 对比

const HW = 520;
const HH = 168;

// 传统方法：全班重排——座位互相挤、老同学被认错
export function HeroOld() {
  const ref = useScene(HW, HH, (ctx, t) => {
    drawRoom(ctx, HW, HH);
    const cols = [118, 198, 278, 358];
    const rows = [92, 148];
    rows.forEach((y, ri) => {
      cols.forEach((x, ci) => {
        const i = ri * 4 + ci;
        const k = 0.5 + 0.5 * Math.sin(t * 1.15 + i * 2.3 + (i % 3) * 1.1);
        const dx = Math.sin(t * 1.05 + i * 0.9) * 7 * k;
        const dy = Math.cos(t * 0.85 + i * 1.4) * 3.5 * k;
        const wrong = k > 0.62;
        drawStudent(ctx, x + dx, y + dy, 17, wrong ? C.red : C.old, {
          mood: wrong ? -1 : 0,
        });
        drawDesk(ctx, x + dx - 15, y + dy - 3, 30, 10, wrong ? '#e6c2c2' : C.deskTop);
        if (k > 0.86) {
          ctx.save();
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + dx - 7, y + dy - 36);
          ctx.lineTo(x + dx + 7, y + dy - 22);
          ctx.moveTo(x + dx + 7, y + dy - 36);
          ctx.lineTo(x + dx - 7, y + dy - 22);
          ctx.stroke();
          ctx.restore();
        }
      });
    });
    // 座次被打乱的示意
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.25 * Math.abs(Math.sin(t * 1.1));
    line(ctx, 84, 120, 400, 120, C.red, 1.6, [6, 5]);
    ctx.restore();
  });
  return <canvas ref={ref} />;
}

// 本文方法：老座位锁住不动，侧边挂一排新座位，两片连通
export function HeroNew() {
  const ref = useScene(HW, HH, (ctx, t) => {
    drawRoom(ctx, HW, HH);
    const oldCols = [104, 172, 240];
    const rows = [92, 148];
    rows.forEach((y) => {
      oldCols.forEach((x) => {
        drawStudent(ctx, x, y, 17, C.old);
        drawDesk(ctx, x - 15, y - 3, 30, 10);
      });
    });
    // 冻结框 + 锁
    ctx.save();
    ctx.strokeStyle = C.old;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([5, 4]);
    rr(ctx, 74, 56, 200, 112, 8);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = C.woodDark;
    rr(ctx, 258, 46, 13, 11, 2);
    ctx.fill();
    ctx.strokeStyle = C.woodDark;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(264, 46, 4.5, Math.PI, 0);
    ctx.stroke();

    // 新座位区（侧分支）
    const p = loopT(t, 4.8);
    const grow = smooth(clamp((p - 0.1) / 0.45, 0, 1));
    const newSeats: [number, number][] = [
      [420, 94],
      [420, 150],
    ];
    // 新座位区的范围
    if (grow > 0.5) {
      ctx.save();
      ctx.globalAlpha = (grow - 0.5) / 0.5;
      ctx.strokeStyle = C.novice;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      rr(ctx, 386, 68, 70, 116, 8);
      ctx.stroke();
      line(ctx, 276, 120, 386, 120, C.green, 2, [5, 4]);
      ctx.restore();
    }
    newSeats.forEach(([x, y], i) => {
      const k = smooth(clamp((grow - i * 0.14) / 0.6, 0, 1));
      ctx.save();
      ctx.globalAlpha = k;
      drawChair(ctx, x, y + 4, 30, C.novice);
      drawStudent(ctx, x, y + 2 - (1 - k) * 10, 15, C.green);
      ctx.restore();
    });
  });
  return <canvas ref={ref} />;
}

export { W as ANA_W, H as ANA_H };
