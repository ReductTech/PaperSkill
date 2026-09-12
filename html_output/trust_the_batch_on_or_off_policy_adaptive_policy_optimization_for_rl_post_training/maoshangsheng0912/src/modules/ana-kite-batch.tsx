import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 类比卡：放风筝（560x140）。全局统一主题，逐章换一个「简单动作」。
// 通过 chapterId prop 决定画哪一幕：
//   kap-1  风大 / 风小 —— 同一套手法应付不同风力
//   kap-2  线的长短 —— 手劲与收线量是两件事
//   kap-3  绷得最紧的那一段线 —— 裁剪切的是哪里
//   kap-4  五只风筝比高低 —— 组相对优势
//   kap-5  借别人的手法 —— 无偏但结果分散
// 其余章节沿用第 1 幕的基准场景，保持主题连续。
// 约束：一个主体 + 一个物理动词 + 一个可见目标；静态道具 ≤2；画布 560x140。
const W = 560;
const H = 140;

type Scene = 'wind' | 'length' | 'tension' | 'five' | 'borrowed' | 'base';

function sceneOf(chapterId: string): Scene {
  switch (chapterId) {
    case 'chap-1':
      return 'wind';
    case 'chap-2':
      return 'length';
    case 'chap-3':
      return 'tension';
    case 'chap-4':
      return 'five';
    case 'chap-5':
      return 'borrowed';
    default:
      return 'base';
  }
}

// —— 共享图元 ——
function drawSky(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#f7faf4');
  sky.addColorStop(1, '#eef2e8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
}

function drawGround(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(0, 118);
  ctx.lineTo(W, 118);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, s = 1) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(cx, cy, 13 * s, 0, Math.PI * 2);
  ctx.arc(cx + 16 * s, cy - 4 * s, 16 * s, 0, Math.PI * 2);
  ctx.arc(cx + 34 * s, cy + 1 * s, 12 * s, 0, Math.PI * 2);
  ctx.fill();
}

// 左下角落款：固定位置，避免与云或风筝元素相撞
function drawCaption(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = '#68778f';
  ctx.font = '500 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, 16, 132);
}

function drawPerson(ctx: CanvasRenderingContext2D, x: number, armAngle = 0) {
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, 118);
  ctx.lineTo(x, 100);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, 94, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#68778f';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, 104);
  ctx.lineTo(x + 14 * Math.cos(armAngle), 96 + 14 * Math.sin(armAngle));
  ctx.stroke();
}

