import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, easeOutCubic, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', line: '#d7deea', ink: '#21324a', muted: '#68778f',
  blue: '#27446e', green: '#228d5c', orange: '#d97706', purple: '#7c3aed', red: '#c43f52', white: '#ffffff',
  sky: '#dceaf6', dark: '#17243a',
};

const PROJECT_URL = 'https://3d-models.hunyuan.tencent.com/world/';

const stages = [
  {
    id: 'pano', name: 'HY-Pano 2.0', short: '全景初始化',
    title: '把透视线索展开为首尾相接的 360° 世界种子',
    input: '文本提示或单张参考图',
    action: '在统一潜空间学习透视图到 ERP 的对应，并用循环填充与像素融合处理左右边界。',
    result: '得到带全局上下文的连续全景，后续规划器能够从中心向四周判断盲区。',
    why: '普通透视图只有有限视场；全景先补齐方向上下文，才能规划环绕、远端或俯视路线。',
    evidence: '论文 Section 3.1-3.2、Figure 3；全景质量按表 4 的 I2P / T2P 子协议阅读。',
    media: { src: '/images/official-stage-pano.webp', alt: 'HY-Pano 2.0 官方架构图，展示隐式映射、循环填充和像素融合', title: '官方图：全景生成与双层接缝修复', caption: '图中同时展示真实全景案例、潜空间 Circle Padding 与像素空间 Pixel Blending，对应动画里的“展开 + 闭环”两件事。' },
  },
  {
    id: 'nav', name: 'WorldNav', short: '场景感知规划',
    title: '在可行走空间中寻找遮挡背面与覆盖盲区',
    input: '全景点云、语义掩码、NavMesh 与碰撞信息',
    action: '根据场景结构组合常规、环绕、重建感知、漫游和航拍轨迹，把相机预算投向互补观察。',
    result: '相机沿可行路径依次照亮盲区，而不是重复经过已经充分观察的区域。',
    why: '轨迹决定扩散模型会生成哪些新视角；错误路线会造成重复观察、穿墙或遗漏远端结构。',
    evidence: '论文 Section 3.3、Figure 4-5 与 Table 1；五类轨迹是互补启发式，不是学习得到的全局最优解。',
    media: { src: '/images/official-stage-nav.webp', alt: 'WorldNav 官方图，展示五类轨迹和完整轨迹在真实三维场景中的分布', title: '官方图：五类互补相机轨迹', caption: '真实三维场景上叠加了常规、环绕、重建感知、漫游和航拍轨迹；动画将它们抽象为 NavMesh、盲区和一条可观察路线。' },
  },
  {
    id: 'stereo', name: 'WorldStereo 2.0', short: '关键帧世界扩展',
    title: '用四步潜空间生成与跨轨迹记忆补出清晰关键帧',
    input: '参考视角、目标相机、全景几何与历史关键帧',
    action: 'Keyframe-VAE 去掉时间压缩，DMD 将 DiT 蒸馏为四步；GGM 与 SSM++ 提供全局骨架和相关局部视角。',
    result: '噪声目标逐步变清晰，并与其它路线上的参考视角保持几何和纹理一致。',
    why: '连续视频帧容易重复和模糊；关键帧表示与选择性记忆更适合扩展长轨迹上的高质量观察。',
    evidence: '论文 Section 4、Figure 6-8；四步仅指蒸馏后的 WorldStereo 采样，不代表端到端世界生成实时。',
    media: { src: '/images/official-stage-stereo.webp', alt: 'WorldStereo 2.0 官方架构图，展示记忆库、目标视角、全景点云和相机控制分支', title: '官方图：关键帧扩散、记忆库与相机控制', caption: '左侧是检索视角与记忆库，右侧从全景深度得到点云和轨迹，再以 Plucker Ray Embedding 控制目标相机。' },
  },
  {
    id: 'mirror', name: 'WorldMirror 2.0', short: '几何恢复与合成',
    title: '让多模态观察穿过共享骨干，同时预测完整几何输出',
    input: '生成关键帧，或真实多视图 / 视频及可选先验',
    action: '将图像、位姿、内参和深度编码为统一 token，经共享特征聚合后交给点图、相机、深度、法线和 3DGS 输出头。',
    result: '一次前馈恢复相机与几何，再形成可保存、可重渲染并交给 WorldLens 的显式三维资产。',
    why: '共享几何核心把生成观察和真实观察落到同一种持久世界表示，避免只得到无法编辑的像素视频。',
    evidence: '论文 Section 5-6、Figure 2 与 Figure 12；生成路径和重建路径共享的是该重建核心，不是前面全部组件。',
    media: { src: '/images/official-stage-mirror.webp', alt: 'WorldMirror 2.0 官方图，展示多模态先验、共享几何预测和五类输出', title: '官方图：Any-Modal 输入与统一几何预测', caption: '图中多视图图像与可选先验合并为 token，经共享聚合器同时输出点图、相机、深度、法线、3D Gaussians 与新视角。' },
  },
] as const;

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, size = 12, align: CanvasTextAlign = 'left', weight = 700) {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px Segoe UI, sans-serif`; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.textAlign = 'left';
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 10) {
  const width = Math.max(0, w); const height = Math.max(0, h); const radius = Math.max(0, Math.min(r, width / 2, height / 2)); ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.arcTo(x + width, y, x + width, y + height, radius); ctx.arcTo(x + width, y + height, x, y + height, radius); ctx.arcTo(x, y + height, x, y, radius); ctx.arcTo(x, y, x + width, y, radius); ctx.closePath();
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, border = C.line, fill = C.white, radius = 10) {
  ctx.fillStyle = fill; ctx.strokeStyle = border; ctx.lineWidth = 2; roundedRect(ctx, x, y, w, h, radius); ctx.fill(); ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.orange, width = 3) {
  const angle = Math.atan2(y2 - y1, x2 - x1); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 10 * Math.cos(angle - .55), y2 - 10 * Math.sin(angle - .55)); ctx.lineTo(x2 - 10 * Math.cos(angle + .55), y2 - 10 * Math.sin(angle + .55)); ctx.closePath(); ctx.fill();
}

function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale); ctx.fillStyle = color; roundedRect(ctx, -13, -9, 22, 18, 4); ctx.fill(); ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(18, -11); ctx.lineTo(18, 11); ctx.lineTo(8, 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(-3, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, variant = 0, clarity = 1) {
  ctx.save(); roundedRect(ctx, x, y, w, h, 7); ctx.clip(); ctx.globalAlpha = .35 + clarity * .65; ctx.fillStyle = variant % 2 ? '#d9e8ef' : C.sky; ctx.fillRect(x, y, w, h * .52); ctx.fillStyle = variant % 3 === 0 ? '#b5c6a6' : '#9eb99d'; ctx.beginPath(); ctx.moveTo(x, y + h * .7); ctx.lineTo(x + w * .22, y + h * .42); ctx.lineTo(x + w * .44, y + h * .66); ctx.lineTo(x + w * .69, y + h * .36); ctx.lineTo(x + w, y + h * .62); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill(); ctx.fillStyle = variant % 2 ? '#d7b583' : '#e3c68f'; ctx.fillRect(x + w * .4, y + h * .42, w * .2, h * .58); ctx.fillStyle = '#6f8c6a'; ctx.fillRect(x + w * .07, y + h * .62, w * .18, h * .38); ctx.fillRect(x + w * .75, y + h * .56, w * .17, h * .44);
  if (clarity < .8) { ctx.fillStyle = `rgba(255,255,255,${(1 - clarity) * .82})`; for (let row = 0; row < 5; row += 1) for (let col = 0; col < 8; col += 1) if ((row + col + variant) % 3 === 0) ctx.fillRect(x + col * w / 8, y + row * h / 5, w / 8 + 1, h / 5 + 1); }
  ctx.restore();
}

function drawPano(ctx: CanvasRenderingContext2D, progress: number) {
  const p = easeOutCubic(progress); label(ctx, '透视输入', 118, 54, C.blue, 11, 'center'); panel(ctx, 42, 70, 152, 226, C.blue); drawScene(ctx, 54, 82, 128, 156, 0, 1); ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(118, 245); ctx.lineTo(118, 276); ctx.stroke(); ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(118, 279, 8, 0, Math.PI * 2); ctx.fill(); label(ctx, '单一视场', 118, 322, C.muted, 10, 'center');
  for (let i = 0; i < 8; i += 1) { const t = i / 7; ctx.strokeStyle = `rgba(217,119,6,${.12 + p * .55})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(194, 112 + t * 126); ctx.bezierCurveTo(240, 112 + t * 126, 246, 76 + t * 214, 292, 76 + t * 214); ctx.stroke(); }
  arrow(ctx, 216, 184, 276, 184, C.orange, 3); label(ctx, '隐式映射', 246, 166, C.orange, 10, 'center');
  const panoX = 292, panoY = 70, panoW = 420, panoH = 226; panel(ctx, panoX, panoY, panoW, panoH, C.green); ctx.save(); roundedRect(ctx, panoX + 10, panoY + 12, (panoW - 20) * p, panoH - 24, 6); ctx.clip(); drawScene(ctx, panoX + 10, panoY + 12, panoW - 20, panoH - 24, 1, 1); for (let i = 1; i < 8; i += 1) { ctx.strokeStyle = 'rgba(39,68,110,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(panoX + 10 + i * (panoW - 20) / 8, panoY + 12); ctx.lineTo(panoX + 10 + i * (panoW - 20) / 8, panoY + panoH - 12); ctx.stroke(); } ctx.restore(); label(ctx, 'ERP 360° 全景', panoX + panoW / 2, 54, C.green, 11, 'center');
  const seamFix = clamp((p - .55) / .45, 0, 1); ctx.strokeStyle = `rgba(196,63,82,${.35 + (1 - seamFix) * .65})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(panoX + 11, panoY + 18); ctx.lineTo(panoX + 11, panoY + panoH - 18); ctx.moveTo(panoX + panoW - 11, panoY + 18); ctx.lineTo(panoX + panoW - 11, panoY + panoH - 18); ctx.stroke(); ctx.strokeStyle = `rgba(34,141,92,${seamFix})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(panoX + 11, panoY + 18); ctx.lineTo(panoX + 11, panoY + panoH - 18); ctx.moveTo(panoX + panoW - 11, panoY + 18); ctx.lineTo(panoX + panoW - 11, panoY + panoH - 18); ctx.stroke(); ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(panoX + panoW / 2, 332, 38, Math.PI * .1, Math.PI * 1.9); ctx.stroke(); ctx.fillStyle = C.orange; ctx.beginPath(); ctx.moveTo(panoX + panoW / 2 - 37, 342); ctx.lineTo(panoX + panoW / 2 - 48, 334); ctx.lineTo(panoX + panoW / 2 - 34, 328); ctx.closePath(); ctx.fill(); label(ctx, p > .94 ? '左右边界已闭环' : '循环填充 + 像素融合', panoX + panoW / 2, 374, p > .94 ? C.green : C.orange, 11, 'center');
}

