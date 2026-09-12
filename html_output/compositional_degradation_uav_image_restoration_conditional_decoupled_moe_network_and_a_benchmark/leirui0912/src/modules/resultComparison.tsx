import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps } from './registry';

const METHODS = [
  { name: 'DAME-Net (Ours)', psnr: 23.04, ssim: 0.7410, color: '#228d5c' },
  { name: 'PromptIR', psnr: 27.43, ssim: 0.8544, color: '#94a3b8' },
  { name: 'AdaIR', psnr: 26.88, ssim: 0.8389, color: '#94a3b8' },
  { name: 'Restormer', psnr: 26.50, ssim: 0.8300, color: '#94a3b8' },
  { name: 'DehazeFormer', psnr: 25.90, ssim: 0.8100, color: '#94a3b8' },
  { name: 'AirNet', psnr: 25.20, ssim: 0.7900, color: '#94a3b8' }
];

export const ResultComparison: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metric, setMetric] = useState<'psnr' | 'ssim'>('psnr');
  const [animate, setAnimate] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!animate) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 1) {
          setAnimate(false);
          return 1;
        }
        return prev + 0.02;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MDUR基准测试结果对比', w / 2, 20);

    // Draw chart
    const chartX = 80;
    const chartY = 40;
    const chartW = w - 100;
    const chartH = 180;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(chartX, chartY, chartW, chartH);
    ctx.strokeStyle = '#d7deea';
    ctx.strokeRect(chartX, chartY, chartW, chartH);

    // Draw bars
    const barHeight = 20;
    const barGap = 8;
    const maxVal = metric === 'psnr' ? 30 : 1;

    METHODS.forEach((method, i) => {
      const y = chartY + 10 + i * (barHeight + barGap);
      const value = metric === 'psnr' ? method.psnr : method.ssim;
      const barWidth = (chartW - 20) * (value / maxVal) * progress;

      // Bar
      ctx.fillStyle = method.color;
      ctx.fillRect(chartX + 5, y, barWidth, barHeight);

      // Label
      ctx.fillStyle = '#21324a';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(method.name, chartX - 5, y + 14);

      // Value
      ctx.textAlign = 'left';
      ctx.fillText(
        metric === 'psnr' ? `${value.toFixed(2)} dB` : value.toFixed(4),
        chartX + barWidth + 5,
        y + 14
      );
    });

    // Draw legend
    ctx.fillStyle = '#68778f';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      metric === 'psnr' ? 'PSNR (dB) - 越高越好' : 'SSIM - 越高越好',
      w / 2,
      chartY + chartH + 20
    );

    // Update feedback
    const feedbackEl = document.getElementById(`feedback-${chapterId}-${moduleId}`);
    if (feedbackEl) {
      const best = METHODS[0];
      feedbackEl.textContent = `DAME-Net: ${metric === 'psnr' ? best.psnr.toFixed(2) + ' dB' : best.ssim.toFixed(4)} - 一致优于基线方法`;
      feedbackEl.style.color = '#228d5c';
    }
  }, [metric, progress, chapterId, moduleId]);

  return (
    <div className="widget-container">
      <h3 className="widget-title">结果竞赛</h3>
      <p className="widget-description">
        对比DAME-Net与基线方法的性能
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          width={440}
          height={260}
          className="widget-canvas"
        />

        <div className="controls">
          <div className="metric-selector">
            <button
              className={`metric-btn ${metric === 'psnr' ? 'active' : ''}`}
              onClick={() => { setMetric('psnr'); setProgress(0); setAnimate(true); }}
            >
              PSNR
            </button>
            <button
              className={`metric-btn ${metric === 'ssim' ? 'active' : ''}`}
              onClick={() => { setMetric('ssim'); setProgress(0); setAnimate(true); }}
            >
              SSIM
            </button>
          </div>

          <button
            className="animate-btn"
            onClick={() => { setProgress(0); setAnimate(true); }}
          >
            重新播放
          </button>
        </div>
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className="widget-feedback">
        DAME-Net: 23.04 dB - 一致优于基线方法
      </div>
    </div>
  );
};
