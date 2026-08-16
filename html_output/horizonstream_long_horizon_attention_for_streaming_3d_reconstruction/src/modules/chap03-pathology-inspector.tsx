import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { assetPath } from '../lib/assetPath';

const W = 760;
const H = 165;

const methods = [
  {
    name: '硬截断',
    paperName: 'Stream3R · window',
    left: 7.0,
    width: 10.6,
    chain: '滑窗边界 → 影响突然归零 → 仍有价值的跨窗证据被切断，可能导致崩溃',
    hint: 'mini-kernel 在窗口内保留、越过边界立即归零。',
  },
  {
    name: '周期刷新',
    paperName: 'LongStream · refresh',
    left: 17.7,
    width: 10.6,
    chain: '定期刷新记忆 → 影响出现跳变 → 跨刷新边界的几何不连续，可能积累漂移',
    hint: 'mini-kernel 用阶梯式重置表示刷新不连续。',
  },
  {
    name: '陈旧递归',
    paperName: 'TTT3R · recurrence',
    left: 28.4,
    width: 10.6,
    chain: '递归状态缺少合适遗忘 → 陈旧影响形成厚尾 → 状态逐渐饱和，可能崩溃',
    hint: 'mini-kernel 的尾部持续偏高，表示旧影响不易消失。',
  },
  {
    name: '注意力汇点',
    paperName: 'LingBot-map · KV cache',
    left: 39.0,
    width: 10.6,
    chain: '缓存注意力集中到少量旧位置 → 影响形成尖峰 → 局部证据被少数历史帧支配，可能抖动',
    hint: 'mini-kernel 的窄尖峰是读图辅助，不是论文测量值。',
  },
] as const;

export const Chap03PathologyInspector: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const inspectorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState(0);
  const [autoPlay, setAutoPlay] = useState(
    () =>
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [isVisible, setIsVisible] = useState(true);
  const [showLayer, setShowLayer] = useState(true);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const method = methods[selected];

  useEffect(() => {
    const node = inspectorRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!autoPlay || !isVisible) return;
    const timer = window.setInterval(() => {
      setSelected((current) => (current + 1) % methods.length);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [autoPlay, isVisible]);

  useEffect(() => {
    if (!autoPlay) return;
    setSeen((current) => {
      if (current.has(selected)) return current;
      const next = new Set(current);
      next.add(selected);
      return next;
    });
  }, [autoPlay, selected]);

  const selectMethod = (index: number) => {
    setSelected(index);
    setAutoPlay(false);
    setSeen((current) => {
      const next = new Set(current);
      next.add(index);
      return next;
    });
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
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(94,105,120,0.12)';
    for (let x = 20; x < W; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x, 136);
      ctx.stroke();
    }
    for (let y = 16; y < 140; y += 24) {
      ctx.beginPath();
      ctx.moveTo(42, y);
      ctx.lineTo(W - 26, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#9ca9ba';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(42, 132);
    ctx.lineTo(W - 26, 132);
    ctx.moveTo(42, 132);
    ctx.lineTo(42, 22);
    ctx.stroke();
    ctx.fillStyle = '#5e6978';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('历史 i', 42, 153);
    ctx.fillText('接近当前 t', W - 86, 153);
    ctx.save();
    ctx.translate(18, 109);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('影响 K(t,i)', 0, 0);
    ctx.restore();

    ctx.strokeStyle = '#c66a16';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (selected === 0) {
      ctx.moveTo(55, 126);
      ctx.lineTo(425, 126);
      ctx.lineTo(425, 48);
      ctx.lineTo(716, 48);
    } else if (selected === 1) {
      ctx.moveTo(55, 120);
      for (let segment = 0; segment < 4; segment += 1) {
        const x = 55 + segment * 165;
        ctx.lineTo(x + 120, 54);
        ctx.lineTo(x + 120, 112);
      }
    } else if (selected === 2) {
      ctx.moveTo(55, 60);
      ctx.bezierCurveTo(250, 65, 475, 74, 716, 83);
    } else {
      ctx.moveTo(55, 126);
      ctx.lineTo(196, 122);
      ctx.lineTo(213, 42);
      ctx.lineTo(230, 121);
      ctx.lineTo(445, 116);
      ctx.lineTo(462, 58);
      ctx.lineTo(478, 114);
      ctx.lineTo(716, 105);
    }
    ctx.stroke();

    ctx.fillStyle = '#17202b';
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillText(`${method.name}的影响形状读图辅助`, 54, 24);
    ctx.fillStyle = '#758195';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('曲线是机制示意，不是从论文图中重新拟合的数值。', 520, 24);
    canvas.classList.add('is-ready');
  }, [selected, method.name]);

  return (
    <div ref={inspectorRef}>
      <div className="chip-row" role="group" aria-label="选择 Figure 1 中的先前方法病态">
        <button
          type="button"
          className={`tiny ${autoPlay ? '' : 'ghost'}`}
          aria-pressed={autoPlay}
          onClick={() => setAutoPlay((current) => !current)}
        >
          {autoPlay ? '暂停演示' : '自动演示'}
        </button>
        {methods.map((item, index) => (
          <button
            key={item.name}
            type="button"
            className={`chip ${selected === index ? 'selected' : ''}`}
            aria-pressed={selected === index}
            onClick={() => selectMethod(index)}
          >
            {item.name}
          </button>
        ))}
        <button
          type="button"
          className="tiny ghost"
          onClick={() => selectMethod((selected + 1) % methods.length)}
          aria-label="查看下一种记忆病态"
        >
          下一种
        </button>
      </div>

      <figure style={{ margin: '10px 0 0' }}>
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#ffffff', borderRadius: 4 }}>
          <img
            src={assetPath('images/fig-1-influence-kernels.png')}
            alt="原论文 Figure 1：不同流式三维重建方法的几何证据影响模式与长序列误差"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
          {showLayer && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${method.left}%`,
                top: '16%',
                width: `${method.width}%`,
                height: '52%',
                border: '3px solid #c66a16',
                boxShadow: '0 0 0 3px rgba(198,106,22,0.16)',
                borderRadius: 3,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
        <figcaption style={{ marginTop: 7, color: '#758195', fontSize: 13 }}>
          原论文 Figure 1。橙色边框仅用于定位当前面板，原图内容未被重画或修改。
        </figcaption>
      </figure>

      <div className="ctrl">
        <label>
          <input
            type="checkbox"
            checked={showLayer}
            onChange={(event) => setShowLayer(event.target.checked)}
          />
          显示读图定位层
        </label>
        <span style={{ marginLeft: 'auto', color: '#5e6978' }}>已检查 {seen.size} / {methods.length}</span>
      </div>
      <div className="hotspot-info" aria-live="polite">
        <strong style={{ color: '#c66a16' }}>{method.paperName}</strong>
        <div style={{ marginTop: 5, color: '#17202b' }}>{method.chain}</div>
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`${method.name}的影响核形状机制示意：${method.hint}`}
      />
      <div className={`feedback ${seen.size === methods.length ? 'good' : ''}`}>
        {seen.size === methods.length
          ? '共同问题已经显现：这些设计让历史影响随时间以不合理的形状变化。下一步要让不同证据拥有不同寿命。'
          : `${method.hint} 四类机制最终都指向“不同证据共用一种遗忘规则”这一根因。`}
      </div>
    </div>
  );
};

export default Chap03PathologyInspector;