function routePoint(t: number) {
  const points = [{ x: 118, y: 292 }, { x: 208, y: 240 }, { x: 316, y: 294 }, { x: 420, y: 208 }, { x: 534, y: 254 }, { x: 650, y: 154 }]; const scaled = clamp(t, 0, .9999) * (points.length - 1); const index = Math.floor(scaled); const local = scaled - index; const a = points[index], b = points[index + 1]; return { x: a.x + (b.x - a.x) * local, y: a.y + (b.y - a.y) * local, angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

function cubicBezierPoint(t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) {
  const u = 1 - t;
  return {
    x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}

function cubicBezierPose(t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) {
  const point = cubicBezierPoint(t, p0, p1, p2, p3); const u = 1 - t;
  const dx = 3 * u ** 2 * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t ** 2 * (p3.x - p2.x);
  const dy = 3 * u ** 2 * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t ** 2 * (p3.y - p2.y);
  return { ...point, angle: Math.atan2(dy, dx) };
}

function drawNav(ctx: CanvasRenderingContext2D, progress: number) {
  const p = easeInOutQuad(progress); panel(ctx, 38, 42, 684, 306, C.line, '#eef3e8', 14); label(ctx, '俯视场景 · NavMesh 与盲区', 58, 67, C.ink, 12);
  [{ x: 78, y: 92, w: 126, h: 88 }, { x: 256, y: 72, w: 120, h: 118 }, { x: 470, y: 86, w: 110, h: 90 }, { x: 544, y: 246, w: 120, h: 64 }].forEach((o, index) => { ctx.fillStyle = index % 2 ? '#9eb48d' : '#7f9a78'; ctx.strokeStyle = '#668160'; ctx.lineWidth = 2; roundedRect(ctx, o.x, o.y, o.w, o.h, 7); ctx.fill(); ctx.stroke(); }); ctx.fillStyle = '#d7c8a9'; ctx.fillRect(92, 111, 42, 32); ctx.fillRect(292, 105, 46, 62); ctx.fillRect(504, 108, 38, 44);
  ctx.strokeStyle = 'rgba(34,141,92,.28)'; ctx.lineWidth = 1; [[60,210,240,198],[60,210,118,292],[240,198,316,294],[240,198,420,208],[420,208,534,254],[420,208,650,154],[316,294,534,254],[534,254,690,330]].forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
  [{ x: 226, y: 116, label: '遮挡背面' }, { x: 430, y: 118, label: '远端' }, { x: 652, y: 218, label: '未覆盖角落' }].forEach((target, index) => { const discovered = p > (index + 1) / 3; ctx.strokeStyle = discovered ? C.green : C.red; ctx.fillStyle = discovered ? 'rgba(34,141,92,.12)' : 'rgba(196,63,82,.1)'; ctx.lineWidth = 2; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.arc(target.x, target.y, 27, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); label(ctx, discovered ? '已覆盖' : target.label, target.x, target.y + 4, discovered ? C.green : C.red, 8, 'center'); });
  const rejected = [[{x:118,y:292},{x:260,y:170},{x:520,y:112}],[{x:118,y:292},{x:360,y:130},{x:650,y:154}]];
  rejected.forEach((candidate,index)=>{ctx.strokeStyle='rgba(196,63,82,'+(.18+.35*clamp(p*2-index*.45,0,1))+')';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.beginPath();candidate.forEach((point,i)=>i?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y));ctx.stroke();ctx.setLineDash([]);});
  const route = [{ x: 118, y: 292 }, { x: 208, y: 240 }, { x: 316, y: 294 }, { x: 420, y: 208 }, { x: 534, y: 254 }, { x: 650, y: 154 }]; ctx.strokeStyle = '#bdc6d2'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); route.forEach((point,index)=>index?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y)); ctx.stroke(); ctx.save(); ctx.beginPath(); route.forEach((point,index)=>index?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y)); ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.setLineDash([Math.max(1, 760 * p), 760]); ctx.stroke(); ctx.restore(); const camera = routePoint(p); ctx.fillStyle = 'rgba(39,68,110,.15)'; ctx.beginPath(); ctx.moveTo(camera.x, camera.y); ctx.arc(camera.x, camera.y, 84, camera.angle - .5, camera.angle + .5); ctx.closePath(); ctx.fill(); drawCamera(ctx, camera.x, camera.y, camera.angle, C.blue, 1.05); label(ctx, p < .38 ? '铺开候选' : p < .68 ? '淘汰穿墙路线' : '沿互补路线补盲区', 380, 369, p < .68 ? C.orange : C.green, 10, 'center'); label(ctx, '红虚线 = 碰撞淘汰', 104, 369, C.red, 9); label(ctx, '相机预算 → 盲区', 674, 369, C.green, 10, 'right');
}

