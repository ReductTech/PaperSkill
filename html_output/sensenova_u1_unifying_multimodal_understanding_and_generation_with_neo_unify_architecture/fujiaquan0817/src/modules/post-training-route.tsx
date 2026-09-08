import React, { useCallback, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearStudio, drawDesk, drawGuide, drawLabel, useObservedCanvas } from './studio-kit';

const W = 960;
const H = 520;
type Mode = 'stage5' | 'stage6';

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, value: string, color: string) {
  ctx.fillStyle = C.white; ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 11); ctx.fill(); ctx.stroke();
  drawLabel(ctx, title, x + w / 2, y + 26, color, 13, 'center');
  drawLabel(ctx, value, x + w / 2, y + 57, C.text, 11.5, 'center');
}

export const PostTrainingRoute: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('stage5');

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    clearStudio(ctx, W, H);
    drawDesk(ctx, W, H, 466);
    drawLabel(ctx, 'Stage 5–6：质量优化与采样加速', 28, 30, C.text, 18);
    drawLabel(ctx, mode === 'stage5' ? '当前：Stage 5 · T2I 后训练' : '当前：Stage 6 · CFG 与步数蒸馏', 932, 30, mode === 'stage5' ? C.control : C.aux, 12.5, 'right');

    if (mode === 'stage5') {
      panel(ctx, 34, 82, 258, 94, '动态分辨率热身', '先易后难地开放分辨率', C.control);
      panel(ctx, 351, 82, 258, 94, 'Flow-GRPO 多奖励', 'OCR · 风格 · 审美', C.success);
      panel(ctx, 668, 82, 258, 94, '冻结部分生成末层', '缓解网格伪影', C.aux);
      drawGuide(ctx, 292, 129, 351, 129, C.control);
      drawGuide(ctx, 609, 129, 668, 129, C.success);

      ctx.fillStyle = C.white; ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(34, 214, 892, 186, 12); ctx.fill(); ctx.stroke();
      drawLabel(ctx, '奖励组按 epoch 交替', 58, 242, C.text, 14);
      drawLabel(ctx, '组 1：文本渲染 rocr + 0.5 × 风格 rsty', 72, 278, C.current, 13);
      drawLabel(ctx, '组 2：HPSv3 审美/偏好 raes', 72, 313, C.success, 13);
      drawLabel(ctx, '8B：1600 epochs；A3B：200 epochs，论文明确说明仍有提升空间', 72, 350, C.muted, 12);
      drawLabel(ctx, '限制：作者“推测”独立预测 32×32 patch 与网格伪影有关，提出 PixelShuffle + Conv 作为未来方向。', 72, 382, C.failure, 11.5);
    } else {
      panel(ctx, 38, 92, 212, 104, '生成器 G', '被蒸馏的生成模型', C.success);
      panel(ctx, 374, 92, 212, 104, '假流模型 F', '估计当前生成分布', C.aux);
      panel(ctx, 710, 92, 212, 104, '教师 T', '目标数据分布得分', C.current);
      drawGuide(ctx, 250, 144, 374, 144, C.success);
      drawGuide(ctx, 586, 144, 710, 144, C.aux);

      ctx.fillStyle = C.white; ctx.strokeStyle = C.aux; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(74, 238, 812, 132, 12); ctx.fill(); ctx.stroke();
      drawLabel(ctx, '教师采样设置', 164, 270, C.muted, 12, 'center');
      drawLabel(ctx, '100 NFE', 164, 314, C.current, 24, 'center');
      drawLabel(ctx, 'DMD2', 480, 305, C.aux, 24, 'center');
      drawLabel(ctx, '→', 480, 337, C.muted, 22, 'center');
      drawLabel(ctx, '蒸馏后生成器', 796, 270, C.muted, 12, 'center');
      drawLabel(ctx, '8 NFE', 796, 314, C.success, 24, 'center');
      drawLabel(ctx, '只更新生成侧；T2I、编辑与交错数据联合用于蒸馏', 480, 395, C.text, 12.5, 'center');
    }
    drawLabel(ctx, mode === 'stage5' ? '优化目标：生成质量与偏好' : '优化目标：函数评估次数（NFE）', 480, 446, mode === 'stage5' ? C.control : C.aux, 14, 'center');
  }, [mode]);

  useObservedCanvas(canvasRef, W, H, draw);
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} tabIndex={0}
        aria-label={mode === 'stage5' ? 'Stage 5 生成后训练：动态分辨率、多奖励和网格伪影边界' : 'Stage 6 DMD2：生成器、假流模型和教师，从100 NFE到8 NFE'}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') setMode((value) => value === 'stage5' ? 'stage6' : 'stage5');
        }} />
      <div className="ctrl" role="radiogroup" aria-label="选择后训练阶段">
        <button type="button" role="radio" aria-checked={mode === 'stage5'} onClick={() => setMode('stage5')}>Stage 5 · 质量后训练</button>
        <button type="button" role="radio" aria-checked={mode === 'stage6'} onClick={() => setMode('stage6')}>Stage 6 · DMD2 蒸馏</button>
      </div>
      <div className={`feedback ${mode === 'stage6' ? 'good' : ''}`} aria-live="polite">
        {mode === 'stage5'
          ? 'Stage 5 使用动态分辨率热身与 OCR、风格、审美奖励改善 T2I；网格伪影的成因是论文提出的可能解释。'
          : 'Stage 6 只优化生成侧，用 DMD2 将论文报告的图像合成设置从 100 NFE 压缩到 8 NFE；NFE 不是质量分数。'}
      </div>
      <p className="note">论文依据：pp.10–12，§3.4 Stage 5–6，Eq.7–9。Stage 5 与 Stage 6 的训练目标、更新对象和结果指标不同，因此必须分开解释。</p>
    </div>
  );
};

export default PostTrainingRoute;
