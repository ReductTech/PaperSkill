import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 1.1：错题本诊断：三类欠优化区域（P4 芯片）。
// 左侧只显示当前选中的那一类区域的示意图（不再同时显示三类）：
//   边界脆弱 → 抖动/弯曲的铅笔乱线块
//   覆盖稀疏 → 孤零零的一个标记
//   监督不可靠 → 被红叉划掉的错误标记
// 右侧白色面板显示该类区域的诊断方法与补数据预算对比。

const W = 560;
const H = 240;

const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#d97706';
const INK = '#21324a';
const MUTED = '#68778f';
const AXIS = '#d7deea';

type Region = 'fragile' | 'sparse' | 'supervision';

interface RegionInfo {
  name: string;
  diag: string;
  feedback: string;
  cls: 'good' | 'bad' | '';
}

const REGIONS: Record<Region, RegionInfo> = {
  fragile: {
    name: '边界脆弱',
    diag: '跨 checkpoint×扰动比对（8×16=128 次预测）',
    feedback: '这类样本轻微换一种扰动输出就变——模型没学到稳定的映射，这是<b>边界脆弱</b>区域。',
    cls: 'bad',
  },
  sparse: {
    name: '覆盖稀疏',
    diag: '特征相似图里的孤立小簇',
    feedback: '这类样本在训练数据里只出现过一两次——周围支撑太少，这是<b>覆盖稀疏</b>区域。',
    cls: '',
  },
  supervision: {
    name: '监督不可靠',
    diag: '三位专家独立核对标签',
    feedback: '模型自信地重复同一个错误——怀疑<b>答案本身</b>就不可靠，这是<b>监督不可靠</b>区域。',
    cls: 'bad',
  },
};

