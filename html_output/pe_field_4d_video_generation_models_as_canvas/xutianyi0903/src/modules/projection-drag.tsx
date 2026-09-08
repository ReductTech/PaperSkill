import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp } from '../lib/canvasKit';
import { C, clearStage, drawCamera, drawSceneLabel, startObservedLoop } from './stage-analogy';

type StageIndex = 0 | 1 | 2 | 3 | 4 | 5;

const STAGES = [
  {
    short: '1 ViPE测量',
    title: 'ViPE 得到源视频几何',
    formula: 'Dₛ(u,v),   Kₛ,   camera motion / pose',
    detail: 'PE-Field 4D 的实现部分明确写出：MultiCam没有真值深度，因此作者使用ViPE估计深度和相机参数。ViPE原论文也明确其输出包含稠密近度量深度、相机内参与相机运动。',
    boundary: '讲解统一把源位姿记成 Tₛᶜ²ʷ；这是坐标约定。若实际接口给出 world-to-camera 或其他 convention，需要先转换。',
    evidence: '论文明确输出；位姿方向是讲解约定',
  },
  {
    short: '2 反投影',
    title: '源像素反投影到源相机三维点',
    formula: 'p̃ₛ=[uₛ,vₛ,1]ᵀ,   Xₛᶜ=Dₛ(uₛ,vₛ)Kₛ⁻¹p̃ₛ',
    detail: '每个带深度的源像素或对应token都沿相机射线反投影，得到源相机坐标系中的三维点 Xₛᶜ=(Xₛ,Yₛ,Zₛ)。不是把一整张二维图一次性塞进世界坐标。',
    boundary: '这是标准针孔相机几何推导；PE-Field 4D正文只概括为“使用源视角几何计算目标平面投影”，没有逐式展开。',
    evidence: '标准多视图几何推导',
  },
  {
    short: '3 世界坐标',
    title: '把源相机点转换到世界坐标',
    formula: 'X_w=Tₛᶜ²ʷ[Xₛᶜ;1],   𝒫ₛ={X_w(u,v)}',
    detail: '同一帧中所有有效深度像素分别转换后，形成该时刻的瞬时三维点集。这样参考内容不仅知道“长什么样”，还拥有可被新相机重新观察的三维位置。',
    boundary: '点集𝒫ₛ是帮助理解的标准几何表述；论文没有宣称先重建一个完整、可直接渲染的全局4D场。',
    evidence: '标准推导；不要升级成完整4D重建',
  },
  {
    short: '4 目标相机',
    title: '把世界点变换到用户指定的目标相机',
    formula: 'Xₜᶜ=(Tₜtarget,c2w)⁻¹X_w,   Xₜᶜ=[Xₜ,Yₜ,Zₜ]ᵀ,   d_target=Zₜ（本页实现选择）',
    detail: '用户给出第t时刻的目标相机轨迹。同一世界点换到该相机坐标系后，位置会随目标相机旋转和平移改变；若采用常见针孔约定，Zₜ就是目标相机方向上的深度。',
    boundary: '相对变换ΔTₜ与基准位姿的左右乘顺序取决于坐标和主动/被动变换约定，页面不把某一种乘法顺序说成普遍规则。',
    evidence: '标准变换；组合顺序依赖 convention',
  },
  {
    short: '5 目标地址',
    title: '投影到目标画面并换算为 context token 的 RoPE 地址',
    formula: 'K_target=[fₓ,0,cₓ;0,fᵧ,cᵧ;0,0,1],  uₜ=fₓXₜ/Zₜ+cₓ,  vₜ=fᵧYₜ/Zₜ+cᵧ,  h̃=vₜ/Sₕ,  w̃=uₜ/S_w  →  pᵧ=(t+Δ(d),h̃,w̃)',
    detail: '目标像素位置再按VAE/patch网格尺度换算成(h̃,w̃)，参考token的视觉内容保持不变，只把位置编码写成目标视角地址。论文明确把深度偏移归一化到[0,0.1]并加到时间轴。',
    boundary: '正文只写“token深度d”，没有说明它固定取源深度还是目标相机Zₜ；采用目标视角Zₜ更符合前后遮挡直觉，但应标为实现选择。具体stride、取整与偏移也未展开。',
    evidence: '投影PE与Δ(d)属论文明确；矩阵细节属标准推导',
  },
  {
    short: '6 边界',
    title: '前向投影不是直接渲染一张完整目标深度图',
    formula: '(uₛ,vₛ) → (uₜ,vₜ)  给RoPE地址；缺失/冲突内容 → Attention + diffusion先验',
    detail: '源token前向投影后，目标新显露区域可能没有任何token落入；多个源token也可能落到相近目标方格。Δ(d)用于给前后层不同地址，但它本身不是严格的可见性裁剪或目标图像渲染器。',
    boundary: '论文正文没有说明是否还使用独立z-buffer或可见性裁剪，因此准确说法是“正文未交代”，不能直接断言完全没有。',
    evidence: '生成而非直接渲染属方法语义；z-buffer状态正文未说明',
  },
] as const;

