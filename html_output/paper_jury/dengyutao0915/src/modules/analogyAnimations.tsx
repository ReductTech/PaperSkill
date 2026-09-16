import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  统一生活主题：法庭审判 —— analogy 自动动画（560x140）
//  每个场景：one subject + one verb + one goal；单一运动主体；≤2 静态道具。
//  调色板遵循 contract.md §5（红=失败，绿=成功，蓝=指引，橙=强调，紫=辅助）。
// ============================================================================

const AW = 560;
const AH = 140;

// 共享场景基元
const BG = '#f5f8f0';
const ENV_L = '#b8c9a7';
const ENV_D = '#76906a';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const TEXT = '#21324a';
const MUTED = '#68778f';

function drawDesk(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = ENV_L;
  ctx.fillRect(0, h - 14, w, 14);
  ctx.fillStyle = ENV_D;
  ctx.fillRect(0, h - 14, w, 3);
}

function drawPaper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rot = 0) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = MUTED;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 8, -h / 2 + 12 + i * 10);
    ctx.lineTo(w / 2 - 8, -h / 2 + 12 + i * 10);
    ctx.stroke();
  }
  ctx.restore();
}

function useAnalogyCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  render: (ctx: CanvasRenderingContext2D, t: number) => void,
  duration = 3.0
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, AW, AH);
    } catch {
      return;
    }
    let raf: number | null = null;
    let startT = 0;
    const tick = (now: number) => {
      if (!startT) startT = now;
      const t = ((now - startT) / 1000) % duration;
      render(ctx, t / duration);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);
}

