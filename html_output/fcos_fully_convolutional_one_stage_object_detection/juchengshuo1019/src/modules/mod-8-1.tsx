// mod-8-1 (P5): clickable architecture map — Backbone -> FPN -> 3 heads.
import React, { useRef, useState, useEffect} from 'react';
import { setupCanvas, observeCanvas} from '../lib/canvasKit';
import { palette, clearScene} from './carpentry-kit';

const W = 1080, H = 280;
type Sel = 'bb' | 'fpn' | 'cls' | 'reg' | 'ctr' | null;
const PARTS: Array<{
id: Exclude<Sel, null>;
label: string;
x: number;
w: number;
color: string;
io: string;
duty: string;
fb: string;
}> = [
{ id: 'bb', label: '主干', x: 60, w: 150, color: '#27446e', io: '输入：图片 → 输出：C3–C5（步长 8/16/32）', duty: '主干：提特征', fb: '主干：提特征，输出 C3–C5，步长 8/16/32。'},
{ id: 'fpn', label: 'FPN', x: 260, w: 150, color: '#7c3aed', io: '输入：C3–C5 → 输出：P3–P7（步长 8–128）', duty: '按尺寸分流到五个层级', fb: 'FPN：产出 P3–P7，步长 8 到 128，大小分流。'},
{ id: 'cls', label: '分类头', x: 470, w: 130, color: '#27446e', io: '输入：P3–P7 → 输出：80 个二分类分数', duty: '分类：这是什么', fb: '分类头：80 个二分类器，判断每个位置是什么类别。'},
{ id: 'reg', label: '回归头', x: 630, w: 130, color: '#27446e', io: '输入：P3–P7 → 输出：(l,t,r,b)，输出层 exp(sᵢ·x)', duty: '量尺寸：框在哪', fb: '回归头：输出四个距离；输出层用 exp(sᵢ·x)，尺度 sᵢ 每层独立学。'},
{ id: 'ctr', label: '中心性头', x: 790, w: 130, color: '#228d5c', io: '输入：P3–P7 → 输出：0~1 中心性分数', duty: '看点位有多正', fb: '中心性头：只有一层，预测每个位置离中心有多近。'},
];

function drawArch(canvas: HTMLCanvasElement, sel: Sel): void {
const ctx = canvas.getContext('2d');
if (!ctx) return;
clearScene(ctx, W, H);
// arrows
ctx.strokeStyle = palette.nail;
ctx.lineWidth = 3;
const arrow = (x1: number, x2: number, y: number) => {
ctx.beginPath();
ctx.moveTo(x1, y);
ctx.lineTo(x2, y);
ctx.moveTo(x2 - 10, y - 6);
ctx.lineTo(x2, y);
ctx.lineTo(x2 - 10, y + 6);
ctx.stroke();
};
arrow(215, 255, 140);
arrow(415, 465, 140);
arrow(715, 785, 140);
PARTS.forEach((p) => {
const active = sel === p.id;
ctx.fillStyle = active? p.color: '#ffffff';
ctx.strokeStyle = p.color;
ctx.lineWidth = active? 5: 2;
const y = 90;
ctx.fillRect(p.x, y, p.w, 100);
ctx.strokeRect(p.x, y, p.w, 100);
if (active) {
ctx.strokeStyle = p.color;
ctx.globalAlpha = 0.35;
ctx.lineWidth = 10;
ctx.strokeRect(p.x - 6, y - 6, p.w + 12, 112);
ctx.globalAlpha = 1;
}
ctx.fillStyle = active? '#ffffff': p.color;
ctx.font = 'bold 18px sans-serif';
ctx.textAlign = 'center';
ctx.fillText(p.label, p.x + p.w / 2, y + 45);
ctx.font = '13px sans-serif';
ctx.fillText(p.duty, p.x + p.w / 2, y + 72);
ctx.textAlign = 'left';
});
// detail panel
const cur = PARTS.find((p) => p.id === sel);
ctx.fillStyle = '#ffffff';
ctx.strokeStyle = palette.techBorder;
ctx.lineWidth = 2;
ctx.fillRect(60, 210, 960, 56);
ctx.strokeRect(60, 210, 960, 56);
ctx.fillStyle = palette.ink;
ctx.font = '15px sans-serif';
ctx.fillText(cur? `${cur.io}`: '点一个部件，看它的输入输出。', 80, 233);
ctx.fillStyle = palette.inkMuted;
ctx.font = '13px sans-serif';
ctx.fillText(cur? cur.duty: '三个检测头在 P3–P7 各层之间共享。', 80, 256);
if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
}

export const Mod81: React.FC<{ chapterId: string; moduleId: string}> = () => {
const ref = useRef<HTMLCanvasElement | null>(null);
const [sel, setSel] = useState<Sel>(null);

useEffect(() => {
const canvas = ref.current;
if (!canvas) return;
setupCanvas(canvas, W, H);
drawArch(canvas, null);
const disconnect = observeCanvas(canvas, () => drawArch(canvas, sel), () => {});
return () => disconnect();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
const canvas = ref.current;
if (canvas) drawArch(canvas, sel);
}, [sel]);

const onCanvasClick = (e: React.MouseEvent) => {
const rect = ref.current!.getBoundingClientRect();
const x = ((e.clientX - rect.left) / rect.width) * W;
const y = ((e.clientY - rect.top) / rect.height) * H;
const hit = PARTS.find((p) => x >= p.x && x <= p.x + p.w && y >= 90 && y <= 190);
if (hit) setSel(hit.id);
};

const cur = PARTS.find((p) => p.id === sel);
return (
<div>
<canvas
ref={ref}
aria-label="FCOS 架构图，点击部件查看详情"
style={{ cursor: 'pointer'}}
onClick={onCanvasClick}
tabIndex={0}
onKeyDown={(e) => {
const idx = PARTS.findIndex((p) => p.id === sel);
if (e.key === 'ArrowRight') setSel(PARTS[(idx + 1 + PARTS.length) % PARTS.length].id);
else if (e.key === 'ArrowLeft') setSel(PARTS[(idx - 1 + PARTS.length) % PARTS.length].id);
else return;
e.preventDefault();
}}
/>
<div className="controls" role="group" aria-label="架构部件">
{PARTS.map((p) => (
<button
key={p.id}
type="button"
className={`chip${sel === p.id? ' active': ''}`}
onClick={() => setSel(p.id)}
>
{p.label}
</button>
))}
</div>
<div className={`feedback ${cur? 'good': 'mid'}`}>
{cur? cur.fb: '点一个部件，看它是干什么的。'}
</div>
</div>
);
};
