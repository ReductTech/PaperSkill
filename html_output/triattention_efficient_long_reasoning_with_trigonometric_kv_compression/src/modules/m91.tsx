import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 240;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BLUE = '#27446e', GREEN = '#228d5c', ORANGE = '#d97706', PURPLE = '#7c3aed', RED = '#c43f52';
const INK = '#21324a', MUT = '#68778f', LINE = '#d7deea', BG = '#f5f8f0';

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function panel(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 12): void {
  c.save();
  c.shadowColor = 'rgba(33, 50, 74, 0.08)';
  c.shadowBlur = 12;
  c.shadowOffsetY = 3;
  rr(c, x, y, w, h, r);
  c.fillStyle = '#ffffff';
  c.fill();
  c.restore();
  c.strokeStyle = LINE;
  c.lineWidth = 1;
  rr(c, x, y, w, h, r);
  c.stroke();
}

export const M91: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [R, setR] = useState(0.97);
  const RRef = useRef(0.97);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let c: CanvasRenderingContext2D;
    try { c = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const r = RRef.current;
      const snormW = 1 - r;
      const t = clamp((r - 0.3) / (0.98 - 0.3), 0, 1);
      c.clearRect(0, 0, W, H);
      c.fillStyle = BG;
      c.fillRect(0, 0, W, H);

      // 顶部标题
      c.textAlign = 'left';
      c.fillStyle = INK;
      c.font = `600 15px ${FONT}`;
      c.fillText('浓度 R 自适应', 20, 26);
      c.fillStyle = MUT;
      c.font = `12px ${FONT}`;
      c.fillText('R 高 → 主要靠距离偏好分；R 低 → 范数分多出力', 20, 43);

      // 左：浓度 R
      panel(c, 16, 52, 280, 172);
      c.fillStyle = INK;
      c.font = `600 13px ${FONT}`;
      c.fillText('浓度 R（Q 向量聚集程度）', 30, 74);
      c.fillStyle = r > 0.8 ? GREEN : r < 0.5 ? RED : BLUE;
      c.font = `700 26px ${FONT}`;
      c.fillText('R = ' + r.toFixed(2), 30, 108);
      // 计量条
      const mx = 30, mw = 244, my = 128, mh = 14;
      rr(c, mx, my, mw, mh, 7);
      c.fillStyle = '#eef1f5';
      c.fill();
      c.strokeStyle = LINE;
      c.lineWidth = 1;
      rr(c, mx, my, mw, mh, 7);
      c.stroke();
      if (t > 0.01) {
        rr(c, mx, my, Math.max(12, mw * t), mh, 7);
        c.fillStyle = BLUE;
        c.fill();
      }
      // 指针
      const px = mx + mw * t;
      c.beginPath(); c.arc(px, my + mh / 2, 7, 0, Math.PI * 2);
      c.fillStyle = '#ffffff'; c.fill();
      c.lineWidth = 2.5; c.strokeStyle = ORANGE; c.stroke();
      // 刻度
      c.fillStyle = MUT;
      c.font = `9px ${FONT}`;
      c.textAlign = 'center';
      [0.3, 0.5, 0.7, 0.9, 1.0].forEach((v) => {
        const tx = mx + ((v - 0.3) / 0.7) * mw;
        c.fillText(v.toFixed(1), tx, my + mh + 14);
      });
      c.textAlign = 'left';
      // 状态说明
      c.font = `11px ${FONT}`;
      c.fillStyle = r > 0.8 ? GREEN : r < 0.5 ? RED : '#8b97ab';
      c.fillText(r > 0.8 ? '聚集很好：几乎全靠距离偏好分' : r < 0.5 ? '聚集较弱：范数分明显多出力' : '介于两者之间：两个分共同起作用', 30, 186);

      // 右：分数贡献
      panel(c, 312, 52, 232, 172);
      c.fillStyle = INK;
      c.font = `600 13px ${FONT}`;
      c.fillText('分数贡献（示意）', 326, 74);
      // S_trig 行
      c.fillStyle = MUT;
      c.font = `11px ${FONT}`;
      c.fillText('S_trig 距离偏好分', 326, 92);
      rr(c, 326, 98, 204, 22, 6);
      c.fillStyle = '#eef1f5';
      c.fill();
      c.strokeStyle = LINE;
      c.lineWidth = 1;
      rr(c, 326, 98, 204, 22, 6);
      c.stroke();
      rr(c, 326, 98, 204, 22, 6);
      c.fillStyle = BLUE;
      c.fill();
      c.fillStyle = '#ffffff';
      c.font = `700 11px ${FONT}`;
      c.textAlign = 'right';
      c.fillText('×1.00（不缩放）', 520, 114);
      c.textAlign = 'left';
      // S_norm 行
      c.fillStyle = MUT;
      c.font = `11px ${FONT}`;
      c.fillText('S_norm 缩放系数 ×(1−R) = ' + snormW.toFixed(2), 326, 134);
      rr(c, 326, 140, 204, 22, 6);
      c.fillStyle = '#f2eefb';
      c.fill();
      c.strokeStyle = LINE;
      c.lineWidth = 1;
      rr(c, 326, 140, 204, 22, 6);
      c.stroke();
      const nw = Math.max(4, 204 * snormW);
      rr(c, 326, 140, nw, 22, 6);
      c.fillStyle = PURPLE;
      c.fill();
      c.font = `700 11px ${FONT}`;
      if (nw > 46) {
        c.textAlign = 'right';
        c.fillStyle = '#ffffff';
        c.fillText('×' + snormW.toFixed(2), 326 + nw - 8, 156);
        c.textAlign = 'left';
      } else {
        c.fillStyle = PURPLE;
        c.fillText('×' + snormW.toFixed(2), 326 + nw + 6, 156);
      }
      // 底部说明
      c.fillStyle = MUT;
      c.font = `11px ${FONT}`;
      c.fillText(r > 0.8 ? 'R 高 → 几乎全靠距离偏好分' : r < 0.5 ? 'R 低 → 范数分多出力' : '两个分按 (1−R) 自动配比', 326, 186);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    RRef.current = v;
    setR(v);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>浓度 R <span className="val">{R.toFixed(2)}</span></label>
        <input type="range" min={30} max={98} value={Math.round(R * 100)} onChange={onChange} style={{ flex: 1 }} />
      </div>
      <div className={`feedback ${R > 0.8 ? 'good' : R < 0.5 ? 'bad' : 'guide'}`}>
        {R > 0.8 ? 'R=' + R.toFixed(2) + '：聚集很好，S_norm 缩放系数仅 ' + (1 - R).toFixed(2) + '，几乎全靠距离偏好分（示意）。' : R < 0.5 ? 'R=' + R.toFixed(2) + '：聚集较弱，S_norm 缩放系数升至 ' + (1 - R).toFixed(2) + '，范数分多出力（示意）。' : '调节浓度 R，观察两个分数如何自动配比。'}
      </div>
    </div>
  );
};

export default M91;