function projectExample(yaw: number) {
  const sourceU = .58;
  const sourceV = .44;
  const depth = 4;
  const focal = .9;
  const sourceX = (sourceU - .5) * depth / focal;
  const sourceY = (sourceV - .5) * depth / focal;
  const rad = yaw * Math.PI / 180;
  const targetX = Math.cos(rad) * sourceX - Math.sin(rad) * depth;
  const targetZ = Math.max(.35, Math.sin(rad) * sourceX + Math.cos(rad) * depth);
  return {
    sourceU,
    sourceV,
    depth,
    sourceX,
    sourceY,
    targetX,
    targetY: sourceY,
    targetZ,
    targetU: .5 + focal * targetX / targetZ,
    targetV: .5 + focal * sourceY / targetZ,
  };
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, active: boolean) {
  ctx.fillStyle = C.white;
  ctx.strokeStyle = active ? C.blue : C.line;
  ctx.lineWidth = active ? 2.4 : 1.3;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 9); ctx.fill(); ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, active: boolean) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = active ? C.blue : 'rgba(76,89,101,.38)';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = active ? 2.6 : 1.6;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - .45) * 9, y2 - Math.sin(angle - .45) * 9);
  ctx.lineTo(x2 - Math.cos(angle + .45) * 9, y2 - Math.sin(angle + .45) * 9);
  ctx.closePath(); ctx.fill();
}

function drawImageGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pointU: number,
  pointV: number,
  active: boolean,
) {
  ctx.fillStyle = '#f2f1ee'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(56,67,77,.25)'; ctx.lineWidth = 1;
  for (let col = 0; col <= 6; col += 1) {
    ctx.beginPath(); ctx.moveTo(x + col * w / 6, y); ctx.lineTo(x + col * w / 6, y + h); ctx.stroke();
  }
  for (let row = 0; row <= 5; row += 1) {
    ctx.beginPath(); ctx.moveTo(x, y + row * h / 5); ctx.lineTo(x + w, y + row * h / 5); ctx.stroke();
  }
  const px = x + clamp(pointU, 0, 1) * w;
  const py = y + clamp(pointV, 0, 1) * h;
  ctx.fillStyle = active ? C.blue : '#596775';
  ctx.beginPath(); ctx.arc(px, py, active ? 8 : 6, 0, Math.PI * 2); ctx.fill();
}

function drawStageHeader(ctx: CanvasRenderingContext2D, stage: StageIndex) {
  STAGES.forEach((item, index) => {
    const x = 15 + index * 150;
    ctx.fillStyle = index === stage ? 'rgba(39,68,110,.13)' : index < stage ? 'rgba(34,141,92,.08)' : C.white;
    ctx.strokeStyle = index === stage ? C.blue : C.line;
    ctx.lineWidth = index === stage ? 2.2 : 1.2;
    ctx.beginPath(); ctx.roundRect(x, 14, 137, 48, 8); ctx.fill(); ctx.stroke();
    drawSceneLabel(ctx, item.short, x + 68.5, 43, C.ink, 'center');
    if (index < STAGES.length - 1) arrow(ctx, x + 137, 38, x + 148, 38, index < stage);
  });
}