function drawStereo(ctx: CanvasRenderingContext2D, progress: number) {
  const p = easeOutCubic(progress); const activeStep = Math.min(4, Math.max(1, Math.ceil(p * 4)));
  label(ctx, '同一运动主体在四个目标视角中的位置变化', 380, 42, C.ink, 12, 'center');
  panel(ctx, 30, 58, 150, 282, C.blue, '#eef3fb'); label(ctx, '双记忆条件', 105, 84, C.blue, 11, 'center');
  ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(52,160);ctx.lineTo(105,112);ctx.lineTo(158,160);ctx.stroke();label(ctx,'GGM 粗骨架',105,182,C.purple,9,'center');
  panel(ctx,48,208,114,72,C.orange,C.white,6);ctx.fillStyle='#dce8d2';ctx.fillRect(57,218,96,52);ctx.fillStyle=C.orange;ctx.fillRect(112,235,18,26);label(ctx,'SSM++ 相关帧',105,300,C.orange,9,'center');
  arrow(ctx, 188, 196, 224, 196, C.blue, 3);
  panel(ctx, 228, 58, 502, 282, C.purple, '#fbf8ff'); label(ctx, '四步去噪 + 四个目标相机', 479, 84, C.purple, 11, 'center');
  const positions=[.18,.39,.63,.82]; const frameCenters=positions.map((_,i)=>296+i*116);
  for(let i=0;i<4;i+=1){const x=246+i*116;const reveal=clamp(p*4-i,0,1);panel(ctx,x,104,100,142,i<activeStep?C.purple:C.line,C.white,7);ctx.fillStyle='#d9e8f2';ctx.fillRect(x+7,111,86,62);ctx.fillStyle='#9eb48d';ctx.fillRect(x+7,160,86,73);ctx.fillStyle='#d7b986';ctx.fillRect(x+42-i*4,139,22,94);ctx.fillStyle=C.orange;const subjectX=x+12+positions[i]*74;ctx.beginPath();ctx.arc(subjectX,196,8,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.white;ctx.fillRect(subjectX-4,193,8,3);if(reveal<.9){ctx.fillStyle='rgba(255,255,255,'+(.78*(1-reveal))+')';for(let row=0;row<5;row+=1)for(let col=0;col<4;col+=1)if((row+col+i)%2===0)ctx.fillRect(x+7+col*22,111+row*25,23,26);}label(ctx,'目标帧 '+(i+1),x+50,252,i<activeStep?C.purple:C.muted,9,'center');label(ctx,'主体 x='+Math.round(positions[i]*100)+'%',x+50,270,C.orange,8,'center');if(i<3)arrow(ctx,x+102,176,x+112,176,C.orange,2);}
  const p0={x:260,y:310},p1={x:350,y:274},p2={x:500,y:338},p3={x:690,y:286}; const keyTs=[.08,.36,.64,.91];
  ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.bezierCurveTo(p1.x,p1.y,p2.x,p2.y,p3.x,p3.y);ctx.stroke();
  keyTs.forEach((t,index)=>{const point=cubicBezierPoint(t,p0,p1,p2,p3);const selected=p>=t-.035;ctx.strokeStyle=selected?C.purple:'#aab4c3';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(point.x,point.y-5);ctx.lineTo(frameCenters[index],280);ctx.lineTo(frameCenters[index],276);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=selected?C.purple:C.white;ctx.strokeStyle=selected?C.purple:'#8f9caf';ctx.lineWidth=2;ctx.beginPath();ctx.arc(point.x,point.y,6,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=selected?C.purple:'#8f9caf';ctx.beginPath();ctx.moveTo(frameCenters[index],274);ctx.lineTo(frameCenters[index]-4,281);ctx.lineTo(frameCenters[index]+4,281);ctx.closePath();ctx.fill();label(ctx,'K'+(index+1),point.x,point.y+18,selected?C.purple:C.muted,8,'center');});
  const camera=cubicBezierPose(p,p0,p1,p2,p3);drawCamera(ctx,camera.x,camera.y,camera.angle,C.blue,.72);label(ctx,p>.95?'四个曲线取景点分别生成目标关键帧':'相机位置与朝向都由曲线切线驱动',479,356,p>.95?C.green:C.orange,9,'center');
}

function drawFrustum(ctx: CanvasRenderingContext2D, x: number, y: number, targetX: number, targetY: number, color: string, alpha: number) {
  const angle = Math.atan2(targetY - y, targetX - x); ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = `${color}22`; ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(angle - .28) * 74, y + Math.sin(angle - .28) * 74); ctx.lineTo(x + Math.cos(angle + .28) * 74, y + Math.sin(angle + .28) * 74); ctx.closePath(); ctx.fill(); ctx.stroke(); drawCamera(ctx, x, y, angle, color, .7); ctx.restore();
}

function drawMirror(ctx: CanvasRenderingContext2D, progress: number) {
  const p = easeOutCubic(progress); panel(ctx, 28, 48, 164, 294, C.blue, '#eef3fb'); label(ctx, '多模态观察', 110, 73, C.blue, 11, 'center'); for (let i = 0; i < 3; i += 1) { drawScene(ctx, 44, 88 + i * 75, 92, 58, i, 1); ctx.fillStyle = i === 0 ? C.purple : i === 1 ? C.orange : C.green; roundedRect(ctx, 144, 96 + i * 75, 32, 42, 5); ctx.fill(); label(ctx, i === 0 ? 'Pose' : i === 1 ? 'K' : 'D', 160, 121 + i * 75, C.white, 8, 'center'); } arrow(ctx, 198, 196, 232, 196, C.blue, 3);
  panel(ctx, 236, 48, 228, 294, C.purple, '#fbf8ff'); label(ctx, '共享特征聚合', 350, 74, C.purple, 11, 'center'); for (let row = 0; row < 5; row += 1) for (let col = 0; col < 7; col += 1) { const delay = (row * 7 + col) / 35; const active = p > delay; ctx.fillStyle = active ? (col % 3 === 0 ? '#cab3f5' : col % 3 === 1 ? '#f2c58c' : '#aad8bd') : '#e9e5ef'; roundedRect(ctx, 258 + col * 25, 94 + row * 31, 17, 23, 3); ctx.fill(); } const scanY = 91 + p * 160; ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(252, scanY); ctx.lineTo(448, scanY); ctx.stroke(); label(ctx, 'Any-Modal tokens', 350, 275, C.muted, 9, 'center'); ctx.fillStyle = C.purple; roundedRect(ctx, 270, 292, 160, 31, 6); ctx.fill(); label(ctx, 'WorldMirror 2.0 Backbone', 350, 312, C.white, 9, 'center'); arrow(ctx, 470, 196, 504, 196, C.green, 3);
  panel(ctx, 508, 48, 224, 294, C.green, '#edf8f1'); label(ctx, '统一几何预测', 620, 74, C.green, 11, 'center'); const centerX = 620, centerY = 188; ctx.save(); ctx.globalAlpha = p; ctx.fillStyle = '#d6c59f'; ctx.strokeStyle = C.dark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(568, 212); ctx.lineTo(620, 178); ctx.lineTo(680, 209); ctx.lineTo(624, 242); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#b9c9ae'; ctx.beginPath(); ctx.moveTo(568, 212); ctx.lineTo(620, 178); ctx.lineTo(620, 116); ctx.lineTo(568, 148); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8fa88b'; ctx.beginPath(); ctx.moveTo(620, 178); ctx.lineTo(680, 209); ctx.lineTo(680, 148); ctx.lineTo(620, 116); ctx.closePath(); ctx.fill(); ctx.stroke(); drawFrustum(ctx, 540, 116, centerX, centerY, C.blue, p); drawFrustum(ctx, 704, 118, centerX, centerY, C.orange, p); drawFrustum(ctx, 704, 260, centerX, centerY, C.purple, p); drawFrustum(ctx, 540, 267, centerX, centerY, C.green, p); ctx.restore();
  ['点图', '相机', '深度', '法线', '3DGS'].forEach((output,index)=>{const x=525+index*40; const active=p>(index+.25)/5; ctx.fillStyle=active?C.green:'#dfe5dd'; roundedRect(ctx,x,298,35,24,4);ctx.fill(); label(ctx,output,x+17.5,314,active?C.white:C.muted,7,'center');}); label(ctx, p > .95 ? '五类输出同时在线' : '输出头逐步解锁', 620, 367, p > .95 ? C.green : C.orange, 10, 'center');
}

const drawStage = [drawPano, drawNav, drawStereo, drawMirror] as const;

function PipelineCanvas({ stageIndex, animationKey, onAnimationChange }: { stageIndex: number; animationKey: number; onAnimationChange: (running: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null); const ctxRef = useRef<CanvasRenderingContext2D | null>(null); const stageRef = useRef(stageIndex); const progressRef = useRef(0); stageRef.current = stageIndex;
  const paint = (progress: number) => { const ctx = ctxRef.current; if (!ctx) return; ctx.clearRect(0, 0, 760, 390); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 760, 390); ctx.strokeStyle = 'rgba(104,119,143,.08)'; ctx.lineWidth = 1; for (let x = 20; x < 760; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 390); ctx.stroke(); } for (let y = 20; y < 390; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(760, y); ctx.stroke(); } drawStage[stageRef.current](ctx, progress); };
  useEffect(() => { const canvas = ref.current; if (!canvas) return; let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, 760, 390); } catch { return; } ctxRef.current = ctx; const redraw = () => { paint(progressRef.current); canvas.classList.add('is-ready'); }; const disconnect = observeCanvas(canvas, redraw, () => undefined); redraw(); return () => { ctxRef.current = null; disconnect(); }; }, []);
  useEffect(() => { const canvas = ref.current; if (!canvas || !ctxRef.current) return; progressRef.current = 0; if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { progressRef.current = 1; paint(1); onAnimationChange(false); return; } let frame = 0; const startedAt = performance.now(); onAnimationChange(true); const tick = (time: number) => { const progress = clamp((time - startedAt) / 1180, 0, 1); progressRef.current = progress; paint(progress); canvas.classList.add('is-ready'); if (progress < 1) frame = requestAnimationFrame(tick); else onAnimationChange(false); }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame); }, [animationKey, onAnimationChange]);
  return <canvas ref={ref} width={760} height={390} aria-label={`${stages[stageIndex].name} 功能动画`} />;
}

