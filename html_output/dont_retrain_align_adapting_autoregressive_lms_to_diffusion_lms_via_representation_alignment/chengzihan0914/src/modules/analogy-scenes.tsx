import type { WidgetProps } from './registry';
import { C, clamp, lerp, useCanvas } from './visual-core';

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius = 10) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
}

function AnalogyScene({ scene }: { scene: number }) {
  const ref = useCanvas((ctx, time) => {
    const p = (time % 4) / 4;
    ctx.clearRect(0, 0, 560, 140);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, 560, 140);
    ctx.lineCap = 'round';

    if (scene === 1) {
      ctx.strokeStyle = C.light;
      ctx.lineWidth = 14;
      ctx.beginPath(); ctx.moveTo(38, 95); ctx.bezierCurveTo(180, 35, 350, 115, 522, 54); ctx.stroke();
      ctx.strokeStyle = C.road; ctx.lineWidth = 2; ctx.setLineDash([8, 10]); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(245, 72); ctx.lineTo(310, 25); ctx.stroke();
      dot(ctx, lerp(42, 500, p), 92 - Math.sin(p * Math.PI) * 28, C.blue);
      ctx.fillStyle = C.muted; ctx.font = '13px Segoe UI'; ctx.fillText('路线变了，地图不必重画', 28, 128);
    } else if (scene === 2) {
      ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(205, 70, 48, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = C.text; ctx.font = '12px Segoe UI'; ctx.fillText('N', 201, 15);
      ctx.strokeStyle = C.blue; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(205, 70); ctx.lineTo(205, 25); ctx.stroke();
      const angle = lerp(1.8, -Math.PI / 2, clamp(p * 1.6, 0, 1));
      ctx.strokeStyle = C.orange; ctx.beginPath(); ctx.moveTo(205, 70); ctx.lineTo(205 + Math.cos(angle) * 43, 70 + Math.sin(angle) * 43); ctx.stroke();
      ctx.fillStyle = C.green; ctx.fillRect(330, 48, 155, 44); ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Segoe UI'; ctx.fillText('教师坐标固定', 354, 76);
    } else if (scene === 3) {
      for (let i = 0; i < 6; i += 1) {
        for (let j = 0; j < 3; j += 1) {
          const x = 92 + i * 58 + (j % 2) * 8;
          const y = 39 + j * 31 + (i % 2) * 5;
          dot(ctx, x, y, C.blue, 5);
          const drift = 160 * (1 - clamp(p * 1.4, 0, 1));
          dot(ctx, x + drift, y + ((i + j) % 3 - 1) * 16 * (1 - p), C.green, 5);
        }
      }
      ctx.fillStyle = C.muted; ctx.font = '13px Segoe UI'; ctx.fillText('两套坐标逐步重合', 190, 130);
    } else if (scene === 4) {
      ctx.strokeStyle = '#cfd6df'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(45, 46); ctx.lineTo(510, 46); ctx.stroke();
      ctx.strokeStyle = C.green; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(45, 96); ctx.lineTo(510, 96); ctx.stroke();
      [160, 275, 390, 510].forEach((x, i) => {
        ctx.fillStyle = i === 3 ? C.orange : C.muted; ctx.fillRect(x - 2, 31, 4, 80);
        ctx.font = '11px Segoe UI'; ctx.fillText(i === 3 ? '同一成绩线' : `${i + 1}×`, x - 13, 126);
      });
      dot(ctx, lerp(48, 510, p), 46, C.red);
      dot(ctx, lerp(48, 510, clamp(p * 4, 0, 1)), 96, C.green);
      ctx.fillStyle = C.text; ctx.font = 'bold 12px Segoe UI'; ctx.fillText('基线', 14, 50); ctx.fillText('对齐', 14, 100);
    } else if (scene === 5) {
      ctx.strokeStyle = C.blue; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(45, 38); ctx.lineTo(515, 38); ctx.stroke();
      for (let i = 0; i < 6; i += 1) {
        const x = 70 + i * 79;
        ctx.fillStyle = p * 7 > i ? C.blue : '#e4e8ed'; ctx.fillRect(x, 24, 34, 28);
        ctx.fillStyle = C.muted; ctx.fillText('→', x + 38, 43);
      }
      for (let i = 0; i < 6; i += 1) {
        const x = 70 + i * 79;
        const clarity = clamp(p * 1.7 + ((i * 3) % 5) / 10, 0, 1);
        ctx.fillStyle = `rgba(34,141,92,${0.12 + clarity * 0.88})`; ctx.fillRect(x, 85, 34, 28);
      }
      ctx.strokeStyle = 'rgba(34,141,92,.28)'; ctx.lineWidth = 1;
      for (let i = 0; i < 5; i += 1) { ctx.beginPath(); ctx.moveTo(87 + i * 79, 99); ctx.lineTo(87 + (i + 1) * 79, 99); ctx.stroke(); }
      ctx.fillStyle = C.text; ctx.font = 'bold 12px Segoe UI'; ctx.fillText('单向', 14, 43); ctx.fillText('全局消雾', 8, 104);
    } else {
      const nodes = [
        [280, 70], [105, 34], [100, 108], [455, 30], [470, 105], [280, 120], [280, 20],
      ];
      nodes.slice(1).forEach(([x, y], i) => {
        ctx.strokeStyle = i > 3 ? C.orange : C.line;
        ctx.setLineDash(i > 3 ? [6, 7] : []);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(280, 70); ctx.lineTo(x, y); ctx.stroke();
      });
      ctx.setLineDash([]);
      nodes.forEach(([x, y], i) => dot(ctx, x, y, i === 0 ? C.green : i > 4 ? C.orange : C.blue, i === 0 ? 13 : 8));
      ctx.fillStyle = C.muted; ctx.font = '12px Segoe UI'; ctx.fillText('实线：本文证据', 24, 132); ctx.fillText('虚线：开放问题', 420, 132);
    }
  }, [scene], 560, 140);
  return <canvas ref={ref} width={560} height={140} role="img" aria-label={`第 ${scene} 章的地图隐喻动画`} />;
}

export const Ana1: React.FC<WidgetProps> = () => <AnalogyScene scene={1} />;
export const Ana2: React.FC<WidgetProps> = () => <AnalogyScene scene={2} />;
export const Ana3: React.FC<WidgetProps> = () => <AnalogyScene scene={3} />;
export const Ana4: React.FC<WidgetProps> = () => <AnalogyScene scene={4} />;
export const Ana5: React.FC<WidgetProps> = () => <AnalogyScene scene={5} />;
export const Ana6: React.FC<WidgetProps> = () => <AnalogyScene scene={6} />;