/** ana1：放大镜扫描起诉书，发现矛盾红标（主体=放大镜，动作=扫描，目标=发现矛盾） */
export const Ana1CourtFile: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useAnalogyCanvas(ref, (ctx, t) => {
    drawDesk(ctx, AW, AH);
    drawPaper(ctx, 190, 30, 220, 80, 0);
    // 矛盾红标
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(270, 52, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(330, 72, 4, 0, Math.PI * 2);
    ctx.fill();
    // 放大镜从左向右扫描
    const mx = lerp(40, AW - 40, t);
    const my = 70 + Math.sin(t * Math.PI * 2) * 6;
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx + 14, my + 14);
    ctx.lineTo(mx + 30, my + 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mx, my, 16, 0, Math.PI * 2);
    ctx.strokeStyle = TEXT;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(196,63,82,0.18)';
    ctx.beginPath();
    ctx.arc(mx, my, 14, 0, Math.PI * 2);
    ctx.fill();
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={AW} height={AH} />;
};

/** ana2：天平摆动，三砝码难平衡（主体=天平横梁，动作=摆动，目标=平衡但失衡） */
export const Ana2Scales: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useAnalogyCanvas(ref, (ctx, t) => {
    drawDesk(ctx, AW, AH);
    const cx = AW / 2;
    const cy = 46;
    const pivot = 16;
    const swing = Math.sin(t * Math.PI * 2) * 0.28;
    // 支架
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy + pivot);
    ctx.lineTo(cx, cy + pivot + 34);
    ctx.stroke();
    ctx.fillStyle = ENV_D;
    ctx.fillRect(cx - 20, cy + pivot + 32, 40, 5);
    // 横梁
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(swing);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-90, 0);
    ctx.lineTo(90, 0);
    ctx.stroke();
    // 吊绳与砝码
    ctx.strokeStyle = MUTED;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-70, 0);
    ctx.lineTo(-70, 18);
    ctx.moveTo(70, 0);
    ctx.lineTo(70, 18);
    ctx.stroke();
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(-70, 26, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.arc(70, 26, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(0, 30, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={AW} height={AH} />;
};

/** ana3：法官握法槌，陪审席书页翻动（主体=法槌，动作=敲击，目标=宣读裁决） */
export const Ana3Gavel: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useAnalogyCanvas(ref, (ctx, t) => {
    drawDesk(ctx, AW, AH);
    // 高台
    ctx.fillStyle = ENV_D;
    ctx.fillRect(30, 20, 150, 24);
    ctx.fillStyle = ENV_L;
    ctx.fillRect(30, 44, 150, 70);
    // 法官（简笔）：黑袍坐于高台
    ctx.fillStyle = '#27446e';
    ctx.beginPath();
    ctx.arc(78, 46, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(68, 54, 20, 34);
    // 法槌敲击（上下动）
    const gy = 30 + (t < 0.5 ? (t < 0.25 ? t * 4 : (0.5 - t) * 4) : 0) * 4;
    ctx.save();
    ctx.translate(105, gy);
    ctx.rotate(0.1);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-3, 0, 6, 22);
    ctx.fillRect(-12, 22, 24, 8);
    ctx.restore();
    // 陪审席书本翻页
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 1.5;
    ctx.fillRect(300, 50, 200, 60);
    ctx.strokeRect(300, 50, 200, 60);
    const page = Math.floor(t * 4);
    ctx.fillStyle = MUTED;
    for (let i = 0; i < 3; i++) {
      const y = 64 + i * 13;
      ctx.fillRect(312 + (i === page ? 0 : 0), y, 60 + (i === page ? 18 : 0), 2);
    }
    // 翻页手
    const hx = 300 + 150 + Math.sin(t * Math.PI * 2) * 30;
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(hx, 80, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={AW} height={AH} />;
};

/** ana4：散页压平装订成册（主体=压杆，动作=下压，目标=成册） */
export const Ana4Bind: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useAnalogyCanvas(ref, (ctx, t) => {
    drawDesk(ctx, AW, AH);
    // 左侧散页
    for (let i = 0; i < 3; i++) {
      drawPaper(ctx, 40 + i * 14, 34 - i * 6, 90, 62, 0.04 * (i - 1));
    }
    // 右侧成册卷宗
    drawPaper(ctx, 300, 30, 130, 76, 0);
    ctx.fillStyle = ENV_D;
    ctx.fillRect(300 - 8, 30, 10, 76);
    // 压杆下压（上下来回）
    const y = 26 + (t < 0.5 ? t * 2 : (1 - t) * 2) * 8;
    ctx.fillStyle = '#92400e';
    ctx.fillRect(170, y, 34, 6);
    ctx.fillStyle = TEXT;
    ctx.fillRect(183, y - 12, 8, 12);
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={AW} height={AH} />;
};

/** ana5：三位审稿人同读卷宗，翻页同步（主体=翻页手，动作=翻页，目标=覆盖全文） */
export const Ana5Readers: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useAnalogyCanvas(ref, (ctx, t) => {
    drawDesk(ctx, AW, AH);
    const cols = [60, 240, 420];
    cols.forEach((x, i) => {
      drawPaper(ctx, x, 36, 120, 72, 0);
      const page = Math.floor(t * 3 + i);
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 44 + (page % 3) * 4, 50 + i * 8);
      ctx.lineTo(x + 44, 50 + i * 8);
      ctx.stroke();
      // 眼镜（阅读者）
      ctx.strokeStyle = TEXT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 10, 26, 8, 0, Math.PI * 2);
      ctx.arc(x + 34, 26, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 18, 26);
      ctx.lineTo(x + 26, 26);
      ctx.stroke();
    });
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={AW} height={AH} />;
};

/** ana6：法警将卷宗放入两个通道之一（主体=卷宗，动作=放置，目标=分流） */
export const Ana6Route: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useAnalogyCanvas(ref, (ctx, t) => {
    drawDesk(ctx, AW, AH);
    // 两个通道：快速（蓝）与审判（橙）
    ctx.fillStyle = BLUE;
    ctx.fillRect(330, 60, 80, 60);
    ctx.fillStyle = ORANGE;
    ctx.fillRect(440, 60, 80, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px sans-serif';
    ctx.fillText('快速', 356, 95);
    ctx.fillText('审判', 466, 95);
    // 法警手臂（简）
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(60, 30);
    ctx.lineTo(170 + Math.sin(t * Math.PI * 2) * 20, 60 + (t < 0.5 ? t * 60 : (1 - t) * 60));
    ctx.stroke();
    // 卷宗（主体）在两个篮子间移动
    const target = t < 0.5 ? 360 : 470;
    const x = lerp(150, target, t < 0.5 ? t * 2 : (t - 0.5) * 2);
    drawPaper(ctx, x, 40 + Math.abs(Math.sin(t * Math.PI)) * 4, 46, 34, 0.05);
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={AW} height={AH} />;
};

/** ana7：陪审员举牌投票，票数累积（主体=手牌，动作=举起，目标=形成多数） */
export const Ana7Vote: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useAnalogyCanvas(ref, (ctx, t) => {
    drawDesk(ctx, AW, AH);
    // 五席陪审员
    const seats = [80, 160, 240, 320, 400];
    seats.forEach((x, i) => {
      ctx.fillStyle = BLUE;
      ctx.beginPath();
      ctx.arc(x, 92, 10, 0, Math.PI * 2);
      ctx.fill();
      // 举牌（绿=成立，灰=弃权），随时间逐席举起
      const raised = t > (i + 1) * 0.16;
      const green = i % 2 === 0 || i === 4;
      ctx.fillStyle = raised ? (green ? GREEN : RED) : '#c9d3dd';
      ctx.fillRect(x - 7, raised ? 52 : 70, 14, 18);
      ctx.strokeStyle = TEXT;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 7, raised ? 52 : 70, 14, 18);
    });
    // 票数条
    const votes = Math.min(1, t * 1.4);
    ctx.fillStyle = GREEN;
    ctx.fillRect(470, 80 - votes * 34, 10, votes * 34);
    ctx.fillStyle = MUTED;
    ctx.font = '13px sans-serif';
    ctx.fillText('多数', 452, 118);
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={AW} height={AH} />;
};

/** ana8：包裹通过安检门，绿灯放行/红灯拦截（主体=包裹，动作=穿过，目标=安全通过） */
export const Ana8Guard: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useAnalogyCanvas(ref, (ctx, t) => {
    drawDesk(ctx, AW, AH);
    // 安检门
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(250, 20);
    ctx.lineTo(250, 110);
    ctx.moveTo(310, 20);
    ctx.lineTo(310, 110);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(250, 20);
    ctx.lineTo(310, 20);
    ctx.stroke();
    // 包裹穿过
    const x = (t * 2) % 1;
    const px = lerp(120, 440, x);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = TEXT;
    ctx.lineWidth = 2;
    ctx.fillRect(px - 16, 66, 32, 26);
    ctx.strokeRect(px - 16, 66, 32, 26);
    // 扫描结果：绿=放行，红=拦截（前 40% 安全通过）
    const safe = x > 0.3 && x < 0.7;
    ctx.fillStyle = safe ? GREEN : RED;
    ctx.beginPath();
    ctx.arc(280, 36, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={AW} height={AH} />;
};

/** ana9：法官敲槌宣布休庭，卷宗合上（主体=法槌，动作=落下，目标=休庭） */
export const Ana9Adjourn: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useAnalogyCanvas(ref, (ctx, t) => {
    drawDesk(ctx, AW, AH);
    // 卷宗合上（两半相向）
    const close = t < 0.6 ? t / 0.6 : 1;
    ctx.save();
    ctx.translate(300, 76);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-60 * close, -34, 60 * close, 68);
    ctx.strokeRect(-60 * close, -34, 60 * close, 68);
    ctx.fillRect(0, -34, 60 * close, 68);
    ctx.strokeRect(0, -34, 60 * close, 68);
    ctx.restore();
    // 法槌敲击（在第 2/3 阶段落下）
    const hit = t > 0.6 ? (t - 0.6) / 0.4 : 0;
    const gy = 20 + (1 - hit) * 34;
    ctx.save();
    ctx.translate(110, gy);
    ctx.rotate(0.08);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-3, 0, 6, 22);
    ctx.fillRect(-12, 22, 24, 8);
    ctx.restore();
    if (hit > 0.95) {
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(110, gy, 20 * (1 - (hit - 0.95) * 20), 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={AW} height={AH} />;
};

/** ana10：记分牌竞速（主体=分数条，动作=增长，目标=领先） */
export const Ana10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useAnalogyCanvas(ref, (ctx, t) => {
    drawDesk(ctx, AW, AH);
    const values = [0.446, 0.519, 0.459, 0.656, 0.44]; // 与 ch10 竞速一致
    const colors = [MUTED, BLUE, ORANGE, GREEN, '#c9d3dd'];
    const names = ['Critic', 'Judge', 'Naive', 'PaperJury', 'Fwd'];
    const baseX = 70;
    const barW = 60;
    const maxH = 60;
    names.forEach((n, i) => {
      const grow = Math.min(1, Math.max(0, (t * 1.6 - i * 0.06)));
      const h = values[i] * maxH * grow;
      const x = baseX + i * 100;
      ctx.fillStyle = colors[i];
      ctx.fillRect(x, 100 - h, barW, h);
      ctx.fillStyle = TEXT;
      ctx.font = '12px sans-serif';
      ctx.fillText(n, x, 120);
      if (i === 3 && grow >= 1) {
        ctx.font = '16px sans-serif';
        ctx.fillText('🏆', x + 20, 96 - h);
      }
    });
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={AW} height={AH} />;
};
