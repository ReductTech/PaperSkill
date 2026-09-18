import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 7 章 Module 7.1：消融配置切换（重排版，无空白，参考论文 Table 4(a) 风格）
// 4 个模型 × 3 个数据集 = 12 根柱，并列紧排；下方 1 行差异总结；右下论文 Table 4(a) 嵌入说明。
const W = 1080;
const H = 360;

// 论文 Table 4(a)：Ablation on training components — Pose estimation (AUC30 ↑)
// 模型 A：无插值流匹配 + 无注意力对齐；模型 B：无插值 + 有对齐；模型 C：有插值 + 无对齐；模型 D (Full)：有插值 + 有对齐
const MODELS = [
  { name: 'A', interp: false, align: false, color: '#9aa6b5', bg: '#f5f6f8', desc: '无插值流匹配、无注意力对齐（标准流匹配）' },
  { name: 'B', interp: false, align: true, color: '#27446e', bg: '#f5f6f8', desc: '标准流匹配 + 注意力对齐：性能不升反降' },
  { name: 'C', interp: true, align: false, color: '#f07e47', bg: '#f5f6f8', desc: '插值流匹配（无对齐）：结构先验带来明显提升' },
  { name: 'D', interp: true, align: true, color: '#228d5c', bg: '#e8f3ed', desc: '完整配置（即论文最终采用的 GARD）：插值流匹配 + 注意力对齐，最佳性能', isPaper: true },
];