const REGION_ORDER: Region[] = ['fragile', 'sparse', 'supervision'];

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number
): void {
  let line = '';
  let cy = y;
  for (const ch of text) {
    const test = line + ch;
    if (line && ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, cy);
      line = ch;
      cy += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

// 边界脆弱：文档变化极小，输出 B 却成了乱码。
// 原文档略放大；扰动后的文档为原文档的 0.8 倍，内容完全相同。
function drawDoc(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-50, -30, 100, 60);
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1;
  ctx.strokeRect(-50 + 0.5, -30 + 0.5, 99, 59);
  ctx.fillStyle = INK;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('领料单', -42, -14);
  ctx.fillText('纸张 ×3 ¥128', -42, 4);
  ctx.fillText('合计 ¥384', -42, 20);
  ctx.restore();
}

function drawFragileScene(ctx: CanvasRenderingContext2D): void {
  // 左：原文档（略放大，100×60）
  drawDoc(ctx, 102, 102, 1);
  // 扰动箭头
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(152, 102);
  ctx.lineTo(186, 102);
  ctx.stroke();
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.moveTo(186, 102);
  ctx.lineTo(180, 98);
  ctx.lineTo(180, 106);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = MUTED;
  ctx.font = '10px sans-serif';
  ctx.fillText('轻微扰动', 156, 94);
  // 右：扰动后的同一文档——内容完全相同，整体缩小到 0.8 倍
  drawDoc(ctx, 238, 102, 0.8);
  // 下方输出对比：文档几乎没变，输出 B 却成了乱码
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(56, 150, 110, 20);
  ctx.strokeStyle = AXIS;
  ctx.strokeRect(56.5, 150.5, 109, 19);
  ctx.fillStyle = INK;
  ctx.font = '10px monospace';
  ctx.fillText('输出 A：纸张×3 ¥128', 62, 164);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(174, 150, 110, 20);
  ctx.strokeStyle = AXIS;
  ctx.strokeRect(174.5, 150.5, 109, 19);
  ctx.fillStyle = RED;
  ctx.fillText('输出 B：?#§×*?§×#', 180, 164);
  ctx.fillStyle = MUTED;
  ctx.font = '11px sans-serif';
  ctx.fillText('文档几乎没变，输出 B 却成了乱码', 74, 190);
}

// 覆盖稀疏：密集的样本簇与一个远离群体的孤立样本
function drawSparseScene(ctx: CanvasRenderingContext2D): void {
  // 密集簇（左侧）
  ctx.fillStyle = '#b8c9a7';
  for (let i = 0; i < 9; i++) {
    const x = 74 + ((i * 37) % 70);
    const y = 84 + ((i * 29) % 62);
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // 簇的轮廓圈（示意）
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.arc(110, 115, 52, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // 孤立的离群样本（远离簇）
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.arc(262, 115, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(262, 115, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('远离簇的孤立样本 = 覆盖稀疏', 88, 190);
  ctx.textAlign = 'left';
}

// 监督不可靠：原标签与三位专家的结果对不上（专家1、2 输出一致且不同于原标签）
function drawSupervisionScene(ctx: CanvasRenderingContext2D): void {
  // 原标签卡（被红叉标记为可疑）
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(56, 84, 84, 44);
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1;
  ctx.strokeRect(56.5, 84.5, 83, 43);
  ctx.fillStyle = INK;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('原标签', 64, 100);
  ctx.fillText('¥384', 64, 118);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(66, 90);
  ctx.lineTo(130, 120);
  ctx.moveTo(130, 90);
  ctx.lineTo(66, 120);
  ctx.stroke();
  // 三位专家输出：专家1、2 一致（¥348），专家3 不同（¥421）
  const expertValues = ['¥348', '¥348', '¥421'];
  for (let i = 0; i < 3; i++) {
    const ex = 166 + i * 54;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ex, 84, 46, 44);
    ctx.strokeStyle = AXIS;
    ctx.lineWidth = 1;
    ctx.strokeRect(ex + 0.5, 84.5, 45, 43);
    ctx.fillStyle = INK;
    ctx.font = '10px sans-serif';
    ctx.fillText('专家' + (i + 1), ex + 6, 98);
    ctx.fillText(expertValues[i], ex + 6, 114);
    ctx.strokeStyle = i < 2 ? GREEN : RED;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (i < 2) {
      ctx.moveTo(ex + 28, 104);
      ctx.lineTo(ex + 32, 108);
      ctx.lineTo(ex + 40, 98);
    } else {
      ctx.moveTo(ex + 28, 98);
      ctx.lineTo(ex + 40, 108);
      ctx.moveTo(ex + 40, 98);
      ctx.lineTo(ex + 28, 108);
    }
    ctx.stroke();
  }
  ctx.fillStyle = MUTED;
  ctx.font = '11px sans-serif';
  ctx.fillText('专家 1、2 一致（¥348）≠ 原标签 → 标签可疑', 48, 158);
}

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ selected: Region }>({ selected: 'fragile' });
  const rafRef = useRef<number | null>(null);
  const [selected, setSelected] = useState<Region>('fragile');
  const [feedback, setFeedback] = useState({
    text: REGIONS.fragile.feedback,
    cls: REGIONS.fragile.cls,
  });

  const selectRegion = (r: Region) => {
    stateRef.current.selected = r;
    setSelected(r);
    setFeedback({ text: REGIONS[r].feedback, cls: REGIONS[r].cls });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (s: { selected: Region }) => {
      ctx.clearRect(0, 0, W, H);

      // bg → desk
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(10, 10, W - 20, H - 20);

      // notebook page（左侧 60%）
      ctx.fillStyle = '#76906a';
      ctx.fillRect(29, 25, 296, 196);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(26, 22, 296, 196);
      ctx.strokeStyle = AXIS;
      ctx.lineWidth = 1;
      ctx.strokeRect(26.5, 22.5, 295, 195);
      ctx.fillStyle = '#92400e';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(19, 40 + i * 38, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 只绘制当前选中的那一类示意图
      if (s.selected === 'fragile') drawFragileScene(ctx);
      else if (s.selected === 'sparse') drawSparseScene(ctx);
      else drawSupervisionScene(ctx);

      // 选中区域名称（左上角）
      ctx.fillStyle = MUTED;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(REGIONS[s.selected].name, 40, 48);

      // inset panel（右侧 40%）：诊断方法 + 补数据预算对比
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(348, 22, 194, 196);
      ctx.strokeStyle = AXIS;
      ctx.lineWidth = 1;
      ctx.strokeRect(348.5, 22.5, 193, 195);
      ctx.fillStyle = INK;
      ctx.font = '13px sans-serif';
      wrapText(ctx, REGIONS[s.selected].diag, 358, 44, 174, 18);
      ctx.fillStyle = MUTED;
      ctx.font = '12px sans-serif';
      ctx.fillText('均匀补数据 vs 定向补弱区', 358, 92);
      ctx.font = '11px sans-serif';
      ctx.fillText('均匀补数据', 358, 108);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(358, 112, 150, 9);
      ctx.fillStyle = ORANGE;
      ctx.fillRect(453, 112, 55, 9);
      ctx.fillText('定向补弱区', 358, 136);
      ctx.fillStyle = GREEN;
      ctx.fillRect(453, 140, 55, 9);
      ctx.fillStyle = MUTED;
      ctx.font = '11px sans-serif';
      wrapText(ctx, '均匀方案大部分预算落在已会区域', 358, 158, 174, 15);

      // legend
      ctx.fillStyle = MUTED;
      ctx.font = '11px sans-serif';
      ctx.fillText('', 30, 210);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current) return;
      if (prefersReduced) {
        render(stateRef.current);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {REGION_ORDER.map((r) => (
          <button
            key={r}
            type="button"
            className={'chip' + (selected === r ? ' selected' : '')}
            onClick={() => selectRegion(r)}
            aria-pressed={selected === r}
          >
            {REGIONS[r].name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
};

export default Ch1Mod1;