function drawKite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rot: number,
  color: string,
  scale = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -22 * scale);
  ctx.lineTo(17 * scale, 0);
  ctx.lineTo(0, 24 * scale);
  ctx.lineTo(-17 * scale, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = color === '#27446e' ? '#1c3355' : 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -22 * scale);
  ctx.lineTo(0, 24 * scale);
  ctx.moveTo(-17 * scale, 0);
  ctx.lineTo(17 * scale, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawTail(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number, sway: number, scale = 1) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 8 + sway * 10, y + 18 * scale, x + 6, y + 30 * scale);
  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawString(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sag = 22,
  color = '#92400e',
  width = 1.8
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + sag, x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function AnaKiteBatch({ chapterId }: { chapterId: string; moduleId?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    let raf = 0;
    let running = false;
    const scene = sceneOf(chapterId);

    const render = () => {
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSky(ctx);
      drawCloud(ctx, 30, 30, 0.62);
      drawGround(ctx);

      const gust = Math.sin(t * 0.035) * 0.5 + Math.sin(t * 0.017) * 0.5;

      if (scene === 'wind') {
        // 第 1 幕：同一根线，风一大就失控。
        // 风用「风速线」表示强度，风筝随强度剧烈摇摆。
        const windLevel = 0.5 + Math.sin(t * 0.012) * 0.5; // 0.5 -> 1
        const amp = 8 + windLevel * 30; // 风力越大，摆幅越大
        const kx = 350 + Math.sin(t * 0.05) * amp * 0.6;
        const ky = 56 + Math.sin(t * 0.031) * amp * 0.34;
        const rot = Math.sin(t * 0.05) * (0.1 + windLevel * 0.42);

        drawPerson(ctx, 118, -0.1);
        drawString(ctx, 132, 96, kx, ky, 18 + windLevel * 14);
        drawKite(ctx, kx, ky, rot, '#27446e');
        drawTail(ctx, kx, ky + 24, rot, Math.sin(t * 0.06) * windLevel);

        // 风速线：三条，长度随风力增长，唯一标签标风力
        const wx = 470;
        for (let i = 0; i < 3; i++) {
          const y = 34 + i * 13;
          const len = 22 + windLevel * 40;
          ctx.beginPath();
          ctx.moveTo(wx, y);
          ctx.lineTo(wx + len, y);
          ctx.strokeStyle = '#b8c9a7';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(wx + len, y);
          ctx.lineTo(wx + len - 6, y - 3.5);
          ctx.lineTo(wx + len - 6, y + 3.5);
          ctx.closePath();
          ctx.fillStyle = '#b8c9a7';
          ctx.fill();
        }
        ctx.fillStyle = '#68778f';
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('风力', wx + 26, 88);
        ctx.fillStyle = '#21324a';
        ctx.font = '700 12px ui-monospace, monospace';
        ctx.fillText(windLevel > 0.82 ? '大' : windLevel > 0.6 ? '中' : '小', wx + 26, 104);

        drawCaption(ctx, '同一根线 · 风一大就失控');
      } else if (scene === 'length') {
        // 第 2 幕：手劲与收线量是两件事，且该由风力决定。
        // 两个端点：风筝飞得远（线长）与飞得近（线短），中间来回摆动。
        const reach = (Math.sin(t * 0.018) + 1) / 2; // 0..1
        const kx = 330 + reach * 150;
        const ky = 44 + reach * 22;

        drawPerson(ctx, 118, -0.16);
        drawString(ctx, 132, 96, kx, ky, 16);
        drawKite(ctx, kx, ky, Math.sin(t * 0.04) * 0.1, '#27446e');
        drawTail(ctx, kx, ky + 24, 0, Math.sin(t * 0.06));

        // 双标注：一个主体 + 一个动词，两个可见目标（线长刻度）
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(kx, ky + 6);
        ctx.lineTo(kx, 118);
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#92400e';
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`线长 ${(0.4 + reach * 0.6).toFixed(1)}`, kx, ky - 30);

        // 两个静态标注位（手劲 / 收线），各带一根短引线指向线上位置
        ctx.strokeStyle = '#b8c9a7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(300, 108);
        ctx.lineTo(300, 100);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(378, 108);
        ctx.lineTo(378, 100);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#68778f';
        ctx.font = '500 11px system-ui, sans-serif';
        ctx.fillText('手劲', 300, 96);
        ctx.fillText('收线', 378, 96);
        drawCaption(ctx, '手劲与收线 · 本来是两件事');
      } else if (scene === 'tension') {
        // 第 3 幕：裁剪切的是绷得最紧的那一段线。
        // 线被分成若干段，最靠外（最紧）的一段用红色标出并被「剪掉」。
        const kx = 430;
        const ky = 52;
        const x1 = 132;
        const y1 = 96;

        drawPerson(ctx, 118, -0.1);

        // 分段画线：越靠风筝端（ρ 越大）绷得越紧
        const SEGS = 9;
        const tension = (i: number) => i / (SEGS - 1); // 0 靠手 -> 1 靠风筝
        // 最紧的两段 = 被裁掉的（阈值位置固定在 0.76，保持稳定可读）
        const CUT_AT = 0.76;
        const at = (a: number) => ({
          x: x1 + (kx - x1) * a,
          y: y1 + (ky - y1) * a + Math.sin(a * Math.PI) * 16,
        });

        for (let i = 0; i < SEGS; i++) {
          const a = i / SEGS;
          const b = (i + 1) / SEGS;
          const tr = tension(i);
          const cut = tr > CUT_AT;
          const A = at(a);
          const B = at(b);
          if (cut) {
            // 被剪：留 20% 的缺口，两端各画一截，表示这段被丢弃
            const ga = a + (b - a) * 0.4;
            const gb = a + (b - a) * 0.6;
            const GA = at(ga);
            const GB = at(gb);
            ctx.beginPath();
            ctx.moveTo(A.x, A.y);
            ctx.lineTo(GA.x, GA.y);
            ctx.moveTo(GB.x, GB.y);
            ctx.lineTo(B.x, B.y);
            ctx.strokeStyle = '#c43f52';
            ctx.lineWidth = 2.4;
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(A.x, A.y);
            ctx.lineTo(B.x, B.y);
            ctx.strokeStyle = tr > 0.5 ? '#f07e47' : '#92400e';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          }
        }

        // 剪刀（静态道具，最多 2 个）
        const cutPos = x1 + (kx - x1) * 0.94;
        const cutPosY = y1 + (ky - y1) * 0.94 + Math.sin(0.94 * Math.PI) * 16;
        ctx.save();
        ctx.translate(cutPos, cutPosY);
        ctx.strokeStyle = '#68778f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-7, -8);
        ctx.lineTo(7, 8);
        ctx.moveTo(7, -8);
        ctx.lineTo(-7, 8);
        ctx.stroke();
        ctx.restore();

        drawKite(ctx, kx, ky, Math.sin(t * 0.04) * 0.08, '#27446e');
        drawTail(ctx, kx, ky + 24, 0, Math.sin(t * 0.06));

        // 唯一标签
        ctx.fillStyle = '#c43f52';
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('最紧的一段', cutPos, cutPosY - 20);

        drawCaption(ctx, '裁剪 · 切掉绷得最紧的那一段');
      } else if (scene === 'five') {
        // 第 4 幕：五只风筝比高低，看的是组内相对位置。
        const baseX = 232;
        const gap = 70;
        const heights = [26, 54, 38, 62, 32]; // 相对高度（越大越高）
        const meanH = heights.reduce((a, b) => a + b, 0) / heights.length;
        const meanY = 104 - meanH;

        // 组均值线
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(150, meanY);
        ctx.lineTo(548, meanY);
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
        // 均值标签放在线的右端，避开最左侧风筝的优势值
        ctx.fillStyle = '#27446e';
        ctx.font = '600 10px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('组均值', 546, meanY - 6);

        heights.forEach((h, i) => {
          const x = baseX + i * gap;
          const y = 104 - h;
          const above = h > meanH;
          // 线连到手
          ctx.beginPath();
          ctx.moveTo(132, 96);
          ctx.quadraticCurveTo(150 + (x - 150) * 0.55, y + 34, x, y);
          ctx.strokeStyle = 'rgba(146,64,14,0.5)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          drawKite(ctx, x, y, Math.sin(t * 0.04 + i) * 0.08, above ? '#228d5c' : '#c43f52', 0.82);

          // 优势值：放在风筝上方，并避开组均值线
          const adv = (h - meanH) / 12;
          const labelY = y - 28;
          ctx.fillStyle = above ? '#228d5c' : '#c43f52';
          ctx.font = '700 10px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${adv >= 0 ? '+' : ''}${adv.toFixed(1)}`, x, labelY);
        });

        drawPerson(ctx, 118, -0.1);

        drawCaption(ctx, '五只风筝 · 不看绝对高度，看比同伴高多少');
      } else if (scene === 'borrowed') {
        // 第 5 幕：借来的手法——平均来看没错（落点围绕同一个中心），
        // 但每一次的结果差得远（落点很散）。用「历史落点」把方差画出来。
        // 中心点 = 正确的目标高度（无偏），散布 = 方差。
        const cx = 322;
        const cy = 60;

        drawPerson(ctx, 112, -0.12);

        // 十个历史落点：固定伪随机，中心对称 => 均值不偏，但散度很大
        const LANDINGS = [
          [-58, -16], [52, -22], [-32, 18], [64, 12], [-14, -24],
          [26, 22], [-68, 6], [40, -8], [-6, 24], [56, 2],
        ];

        // 散布范围：一个虚线圆表示波动幅度（先画，压在落点下面）
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, 66, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(196,63,82,0.5)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();

        // 再画落点（红=偏离目标）
        LANDINGS.forEach(([dx, dy]) => {
          const px = cx + dx;
          const py = cy + dy;
          ctx.beginPath();
          ctx.arc(px, py, 3.4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(196,63,82,0.6)';
          ctx.fill();
        });

        // 中心点：所有落点的重心（=无偏目标）
        ctx.beginPath();
        ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#228d5c';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 当前这一次：从手飞向其中一个落点，逐次切换，体现「每次都不同」
        const pick = Math.floor(t / 90) % LANDINGS.length;
        const [lx, ly] = LANDINGS[pick];
        const tx = cx + lx;
        const ty = cy + ly;
        drawString(ctx, 132, 96, tx, ty, 20, 'rgba(146,64,14,0.75)');

        ctx.beginPath();
        ctx.arc(tx, ty, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#f07e47';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        drawKite(ctx, tx, ty, Math.sin(t * 0.05) * 0.12, '#27446e', 0.72);

        // 左侧说明块：两行小字，「平均落点很准」带绿点，「每一次落点都很散」带红点
        const boxX = 396;
        ctx.beginPath();
        ctx.arc(boxX, 48, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#228d5c';
        ctx.fill();
        ctx.fillStyle = '#228d5c';
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('平均落点很准', boxX + 11, 52);

        ctx.beginPath();
        ctx.arc(boxX, 70, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#c43f52';
        ctx.fill();
        ctx.fillStyle = '#c43f52';
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillText('每一次落点都很散', boxX + 11, 74);

        drawCaption(ctx, '借别人的手法放你的风筝');
      } else {
        // 基准幕：第 1 章之前的通用场景，保持主题连续。
        const kx = 330 + gust * 26;
        const ky = 52 + gust * 12;

        drawPerson(ctx, 118, -0.1);
        drawString(ctx, 132, 96, kx, ky, 22);
        drawKite(ctx, kx, ky, gust * 0.16, '#27446e');
        drawTail(ctx, kx, ky + 24, 0, gust * 10);

        ctx.fillStyle = '#27446e';
        ctx.font = '600 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('这一批数据', kx, ky - 30);

        drawCaption(ctx, '线松一点，它飞得高');
      }
    };

    const tick = () => {
      tRef.current += 1;
      render();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const unobserve = observeCanvas(canvas, start, stop);
    render();
    return () => {
      unobserve();
      stop();
    };
  }, [chapterId]);

  return <canvas ref={ref} id={`cv-ana-kite-${chapterId}`} width={W} height={H} />;
}
