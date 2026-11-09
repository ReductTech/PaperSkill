import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  addGaussianNoise,
  addSensorNoise,
  createReferenceImage,
  downsample,
  drawHistogram,
  drawImageTo,
  jpegCompress,
  px,
} from './bsrganKit';

type Mode = 'gaussian' | 'jpeg' | 'sensor';

function drawCrop(canvas: HTMLCanvasElement, data: ImageData, cx: number, cy: number, cw: number, ch: number): void {
  const sx = Math.max(0, Math.min(data.width - cw, Math.round(cx - cw / 2)));
  const sy = Math.max(0, Math.min(data.height - ch, Math.round(cy - ch / 2)));
  const tmp = document.createElement('canvas');
  tmp.width = cw;
  tmp.height = ch;
  const tctx = tmp.getContext('2d');
  if (!tctx) return;
  tctx.putImageData(data, -sx, -sy);
  const scale = 4;
  canvas.width = cw * scale;
  canvas.height = ch * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, cw, ch, 0, 0, cw * scale, ch * scale);
  canvas.style.imageRendering = 'pixelated';
}

export function Ch2Noise(_props: WidgetProps) {
  const [mode, setMode] = useState<Mode>('gaussian');
  const [sigma, setSigma] = useState(8);
  const [quality, setQuality] = useState(60);
  const [iso, setIso] = useState(1600);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef<HTMLCanvasElement>(null);
  const histRef = useRef<HTMLCanvasElement>(null);
  const hr = useMemo(() => createReferenceImage(320, 240), []);
  const base = useMemo(() => downsample(hr, 2, 'bicubic'), [hr]);
  const noisy = useMemo(() => {
    if (mode === 'gaussian') return addGaussianNoise(base, sigma, 23);
    if (mode === 'jpeg') return jpegCompress(base, quality);
    return addSensorNoise(base, iso, 29);
  }, [base, mode, sigma, quality, iso]);

  useEffect(() => {
    if (canvasRef.current) drawImageTo(canvasRef.current, noisy, false);
    if (zoomRef.current) drawCrop(zoomRef.current, noisy, 72, 52, 40, 30);
    if (histRef.current) drawHistogram(histRef.current, noisy, mode === 'jpeg' ? '#c43f52' : '#27446e');
  }, [noisy, mode]);

  const feedback = mode === 'gaussian'
    ? sigma < 4
      ? '高斯噪声很弱，样张接近干净的下采样结果。'
      : '高斯噪声是均匀颗粒，亮部与暗部的强度相近；论文用 3D 协方差模型覆盖通道相关与灰度噪声。'
    : mode === 'jpeg'
      ? quality > 90
        ? '质量因子大于 90 时，论文指出几乎没有明显伪影；把质量拉到 30–50 看看 8×8 块。'
        : 'JPEG 在 8×8 块边界产生块效应；论文在 [30,95] 采样质量，并以 0.75/1 的概率执行两次压缩。'
      : '传感器噪声更依赖信号强度，暗部更脏、颜色也更容易偏；论文用反向–正向 ISP 与 RAW 噪声模型合成，本页是简化示意。';

  return (
    <div className="bsr-ch2-noise">
      <section className="bsr-noise-panel">
        <div className="bsr-panel-head"><span>LR 样张</span><b>{mode === 'gaussian' ? `σ=${sigma}/255` : mode === 'jpeg' ? `q=${quality}` : `ISO ${iso}`}</b></div>
        <div className="bsr-noise-stage">
          <canvas ref={canvasRef} className="bsr-image" aria-label="带噪声的低分辨率样张" />
          {mode === 'jpeg' && <div className="bsr-jpeg-grid" aria-hidden="true" />}
        </div>
        <div className="bsr-zoom-row">
          <div>
            <span className="bsr-mini-label">细节放大</span>
            <canvas ref={zoomRef} className="bsr-zoom" aria-label="噪声细节放大" />
          </div>
          <div>
            <span className="bsr-mini-label">亮度直方图</span>
            <canvas ref={histRef} className="bsr-hist" width="300" height="132" aria-label="当前样张的亮度直方图" />
          </div>
        </div>
      </section>
      <section className="bsr-noise-side">
        <div className="bsr-toggle-row" role="group" aria-label="噪声类型">
          <button className={mode === 'gaussian' ? 'is-on' : ''} aria-pressed={mode === 'gaussian'} onClick={() => setMode('gaussian')}>高斯</button>
          <button className={mode === 'jpeg' ? 'is-on' : ''} aria-pressed={mode === 'jpeg'} onClick={() => setMode('jpeg')}>JPEG</button>
          <button className={mode === 'sensor' ? 'is-on' : ''} aria-pressed={mode === 'sensor'} onClick={() => setMode('sensor')}>传感器</button>
        </div>
        {mode === 'gaussian' && (
          <label className="bsr-slider">
            <span>噪声强度 σ</span><b>{sigma}/255</b>
            <input type="range" min="1" max="25" step="1" value={sigma} onChange={(e) => setSigma(Number(e.target.value))} />
          </label>
        )}
        {mode === 'jpeg' && (
          <label className="bsr-slider">
            <span>JPEG 质量因子</span><b>{quality}</b>
            <input type="range" min="30" max="95" step="1" value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
          </label>
        )}
        {mode === 'sensor' && (
          <label className="bsr-slider">
            <span>ISO（教学刻度）</span><b>{iso}</b>
            <input type="range" min="100" max="6400" step="100" value={iso} onChange={(e) => setIso(Number(e.target.value))} />
          </label>
        )}
        <div className="bsr-noise-signature">
          <span className={`bsr-dot ${mode}`} />
          <p>{mode === 'gaussian' ? '均匀颗粒，通道可独立或相关。' : mode === 'jpeg' ? '8×8 块边界与颜色断层。' : '暗部颗粒更重，带通道增益。'}</p>
        </div>
        <p className={`bsr-feedback ${mode === 'jpeg' && quality < 45 ? 'is-red' : 'is-blue'}`}>{feedback}</p>
        <p className="bsr-note">论文：高斯 σ∈1/255–25/255；JPEG q∈[30,95]；传感器噪声概率 0.25。本页为简化实现。</p>
      </section>
    </div>
  );
}