// 论文 Table 4(a) AUC30（Pose estimation accuracy）；分别来自 ETH3D / DTU / ScanNet++
const DATA = [
  {
    name: 'ETH3D',
    vals: { A: 67.30, B: 66.42, C: 73.85, D: 74.68 },
    maxY: 80,
    color: '#27446e',
  },
  {
    name: 'DTU',
    vals: { A: 87.21, B: 85.49, C: 89.99, D: 92.37 },
    maxY: 95,
    color: '#f07e47',
  },
  {
    name: 'ScanNet++',
    vals: { A: 84.12, B: 84.90, C: 85.90, D: 87.45 },
    maxY: 95,
    color: '#228d5c',
  },
];

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ model: 3 });
  const rafRef = useRef<number | null>(null);
  const tableRef = useRef<HTMLImageElement | null>(null);
  const [model, setModel] = useState(3);
  const [feedback, setFeedback] = useState({
    text: '对照模型 A/B/C，可看出：单独加注意力对齐（B）反而下降，插值流匹配（C）才是关键，两者结合（D，论文采用）达到最优。',
    cls: 'good',
  });

  useEffect(() => {
    const a = new Image();
    a.src = './images/table45_ablation.webp';
    a.onload = () => { tableRef.current = a; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { model: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const m = MODELS[s.model];

      // ============== 顶部：4 个模型配置概览（一行紧凑） ==============
      const topY = 20, topH = 50;
      const slotW = (W - 60) / 4;
      MODELS.forEach((mm, i) => {
        const x = 30 + i * slotW + (i > 0 ? 8 : 0);
        const slotW_ = slotW - (i > 0 ? 8 : 0);
        ctx.fillStyle = mm.isPaper ? '#e8f3ed' : '#ffffff';
        ctx.fillRect(x, topY, slotW_, topH);
        ctx.strokeStyle = mm.isPaper ? '#228d5c' : '#d7deea';
        ctx.lineWidth = mm.isPaper ? 2 : 1;
        ctx.strokeRect(x, topY, slotW_, topH);

        // 模型名
        ctx.fillStyle = mm.color;
        ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('模型 ' + mm.name + (mm.isPaper ? '  ✓ 论文采用' : ''), x + slotW_ / 2, topY + 22);

        // 配置小字
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillStyle = '#68778f';
        const cfg = '插值流匹配 ' + (mm.interp ? '✓' : '✗') + '  ·  注意力对齐 ' + (mm.align ? '✓' : '✗');
        ctx.fillText(cfg, x + slotW_ / 2, topY + 40);
        ctx.textAlign = 'left';
      });

      // ============== 中部：3 个数据集的并列柱状图（4 模型 × 3 数据集） ==============
      const plotY = 90;
      const plotH = 180;
      const plotX = 30;
      const plotW = W - 60;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(plotX, plotY, plotW, plotH);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(plotX, plotY, plotW, plotH);

      // 顶部小标题
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Pose estimation AUC30 ↑ （论文 Table 4(a)）', plotX + plotW / 2, plotY + 20);
      ctx.textAlign = 'left';

      // 3 个数据集分组（每组占 plotW/3）
      const groupW = plotW / 3;
      const innerX = 10;
      const innerW = groupW - 20;

      DATA.forEach((ds, gi) => {
        const gx = plotX + gi * groupW;
        const bx0 = gx + innerX;
        const by = plotY + 32;
        const bh = plotH - 60;

        // 数据集标题
        ctx.fillStyle = ds.color;
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ds.name, gx + groupW / 2, by);

        // 4 根柱
        const barSlot = innerW / 4;
        const barW = Math.min(barSlot * 0.62, 50);
        MODELS.forEach((mm, mi) => {
          const v = ds.vals[mm.name as keyof typeof ds.vals];
          const bx = bx0 + mi * barSlot + (barSlot - barW) / 2;
          const h = (v / ds.maxY) * bh;
          const isHigh = mm.isPaper;

          // 柱
          ctx.fillStyle = mm.color;
          ctx.fillRect(bx, by + 16 + (bh - h), barW, h);

          // 高亮当前选中模型
          if (mi === s.model) {
            // 选中：柱顶加金色边框
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 3;
            ctx.strokeRect(bx - 1, by + 16 + (bh - h) - 1, barW + 2, h + 1);
          }

          // 数值标签
          ctx.fillStyle = mm.color;
          ctx.font = 'bold 12px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(v.toFixed(2), bx + barW / 2, by + 16 + (bh - h) - 6);

          // 模型名标签
          ctx.fillStyle = mm.color;
          ctx.font = 'bold 11px "Segoe UI", sans-serif';
          ctx.fillText(mm.name, bx + barW / 2, by + 16 + bh + 14);
          ctx.textAlign = 'left';
        });
      });

      // y 轴参考（只用 ETH3D 一组的位置画一条参考线）
      ctx.strokeStyle = '#b0b8c4';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      // 基线
      ctx.beginPath();
      ctx.moveTo(plotX + 10, plotY + 32 + 16 + (plotH - 60));
      ctx.lineTo(plotX + plotW - 10, plotY + 32 + 16 + (plotH - 60));
      ctx.stroke();
      ctx.setLineDash([]);

      // ============== 底部：当前模型说明 + 关键差异 ==============
      const botY = 290;
      const botH = 50;
      // 左：当前模型描述（占据 70%）
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(plotX, botY, plotW * 0.7 - 5, botH);
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(plotX, botY, plotW * 0.7 - 5, botH);

      ctx.fillStyle = m.color;
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('当前配置：' + (m.isPaper ? '模型 D (论文采用 ✓)' : '模型 ' + m.name), plotX + 14, botY + 20);
      ctx.fillStyle = '#21324a';
      ctx.font = '13px "Segoe UI", sans-serif';
      // 文字换行
      let line = '';
      let cy = botY + 38;
      const maxW = plotW * 0.7 - 30;
      for (let i = 0; i < m.desc.length; i++) {
        const ch = m.desc[i];
        line += ch;
        if (ctx.measureText(line).width > maxW) {
          ctx.fillText(line, plotX + 14, cy);
          cy += 16;
          line = '';
        }
      }
      if (line) ctx.fillText(line, plotX + 14, cy);

      // 右：关键差异数据（25%）
      const rx = plotX + plotW * 0.7 + 5;
      const rw = plotW * 0.3 - 5;
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(rx, botY, rw, botH);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, botY, rw, botH);

      const eth3d_D = DATA[0].vals.D;
      const eth3d_C = DATA[0].vals.C;
      const eth3d_B = DATA[0].vals.B;
      const eth3d_A = DATA[0].vals.A;
      const diff_DC = (eth3d_D - eth3d_C).toFixed(2);
      const diff_BA = (eth3d_B - eth3d_A).toFixed(2);

      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('关键差异 (ETH3D AUC30)', rx + 10, botY + 18);
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#228d5c';
      ctx.fillText('D − C = +' + diff_DC, rx + 10, botY + 34);
      ctx.fillStyle = '#c43f52';
      ctx.fillText('B − A = ' + diff_BA, rx + 10, botY + 48);
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
    stateRef.current.model = i;
    setModel(i);
    const m = MODELS[i];
    if (i === 3) {
      setFeedback({
        text: '模型 D：完整配置（即论文最终采用的 GARD）：插值流匹配 + 注意力对齐，最佳性能。ETH3D AUC30 = 74.68，DTU = 92.37，ScanNet++ = 87.45，三个数据集全面领先。',
        cls: 'good',
      });
    } else if (i === 1) {
      setFeedback({
        text: '模型 B：标准流匹配 + 注意力对齐：性能不升反降（ETH3D 66.42 < A 67.30）。这说明注意力对齐必须配合插值流匹配才有效。',
        cls: 'bad',
      });
    } else if (i === 2) {
      setFeedback({
        text: '模型 C：插值流匹配（无对齐）：结构先验带来明显提升（ETH3D 73.85，远超 B 66.42）。这是 D 能成功的关键组件。',
        cls: 'good',
      });
    } else {
      setFeedback({
        text: '模型 A：无插值流匹配、无注意力对齐（标准流匹配）。基线参考，作为对照。',
        cls: '',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {MODELS.map((m, i) => (
          <button
            key={m.name}
            className={`chip ${model === i ? 'selected' : ''}`}
            onClick={() => select(i)}
            style={model === i ? { background: m.color, color: '#fff', borderColor: m.color } : undefined}
          >
            模型 {m.name}{m.isPaper ? ' (论文采用)' : ''}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;
