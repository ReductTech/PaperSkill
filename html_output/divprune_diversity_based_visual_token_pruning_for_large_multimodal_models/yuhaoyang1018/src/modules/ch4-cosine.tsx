import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { prepCanvas, useCanvasBox, useTween } from '../lib/hooks';
import { C, FONT_SANS } from '../lib/palette';
import { Feedback, Slider } from '../ui/kit';

// 4.1 余弦距离 vs 欧氏距离：向量 a 固定为单位长度、指向右方；向量 b 可调夹角与长度。

export const Ch4Cosine: React.FC<WidgetProps> = () => {
  const [deg, setDeg] = useState(50);
  const [len, setLen] = useState(1);
  const last = useRef<'deg' | 'len' | null>(null);
  const prev = useRef({ cos: 0, l2: 0 });
  const th = (deg * Math.PI) / 180;
  const dc = 1 - Math.cos(th);
  const l2 = Math.hypot(1 - len * Math.cos(th), -len * Math.sin(th));
  const dcT = useTween(dc, 240);
  const l2T = useTween(l2, 240);

  const { wrapRef, canvasRef, w, h } = useCanvasBox((W) => Math.min(300, Math.max(210, W * 0.48)));

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !w) return;
    const ctx = prepCanvas(c, w, h);
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const ox = w / 2;
    const oy = h - 28;
    const unit = Math.min(w / 2 - 24, h - 48) / 1.6;
    // 单位圆弧
    ctx.strokeStyle = C.rule;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(ox, oy, unit, Math.PI, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = C.faint;
    ctx.beginPath();
    ctx.moveTo(ox - unit * 1.6, oy);
    ctx.lineTo(ox + unit * 1.6, oy);
    ctx.stroke();
    const ax = ox + unit;
    const ay = oy;
    const bx = ox + Math.cos(th) * unit * len;
    const by = oy - Math.sin(th) * unit * len;
    // 欧氏距离（虚线）
    ctx.strokeStyle = C.mustard;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.setLineDash([]);
    // 夹角
    ctx.strokeStyle = C.verm;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ox, oy, 30, -th, 0);
    ctx.stroke();
    const arrow = (x: number, y: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(x, y);
      ctx.stroke();
      const a = Math.atan2(y - oy, x - ox);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 10 * Math.cos(a - 0.4), y - 10 * Math.sin(a - 0.4));
      ctx.lineTo(x - 10 * Math.cos(a + 0.4), y - 10 * Math.sin(a + 0.4));
      ctx.closePath();
      ctx.fill();
    };
    arrow(ax, ay, C.ink);
    arrow(bx, by, C.cobalt);
    ctx.font = `600 13px ${FONT_SANS}`;
    ctx.fillStyle = C.ink;
    ctx.fillText('γ', ax + 6, ay - 6);
    ctx.fillStyle = C.cobaltD;
    ctx.fillText('ω', bx + (Math.cos(th) >= 0 ? 8 : -18), by - 6);
    ctx.fillStyle = C.vermD;
    ctx.fillText(`θ = ${deg}°`, ox + 34 * Math.cos(th / 2) + 4, oy - 34 * Math.sin(th / 2) - 2);
  }, [w, h, th, len, deg, canvasRef]);

  const onDeg = (v: number) => {
    prev.current = { cos: dc, l2 };
    last.current = 'deg';
    setDeg(v);
  };
  const onLen = (v: number) => {
    prev.current = { cos: dc, l2 };
    last.current = 'len';
    setLen(v);
  };

  let msg = '拖动两个滑块：先只改长度，再只改夹角，看哪一种距离会变。';
  let tone: 'info' | 'good' | 'warn' = 'info';
  if (last.current === 'len') {
    msg = `你刚改变的是 ω 的长度：欧氏距离变为 ${l2.toFixed(3)}，余弦距离仍是 ${dc.toFixed(3)}——方向没变，它就不变。`;
    tone = 'good';
  } else if (last.current === 'deg') {
    msg = `你刚改变的是夹角：余弦距离变为 ${dc.toFixed(3)}（${deg < 90 ? '小于 1，方向相近' : deg === 90 ? '正交时恰为 1' : '大于 1，方向相反'}）。${deg === 0 ? '方向完全相同时距离为 0，哪怕两个向量长度不同。' : ''}`;
    tone = deg === 0 ? 'warn' : 'info';
  }

  return (
    <div className="w">
      <div ref={wrapRef} className="cv">
        <canvas ref={canvasRef} role="img" aria-label={`夹角 ${deg} 度，ω 长度 ${len.toFixed(2)}，余弦距离 ${dc.toFixed(3)}，欧氏距离 ${l2.toFixed(3)}`} />
      </div>
      <div className="readouts">
        <div className="ro ro-verm">
          <span>余弦距离 1 − cos θ</span>
          <b>{dcT.toFixed(3)}</b>
        </div>
        <div className="ro ro-mustard">
          <span>欧氏距离 ‖γ − ω‖</span>
          <b>{l2T.toFixed(3)}</b>
        </div>
      </div>
      <div className="ctl-grid">
        <Slider label="夹角 θ" value={deg} min={0} max={180} onChange={onDeg} display={`${deg}°`} />
        <Slider label="ω 的长度（γ 固定为 1）" value={len} min={0.3} max={1.6} step={0.01} onChange={onLen} display={len.toFixed(2)} />
      </div>
      <Feedback tone={tone}>{msg}</Feedback>
      <p className="w-note">教学示意：二维向量。真实的视觉 token 是 4096 维，但余弦距离“只看方向”的性质与维度无关。</p>
    </div>
  );
};

export default Ch4Cosine;
