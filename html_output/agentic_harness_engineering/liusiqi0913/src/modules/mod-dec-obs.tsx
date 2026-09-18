import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-dec-obs — 决策可观测性（第二章 2.3）
// 左栏约束①可控性（权限矩阵 → 目的 → 效果）；右栏约束②预测与裁决（竖向流程）；
// 各部分可点击 → 解释条；底部最终效果条。静态，无循环动画。

const W = 1080;
const H = 500;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
};

// 左栏：权限矩阵行
const MATRIX: { name: string; level: string; color: string; info: string }[] = [
  { name: 'harness workspace/', level: '读写', color: C.green, info: '演化智能体的全部编辑只能落在工作区内——这是它的显式动作空间。' },
  { name: 'runs/ 目录', level: '只读', color: C.steel, info: '试运行记录只读：不能事后粉饰或删除不利于自己的证据。' },
  { name: 'tracer', level: '只读', color: C.steel, info: '轨迹记录器不可改：保证被分析的轨迹忠实于真实执行。' },
  { name: 'verifier', level: '只读', color: C.steel, info: '验证器不可改：堵死"禁用验证器假装通过"的捷径。' },
  { name: 'LLM 配置', level: '只读', color: C.steel, info: '模型与推理预算不可改：增益只能来自 harness，而非换模型或加预算。' },
  { name: '种子系统提示词', level: '不可删', color: C.red, info: '种子提示词标记为不可删除：防止删掉基础规则后重新定义"成功"。' },
];

const MX = { x: 30, y: 56, w: 500, rowH: 30 };

// 右栏：预测与裁决流程
const FLOW2 = [
  { label: '编辑 + 变更清单', sub: '失败证据 · 根因 · 修复 · 预测（修复集 + 风险集）', color: C.blue, info: '每次编辑都必须附带清单条目：为什么改、改什么、预期修复哪些任务、可能破坏哪些任务。' },
  { label: '下一轮试运行', sub: '任务级结果', color: C.steel, info: '下一轮按同一基准重新试运行，得到每个任务的真实翻转。' },
  { label: '预测集 ∩ 实际 delta', sub: '逐条比对', color: C.blue, info: '把预测修复集/风险集与观测到的任务级 delta 求交——预测与实测对齐。' },
  { label: '裁决', sub: '兑现 → 保留 · 未兑现 → 按文件粒度回滚', color: C.green, info: '每条编辑得到明确裁决：兑现的保留，未兑现的回滚——编辑成为可证伪的契约。' },
];

const F2 = { x: 570, w: 480, h: 50, ys: [56, 120, 184, 248] };