export const ProjectionDrag: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<StageIndex>(0);
  const yawRef = useRef(18);
  const [stage, setStage] = useState<StageIndex>(0);
  const [yaw, setYaw] = useState(18);

  const chooseStage = (next: number) => {
    const clamped = clamp(next, 0, 5) as StageIndex;
    stageRef.current = clamped;
    setStage(clamped);
  };

  const chooseYaw = (next: number) => {
    yawRef.current = next;
    setYaw(next);
  };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startObservedLoop(canvas, 920, 420, ctx => {
      const currentStage = stageRef.current;
      const projection = projectExample(yawRef.current);
      clearStage(ctx, 920, 420);
      drawStageHeader(ctx, currentStage);

      panel(ctx, 16, 83, 248, 284, currentStage <= 1);
      panel(ctx, 280, 83, 350, 284, currentStage >= 2 && currentStage <= 3);
      panel(ctx, 646, 83, 258, 284, currentStage >= 4);
      drawSceneLabel(ctx, '源视频第s帧', 140, 108, C.ink, 'center');
      drawImageGrid(ctx, 36, 128, 208, 154, projection.sourceU, projection.sourceV, currentStage <= 1);
      drawSceneLabel(ctx, `Dₛ=${projection.depth.toFixed(1)}`, 47, 307, C.ink);
      drawSceneLabel(ctx, 'Kₛ', 47, 329, C.ink);
      drawSceneLabel(ctx, 'Tₛᶜ²ʷ（统一约定）', 47, 351, C.ink);

      drawSceneLabel(ctx, '源相机 → 世界 → 目标相机', 455, 108, C.ink, 'center');
      drawCamera(ctx, 325, 306, C.blue, .58);
      drawSceneLabel(ctx, '源相机', 325, 337, C.ink, 'center');
      const pointX = 455;
      const pointY = 184;
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(pointX, pointY, 9, 0, Math.PI * 2); ctx.fill();
      drawSceneLabel(ctx, currentStage < 2 ? 'Xₛᶜ' : 'X_w', pointX, pointY - 18, C.ink, 'center');
      arrow(ctx, 336, 290, pointX - 12, pointY + 10, currentStage >= 1);
      ctx.strokeStyle = 'rgba(33,47,66,.30)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(455, 345); ctx.lineTo(455, 132); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(355, 260); ctx.lineTo(560, 260); ctx.stroke();
      drawSceneLabel(ctx, 'Y', 455, 129, C.ink, 'center');
      drawSceneLabel(ctx, 'X / Z', 574, 264, C.ink);
      const targetCameraX = 567 + yawRef.current * .7;
      drawCamera(ctx, targetCameraX, 306, C.blue, .58);
      drawSceneLabel(ctx, '目标相机 Tₜ', targetCameraX, 337, C.ink, 'center');
      ctx.save(); ctx.translate(targetCameraX, 306); ctx.rotate(-yawRef.current * Math.PI / 180);
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-58, -54); ctx.stroke(); ctx.restore();
      arrow(ctx, pointX + 12, pointY + 9, targetCameraX - 12, 287, currentStage >= 3);

      drawSceneLabel(ctx, '目标画面 / latent网格', 775, 108, C.ink, 'center');
      drawImageGrid(ctx, 666, 128, 218, 154, projection.targetU, projection.targetV, currentStage >= 4);
      const projectedVisible = projection.targetU >= 0 && projection.targetU <= 1 && projection.targetV >= 0 && projection.targetV <= 1;
      if (currentStage === 5) {
        ctx.fillStyle = 'rgba(95,106,116,.12)';
        [[0, 0], [4, 0], [5, 1], [0, 4], [3, 4]].forEach(([col, row]) => {
          ctx.fillRect(666 + col * 218 / 6, 128 + row * 154 / 5, 218 / 6, 154 / 5);
        });
        const collisionX = 666 + 4.5 * 218 / 6;
        const collisionY = 128 + 2.5 * 154 / 5;
        ctx.fillStyle = C.red;
        ctx.beginPath(); ctx.arc(collisionX - 5, collisionY, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(collisionX + 5, collisionY, 6, 0, Math.PI * 2); ctx.fill();
        drawSceneLabel(ctx, '空洞', 681, 306, C.ink);
        drawSceneLabel(ctx, '冲突', 837, 306, C.ink);
      }
      drawSceneLabel(ctx, `dₜ=Zₜ=${projection.targetZ.toFixed(2)}`, 665, 329, C.ink);
      drawSceneLabel(ctx, `uₜ=${projection.targetU.toFixed(2)}, vₜ=${projection.targetV.toFixed(2)}`, 665, 351, C.ink);
      arrow(ctx, 630, 224, 646, 224, currentStage >= 4);

      ctx.fillStyle = 'rgba(25,31,38,.06)';
      ctx.beginPath(); ctx.roundRect(110, 383, 700, 25, 6); ctx.fill();
      drawSceneLabel(
        ctx,
        projectedVisible
          ? '(Dₛ,uₛ,vₛ) → Xₛᶜ → X_w → Xₜᶜ → (dₜ,uₜ,vₜ) → pᵧ'
          : '当前点投影到画外：仍能计算地址，但目标可见区域需要生成模型补全',
        460,
        401,
        C.ink,
        'center',
      );
    });
  }, []);

  const current = STAGES[stage];
  const projection = projectExample(yaw);

  return (
    <div className="geometry-pipeline">
      <div className="method-canvas-scroll">
        <canvas ref={ref} width={920} height={420} aria-label="从ViPE源视频几何到目标context token位置编码的六步交互流水线" />
      </div>
      <div className="ctrl geometry-stage-controls">
        {STAGES.map((item, index) => (
          <button type="button" key={item.short} className={`chip ${stage === index ? 'selected' : ''}`} onClick={() => chooseStage(index)}>{item.short}</button>
        ))}
      </div>
      <div className="walk-param-grid">
        <label className="walk-param">目标相机角度<input aria-label="几何流水线目标相机角度" type="range" min="-25" max="30" step="1" value={yaw} onInput={event => chooseYaw(Number(event.currentTarget.value))} /><output>{yaw > 0 ? '+' : ''}{yaw}°</output></label>
        <div className="walk-param"><span>当前目标坐标</span><span>Xₜ={projection.targetX.toFixed(2)}, Zₜ={projection.targetZ.toFixed(2)}</span><output>t</output></div>
      </div>
      <div className="geometry-step-card">
        <div className="geometry-step-head"><span>第{stage + 1}步</span><strong>{current.title}</strong><span>{current.evidence}</span></div>
        <div className="geometry-formula">{current.formula}</div>
        <p>{current.detail}</p>
        <div className="geometry-boundary"><b>证据边界：</b>{current.boundary}</div>
      </div>
      <div className="ctrl">
        <button type="button" className="chip" disabled={stage === 0} onClick={() => chooseStage(stage - 1)}>← 上一步</button>
        <button type="button" className="chip" disabled={stage === 5} onClick={() => chooseStage(stage + 1)}>下一步 →</button>
      </div>
      <div className="geometry-evidence-grid">
        <div><b>论文明确</b><span>目标视角二维投影、context token改写PE、Δ(d)∈[0,0.1]。</span></div>
        <div><b>标准推导</b><span>像素反投影、c2w/w2c换坐标、针孔投影与网格缩放。</span></div>
        <div><b>正文未说明</b><span>d采用哪一坐标系、精确stride/取整、是否额外执行z-buffer。</span></div>
      </div>
      <div className="geometry-summary-grid">
        <div><span>1</span><b>ViPE恢复源视频的逐帧三维几何</b></div>
        <div><span>2</span><b>目标相机轨迹把这些三维点重新投影到目标画面</b></div>
        <div><span>3</span><b>投影结果写成参考token的RoPE地址，而不是直接渲染目标图像</b></div>
      </div>
      <div className="feedback">
        最终不是直接渲染目标图像：几何投影只为参考token写RoPE地址；目标画面的缺失、冲突和新显露内容仍由Wan的Attention与diffusion生成先验处理。
      </div>
    </div>
  );
};

export default ProjectionDrag;