export const HyCreationPipeline: React.FC<WidgetProps> = () => {
  const [stageIndex, setStageIndex] = useState(0); const [animationKey, setAnimationKey] = useState(0); const [animating, setAnimating] = useState(false); const stage = stages[stageIndex];
  const selectStage = (next: number) => { if (next === stageIndex && animating) return; setStageIndex(next); setAnimationKey((value) => value + 1); };
  const next = () => selectStage(stageIndex === stages.length - 1 ? 0 : stageIndex + 1);
  return <div className={`creation-pipeline ${animating ? 'is-animating' : ''}`}>
    <div className="learning-contract"><div><span>为什么学</span><p>四个子系统各自修复一个不同瓶颈，不能只记住系统名称。</p></div><div><span>本次操作</span><p>逐步点击四个阶段；每次清空画布，只演示该阶段新增的能力。</p></div><div><span>应得判断</span><p>生成路径先补观察，再规划、扩展关键帧，最后由共享 WorldMirror 恢复显式三维资产。</p></div></div>
    <div className="creation-stage-tabs" role="tablist" aria-label="选择四阶段造物管线步骤">{stages.map((item, index) => <button key={item.id} type="button" role="tab" aria-selected={stageIndex === index} className={stageIndex === index ? 'selected' : index < stageIndex ? 'complete' : ''} onClick={() => selectStage(index)}><b>{index + 1}</b><span>{item.name}</span><small>{item.short}</small></button>)}</div>
    <div className="creation-stage-main">
      <div className="creation-canvas-shell"><PipelineCanvas stageIndex={stageIndex} animationKey={animationKey} onAnimationChange={setAnimating} /><div className="creation-canvas-caption"><span>独立场景 {stageIndex + 1} / 4</span><strong>{stage.short}</strong></div><div className="creation-animation-state" aria-live="polite"><i aria-hidden="true" /><span>{animating ? '功能动画演示中' : '动画完成，可继续探索'}</span></div></div>
      <section className="creation-stage-detail" aria-live="polite"><header><span>{stage.name}</span><h5>{stage.title}</h5></header><div className="creation-stage-ledger"><p><b>接收什么</b>{stage.input}</p><p><b>执行什么</b>{stage.action}</p><p><b>新增什么</b>{stage.result}</p><p><b>为什么需要</b>{stage.why}</p></div><small>{stage.evidence}</small></section>
    </div>
    <details className="creation-stage-evidence"><summary><div><strong>{stage.media.title}</strong><small>灰色提示：点击展开官方实景与架构讲解图；图片用于解释功能，不替代论文定量表格。</small></div><span>展开图片</span></summary><figure><img src={stage.media.src} alt={stage.media.alt} loading="lazy" /><figcaption><p>{stage.media.caption}</p><a href={PROJECT_URL} target="_blank" rel="noreferrer">腾讯混元 HY-World 2.0 官方项目页 ↗</a></figcaption></figure></details>
    <div className="creation-progress-ledger" aria-label="四阶段浏览进度">{stages.map((item, index) => <div key={item.id} className={index < stageIndex ? 'complete' : index === stageIndex ? 'current' : 'future'}><span>{index < stageIndex ? '已浏览' : index === stageIndex ? '当前动画' : '等待'}</span><strong>{item.short}</strong></div>)}</div>
    <div className="creation-controls"><button type="button" className="ghost" aria-label="返回上一个造物阶段" title="返回上一个造物阶段" disabled={stageIndex === 0} onClick={() => selectStage(stageIndex - 1)}>←</button><p>{stageIndex === stages.length - 1 ? '生成路径的四项功能已经分别演示；多视图或视频重建会跳过前三项，直接使用共享的 WorldMirror 2.0。' : '下一步会清空画布，换成对应子系统自己的功能场景，不再把所有机制挤进同一张图。'}</p><button type="button" onClick={next}>{stageIndex === stages.length - 1 ? '从头再看 ↺' : `下一步：${stages[stageIndex + 1].name} →`}</button></div>
  </div>;
};