export const ModDecObs: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  // sel: {kind:'mx',i} | {kind:'f2',i} | null（null=显示默认总结）
  const stateRef = useRef<{ kind: 'mx' | 'f2'; i: number } | null>({ kind: 'f2', i: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let mountTs = 0;

    const arrowHead = (x: number, y: number, angle: number, size: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - size * Math.cos(angle - 0.42), y - size * Math.sin(angle - 0.42));
      ctx.lineTo(x - size * Math.cos(angle + 0.42), y - size * Math.sin(angle + 0.42));
      ctx.closePath();
      ctx.fill();
    };

    const render = (now: number) => {
      if (!mountTs) mountTs = now;
      const enter = now - mountTs;
      const aIn = (order: number) => clamp((enter - order * 150) / 300, 0, 1);
      const st = stateRef.current;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ===== 左栏：约束① 可控性 =====
      ctx.save();
      ctx.globalAlpha = aIn(0);
      ctx.fillStyle = C.muted;
      ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('约束① · 可控性：能写哪里、不能碰哪里（点击行查看）', 30, 24);

      ctx.beginPath();
      ctx.roundRect(MX.x, MX.y, MX.w, MATRIX.length * MX.rowH + 16, 10);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.border;
      ctx.stroke();
      MATRIX.forEach((row, i) => {
        const ry = MX.y + 8 + i * MX.rowH;
        const selected = st?.kind === 'mx' && st.i === i;
        if (selected) {
          ctx.beginPath();
          ctx.roundRect(MX.x + 6, ry, MX.w - 12, MX.rowH - 4, 6);
          ctx.fillStyle = lerpColor(row.color, '#ffffff', 0.86);
          ctx.fill();
        }
        ctx.fillStyle = C.text;
        ctx.font = `${selected ? 'bold ' : ''}12.5px "Segoe UI", "PingFang SC", sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(row.name, MX.x + 18, ry + 19);
        // 右侧徽章
        ctx.font = 'bold 11px "Segoe UI", "PingFang SC", sans-serif';
        const bw = ctx.measureText(row.level).width + 18;
        ctx.beginPath();
        ctx.roundRect(MX.x + MX.w - 18 - bw, ry + 4, bw, 20, 10);
        ctx.fillStyle = row.color;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(row.level, MX.x + MX.w - 18 - bw / 2, ry + 18);
      });

      // 目的 → 效果
      const py1 = MX.y + MATRIX.length * MX.rowH + 32;
      ctx.beginPath();
      ctx.roundRect(MX.x, py1, MX.w, 48, 8);
      ctx.fillStyle = lerpColor(C.red, '#ffffff', 0.9);
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = C.red;
      ctx.stroke();
      ctx.fillStyle = C.text;
      ctx.font = '12.5px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('目的：堵住捷径——禁验证器 / 换模型 / 加推理预算 / 删种子规则', MX.x + 16, py1 + 29);
      arrowHead(MX.x + MX.w / 2, py1 + 62, Math.PI / 2, 6, C.steel);
      ctx.beginPath();
      ctx.roundRect(MX.x, py1 + 70, MX.w, 48, 8);
      ctx.fillStyle = lerpColor(C.green, '#ffffff', 0.88);
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = C.green;
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.font = 'bold 12.5px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('效果：每份增益都可归因于 harness 编辑', MX.x + 16, py1 + 99);
      ctx.restore();

      // ===== 右栏：约束② 预测与裁决 =====
      ctx.save();
      ctx.globalAlpha = aIn(1);
      ctx.fillStyle = C.muted;
      ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('约束② · 证据驱动 + 记录预测：每次编辑如何被检验（点击框查看）', 570, 24);

      FLOW2.forEach((box, i) => {
        const by = F2.ys[i];
        const selected = st?.kind === 'f2' && st.i === i;
        ctx.beginPath();
        ctx.roundRect(F2.x, by, F2.w, F2.h, 8);
        ctx.fillStyle = selected ? lerpColor(box.color, '#ffffff', 0.86) : C.panel;
        ctx.fill();
        ctx.lineWidth = selected ? 3 : 1.8;
        ctx.strokeStyle = selected ? box.color : C.border;
        ctx.stroke();
        ctx.fillStyle = C.text;
        ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(box.label, F2.x + 16, by + 21);
        ctx.fillStyle = C.muted;
        ctx.font = '11.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(box.sub, F2.x + 16, by + 39);
        if (i < FLOW2.length - 1) {
          const ay = by + F2.h;
          ctx.strokeStyle = C.steel;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(F2.x + F2.w / 2, ay + 3);
          ctx.lineTo(F2.x + F2.w / 2, F2.ys[i + 1] - 4);
          ctx.stroke();
          arrowHead(F2.x + F2.w / 2, F2.ys[i + 1] - 2, Math.PI / 2, 6, C.steel);
        }
      });
      ctx.restore();

      // ===== 底部：解释条 + 最终效果条 =====
      ctx.save();
      ctx.globalAlpha = aIn(2);
      // 解释条
      const selInfo = st
        ? st.kind === 'mx'
          ? { color: MATRIX[st.i].color, title: MATRIX[st.i].name, text: MATRIX[st.i].info }
          : { color: FLOW2[st.i].color, title: FLOW2[st.i].label, text: FLOW2[st.i].info }
        : null;
      ctx.beginPath();
      ctx.roundRect(30, 396, 1020, 40, 8);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.border;
      ctx.stroke();
      if (selInfo) {
        ctx.fillStyle = selInfo.color;
        ctx.beginPath();
        ctx.roundRect(46, 409, 14, 14, 3);
        ctx.fill();
        ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(selInfo.title, 70, 422);
        const tw = ctx.measureText(selInfo.title).width;
        ctx.fillStyle = C.text;
        ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(selInfo.text, 70 + tw + 14, 422);
      }
      // 最终效果条
      ctx.beginPath();
      ctx.roundRect(30, 446, 1020, 42, 8);
      ctx.fillStyle = lerpColor(C.blue, '#ffffff', 0.92);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.blue;
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = 'bold 14px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('最终效果：每次编辑成为可证伪的文件级契约——用可度量的轮间契约取代自利辩白。', W / 2, 472);
      ctx.restore();
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    for (let i = 0; i < MATRIX.length; i++) {
      const ry = MX.y + 8 + i * MX.rowH;
      if (x >= MX.x && x <= MX.x + MX.w && y >= ry && y <= ry + MX.rowH - 4) {
        stateRef.current = { kind: 'mx', i };
        return;
      }
    }
    for (let i = 0; i < FLOW2.length; i++) {
      if (x >= F2.x && x <= F2.x + F2.w && y >= F2.ys[i] && y <= F2.ys[i] + F2.h) {
        stateRef.current = { kind: 'f2', i };
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onClick={onCanvasClick}
      />
    </div>
  );
};

export default ModDecObs;
