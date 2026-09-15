import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 5 章 Module 5.1：注意力对齐开关（数学/技术视图，P4 芯片）
// 直接显示论文 Fig. 11 + 配套引导说明
// 论文 Fig. 11 上半 = 单物体的注意力图（3 行 × T=0.5/T=0.1/T=0.01 三个不同温度下的目标对应图）
// 论文 Fig. 11 下半 = (a) Before alignment / (b) After alignment（同场景多层 Dec. L_9/11/13）
// 我们用「整图嵌入 + 高亮对应点 + 红色连接线 + 按钮切换对齐前/后」来直观传达"找同一对应点"。
const W = 1080;
const H = 420;

const STATES = [
  {
    name: 'Before (无注意力对齐)',
    color: '#c43f52',
    desc: '没有注意力对齐：模型注意力分散到 View 1/2/3/4 各处，看起来像"在乱飞"，找不到同一个对应点。',
    cls: 'bad',
  },
  {
    name: 'After (有注意力对齐)',
    color: '#228d5c',
    desc: '有注意力对齐：模型注意力在四个视角中聚焦到同一个小蓝鸭子的对应位置——这就是"找同一对应点"的视觉证据。',
    cls: 'good',
  },
];

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ state: 1 }); // 默认 After（更有意义）
  const rafRef = useRef<number | null>(null);
  const fig11Ref = useRef<HTMLImageElement | null>(null);
  const mvRef = useRef<HTMLImageElement | null>(null);
  const [state, setState] = useState(1);
  const [feedback, setFeedback] = useState({
    text: '切换「无对齐 / 注意力对齐」：论文 Fig. 11 显示同一查询点在不同视角下的注意力对应——对齐后才精准聚焦到同一物体。',
    cls: '',
  });

  useEffect(() => {
    const a = new Image();
    a.src = './images/fig11_alignment.jpg';
    a.onload = () => { fig11Ref.current = a; };
    const b = new Image();
    b.src = './images/analogy_multiview.png';
    b.onload = () => { mvRef.current = b; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { state: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const current = STATES[s.state];

      // 顶部说明 banner
      ctx.fillStyle = current.color;
      ctx.font = 'bold 17px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(current.name, W / 2, 32);
      ctx.fillStyle = '#21324a';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('同图显示论文 Fig. 11：query (红色点) → View 1/2/3/4 的注意力热度', W / 2, 56);
      ctx.textAlign = 'left';

      // ============== 显示论文 Fig.11（半边） ==============
      const fig11 = fig11Ref.current;
      if (fig11) {
        const iw = fig11.width, ih = fig11.height;
        // 让 fig11 占据画布左侧约 60% 宽
        const drawW = 660, drawH = 280;
        const drawX = 30, drawY = 80;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(drawX, drawY, drawW, drawH);
        ctx.strokeStyle = '#d7deea';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, drawW, drawH);

        // fig11 在原图是上下两半：上半 T=0.5/T=0.1/T=0.01 target map；下半 (a)(b) before/after
        // 我们要 (a) 或 (b) 半边（对应 s.state=0/1）+ 上半部分留作辅助说明
        const scale = Math.min(drawW / iw, drawH / ih);
        const sw = iw * scale, sh = ih * scale;
        const x0 = drawX + (drawW - sw) / 2;
        const y0 = drawY + (drawH - sh) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(drawX, drawY, drawW, drawH);
        ctx.clip();
        ctx.drawImage(fig11, x0, y0, sw, sh);
        ctx.restore();

        // 红色半透明遮罩：高亮当前选中的下半区域（Before=左 / After=右）
        // 下半在 fig11 中大约是 y 比例 [0.50, 0.95]，水平方向分两半 (a)/(b)
        const downTopY = y0 + sh * 0.50;
        const downBotY = y0 + sh * 0.95;
        const downX1 = x0;
        const downX2 = s.state === 0 ? x0 + sw * 0.5 : x0 + sw * 0.5;
        const downX3 = s.state === 0 ? x0 + sw * 0.5 : x0 + sw;

        // 画外框高亮当前选中的 (a)/(b) 区域
        ctx.strokeStyle = current.color;
        ctx.lineWidth = 4;
        if (s.state === 0) {
          // (a) 左半
          ctx.strokeRect(downX1 + 2, downTopY + 2, sw * 0.5 - 4, downBotY - downTopY - 4);
        } else {
          // (b) 右半
          ctx.strokeRect(downX2 + 2, downTopY + 2, sw * 0.5 - 4, downBotY - downTopY - 4);
        }
      } else {
        ctx.fillStyle = '#b0b8c4';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('加载论文 Fig. 11…', 360, 200);
        ctx.textAlign = 'left';
      }

      // ============== 右侧：跨视角"找同一对应点"的小示意图 ==============
      const sx = 720, sy = 80, sw2 = 330, sh2 = 200;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx, sy, sw2, sh2);
      ctx.strokeStyle = current.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, sy, sw2, sh2);

      // 画 4 个小视角子图（用 analogy_multiview 同一张图做"参考视图"的示意）
      const mv = mvRef.current;
      const queryPt = { x: sx + 28, y: sy + 70 }; // 红点 query
      const subW = 70, subH = 50;
      const subs = [
        { x: sx + 110, y: sy + 30, lbl: 'View 1' },
        { x: sx + 190, y: sy + 30, lbl: 'View 2' },
        { x: sx + 110, y: sy + 110, lbl: 'View 3' },
        { x: sx + 190, y: sy + 110, lbl: 'View 4' },
      ];

      // 参考视图（左侧 query）
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(queryPt.x - 22, queryPt.y - 24, 60, 60);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(queryPt.x - 22, queryPt.y - 24, 60, 60);
      if (mv) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(queryPt.x - 22, queryPt.y - 24, 60, 60);
        ctx.clip();
        const iw = mv.width, ih = mv.height;
        const sc = Math.max(60 / iw, 60 / ih);
        const dw = iw * sc, dh = ih * sc;
        ctx.drawImage(mv, queryPt.x - 22 + (60 - dw) / 2, queryPt.y - 24 + (60 - dh) / 2, dw, dh);
        ctx.restore();
      }
      // query 红点
      ctx.fillStyle = '#ff3344';
      ctx.beginPath();
      ctx.arc(queryPt.x, queryPt.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Reference', queryPt.x + 8, queryPt.y - 30);
      ctx.fillText('(query)', queryPt.x + 8, queryPt.y - 16);
      ctx.textAlign = 'left';

      // 4 个 view 子图
      subs.forEach((sub, i) => {
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(sub.x, sub.y, subW, subH);
        ctx.strokeStyle = '#d7deea';
        ctx.lineWidth = 2;
        ctx.strokeRect(sub.x, sub.y, subW, subH);

        if (mv) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(sub.x, sub.y, subW, subH);
          ctx.clip();
          const iw = mv.width, ih = mv.height;
          const sc = Math.max(subW / iw, subH / ih);
          const dw = iw * sc, dh = ih * sc;
          ctx.drawImage(mv, sub.x + (subW - dw) / 2, sub.y + (subH - dh) / 2, dw, dh);
          ctx.restore();
        }

        // 高亮位置：根据 state 不同画热区
        if (s.state === 1) {
          // 对齐：精确热区，4 个视图都集中在 query 对应的"同一个小角落"
          const px = sub.x + subW * 0.55, py = sub.y + subH * 0.5;
          const grad = ctx.createRadialGradient(px, py, 0, px, py, 16);
          grad.addColorStop(0, 'rgba(34, 141, 92, 0.9)');
          grad.addColorStop(1, 'rgba(34, 141, 92, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(sub.x, sub.y, subW, subH);
          ctx.fillStyle = '#ff3344';
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();
          // 连线（从 query 到每个 view 对应点）
          ctx.strokeStyle = '#228d5c';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(queryPt.x, queryPt.y);
          ctx.lineTo(px, py);
          ctx.stroke();
        } else {
          // 无对齐：每个 view 分散到不同位置（演示"乱飞"）
          const offsets = [
            { dx: 0.25, dy: 0.30 },
            { dx: 0.75, dy: 0.25 },
            { dx: 0.30, dy: 0.65 },
            { dx: 0.80, dy: 0.75 },
          ];
          const o = offsets[i];
          const px = sub.x + subW * o.dx, py = sub.y + subH * o.dy;
          const grad = ctx.createRadialGradient(px, py, 0, px, py, 14);
          grad.addColorStop(0, 'rgba(196, 63, 82, 0.7)');
          grad.addColorStop(1, 'rgba(196, 63, 82, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(sub.x, sub.y, subW, subH);
          ctx.fillStyle = '#c43f52';
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(196, 63, 82, 0.6)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(queryPt.x, queryPt.y);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle = '#21324a';
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sub.lbl, sub.x + subW / 2, sub.y + subH + 14);
        ctx.textAlign = 'left';
      });

      // 底部说明卡片
      const ex = 720, ey = sy + sh2 + 16;
      const ew = 330, eh = 110;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex, ey, ew, eh);
      ctx.strokeStyle = current.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(ex, ey, ew, eh);

      ctx.fillStyle = current.color;
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('对应一致性', ex + 14, ey + 22);

      // 度量条
      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", sans-serif';
      const metric = s.state === 1 ? 0.92 : 0.22;
      const label = s.state === 1 ? '跨视角一致性 (PCK)' : '对应错误率';
      ctx.fillText(label, ex + 14, ey + 46);
      const barW = ew - 28;
      ctx.fillStyle = '#e8efe0';
      ctx.fillRect(ex + 14, ey + 50, barW, 10);
      ctx.fillStyle = current.color;
      ctx.fillRect(ex + 14, ey + 50, barW * metric, 10);
      ctx.fillStyle = current.color;
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(metric * 100) + '%', ex + ew - 16, ey + 60);
      ctx.textAlign = 'left';

      // 简短说明
      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", sans-serif';
      const txt = current.desc.length > 80 ? current.desc.slice(0, 80) + '…' : current.desc;
      let line = '';
      let cy = ey + 80;
      for (let i = 0; i < txt.length; i++) {
        const ch = txt[i];
        line += ch;
        if (ctx.measureText(line).width > ew - 28 || ch === '。') {
          ctx.fillText(line, ex + 14, cy);
          cy += 16;
          line = '';
        }
      }
      if (line) ctx.fillText(line, ex + 14, cy);

      // 底部脚注
      ctx.fillStyle = '#68778f';
      ctx.font = 'italic 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('论文 Fig. 11 完整图嵌入左侧，红色边框高亮当前选中状态（(a) Before / (b) After）', W / 2, H - 16);
      ctx.textAlign = 'left';
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const select = (i: number) => {
    stateRef.current.state = i;
    setState(i);
    setFeedback({ text: STATES[i].desc, cls: STATES[i].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {STATES.map((s, i) => (
          <button
            key={i}
            className={`chip ${state === i ? 'selected' : ''}`}
            onClick={() => select(i)}
            style={state === i ? { background: s.color, color: '#fff', borderColor: s.color } : undefined}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;
