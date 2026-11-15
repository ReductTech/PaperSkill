import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { SC, clearStudio, slip, filmChip, label, lockTag, arrowLine, mix, board, album } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 8.1 MoDE architecture map. Click a component (canvas hotspot or DOM
// button) and switch the flow: understanding / generation / training updates.
// Verified facts: n=4 experts, r=8, beta=2.0, lambda=0.3, 0.0211% trainable (Table 13).
const W = 1080;
const H = 320;

type Sel = 'backbone' | 'router' | 'experts' | 'vadapter' | 'teacher' | 'loss' | null;
type Flow = 'understand' | 'generate' | 'train';

const REGIONS: Record<Exclude<Sel, null>, { x: number; y: number; w: number; h: number }> = {
  backbone: { x: 20, y: 20, w: 1040, h: 30 },
  router: { x: 318, y: 98, w: 44, h: 44 },
  experts: { x: 420, y: 95, w: 220, h: 55 },
  vadapter: { x: 420, y: 200, w: 220, h: 55 },
  teacher: { x: 950, y: 66, w: 100, h: 54 },
  loss: { x: 420, y: 284, w: 360, h: 30 },
};

const INFO: Record<Exclude<Sel, null>, { title: string; body: string }> = {
  backbone: { title: '冻结骨干', body: '骨干一个参数都不更新（§4.2）：预训练换来的跨模态对齐一旦被改写就回不来——遗忘只可能发生在适配器这一层。' },
  router: { title: 'T-路由（门控）', body: 'softmax 门控 g<sub>j</sub>(x)（式6），给每个文本 token 分配 4 支专家的加权；专家数 n=4、秩 r=8（附录D）。' },
  experts: { title: '4 支专家 LoRA', body: '门控按 token 给 4 支专家分配软权重（式6，权重和为 1），不同 token 的分布不同，以此压模态内遗忘；6 支成绩更好（ACC 34.90）但按算力选 4（表7、附录E.2）。' },
  vadapter: { title: 'V-Adapter', body: '单支 LoRA（r=8），同时服务图像理解与生成；块内的「学理解 vs 保出图」漂移靠蒸馏压制（§4.3）。' },
  teacher: { title: '冻结教师', body: '原始预训练模型的副本，只在图像 token 上提供蒸馏信号：温度 β=2.0、权重 λ=0.3，参考数据取自 LAION-5B 的一小批图像。' },
  loss: { title: '两套损失', body: 'T-MoE 只用交叉熵（式11）；V-Adapter 用交叉熵 + 0.3×蒸馏（式12）。可训练参数合计仅 0.0211%（表13）。' },
};

export const M81Arch: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState<Sel>(null);
  const [flow, setFlow] = useState<Flow>('understand');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.classList.add('is-ready');
    clearStudio(ctx, W, H, 0.97);
    const dim = (active: boolean) => (active ? 1 : 0.35);
    const lit = flow === 'understand' || flow === 'train';
    const litDown = flow === 'generate' || flow === 'train';

    // backbone band
    const bkActive = sel === 'backbone';
    ctx.fillStyle = bkActive ? mix(SC.shade, SC.blue, 0.25) : SC.shade;
    ctx.fillRect(20, 20, 1040, 30);
    lockTag(ctx, 40, 24);
    if (bkActive) {
      ctx.strokeStyle = SC.blue;
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 20, 1040, 30);
    }

    // interleaved input sequence
    for (let i = 0; i < 8; i++) {
      const x = 30 + i * 22;
      if (i % 2 === 0) filmChip(ctx, x, 78, 18, lit ? SC.green : mix(SC.green, SC.bg, 0.5));
      else slip(ctx, x, 72, 18, 30, lit ? SC.blue : mix(SC.blue, SC.bg, 0.5));
    }

    // split node
    ctx.strokeStyle = SC.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(268, 168, 14, 0, Math.PI * 2);
    ctx.stroke();

    // upper stream (text -> T-MoE)
    const upAlpha = lit;
    arrowLine(ctx, 282, 160, 310, 122, upAlpha ? SC.blue : mix(SC.blue, SC.bg, 0.5), upAlpha ? 3 : 1.5);
    // router diamond
    const rActive = sel === 'router';
    ctx.save();
    ctx.translate(340, 120);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = rActive ? mix(SC.purple, SC.paper, 0.3) : mix(SC.purple, SC.bg, 0.4);
    ctx.fillRect(-16, -16, 32, 32);
    ctx.strokeStyle = rActive ? SC.purple : SC.shade;
    ctx.lineWidth = rActive ? 3 : 1.5;
    ctx.strokeRect(-16, -16, 32, 32);
    ctx.restore();
    arrowLine(ctx, 366, 120, 414, 122, upAlpha ? SC.blue : mix(SC.blue, SC.bg, 0.5), upAlpha ? 3 : 1.5);
    // experts block（答题预设板）
    const eActive = sel === 'experts';
    board(ctx, 414, 89, 232, 67, '');
    ctx.fillStyle = eActive ? mix(SC.blue, SC.paper, 0.3) : upAlpha ? mix(SC.blue, SC.paper, 0.7) : mix(SC.blue, SC.bg, 0.7);
    ctx.fillRect(420, 95, 220, 55);
    ctx.strokeStyle = eActive ? SC.blue : SC.shade;
    ctx.lineWidth = eActive ? 3 : 1.5;
    ctx.strokeRect(420, 95, 220, 55);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = mix(SC.purple, SC.bg, eActive ? 0.35 : 0.65);
      ctx.fillRect(432 + i * 52, 108, 40, 28);
      ctx.strokeStyle = SC.shade;
      ctx.lineWidth = 1;
      ctx.strokeRect(432 + i * 52, 108, 40, 28);
    }
    arrowLine(ctx, 640, 122, 700, 160, upAlpha ? SC.blue : mix(SC.blue, SC.bg, 0.5), upAlpha ? 3 : 1.5);

    // lower stream (image -> V-Adapter)
    arrowLine(ctx, 282, 176, 310, 226, litDown ? SC.green : mix(SC.green, SC.bg, 0.5), litDown ? 3 : 1.5);
    const vActive = sel === 'vadapter';
    board(ctx, 414, 194, 232, 67, '');
    ctx.fillStyle = vActive ? mix(SC.green, SC.paper, 0.3) : litDown ? mix(SC.green, SC.paper, 0.7) : mix(SC.green, SC.bg, 0.7);
    ctx.fillRect(420, 200, 220, 55);
    ctx.strokeStyle = vActive ? SC.green : SC.shade;
    ctx.lineWidth = vActive ? 3 : 1.5;
    ctx.strokeRect(420, 200, 220, 55);
    arrowLine(ctx, 640, 228, 700, 176, litDown ? SC.green : mix(SC.green, SC.bg, 0.5), litDown ? 3 : 1.5);

    // merge node + output
    ctx.strokeStyle = SC.ink;
    ctx.beginPath();
    ctx.arc(716, 168, 14, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const x = 750 + i * 26;
      if (i % 2 === 0) filmChip(ctx, x, 156, 20, flow === 'train' ? mix(SC.green, SC.bg, 0.4) : SC.green);
      else slip(ctx, x, 150, 20, 32, flow === 'train' ? mix(SC.blue, SC.bg, 0.4) : SC.blue);
    }

    // frozen teacher（出厂样片册）+ KD dashed arrow
    const tActive = sel === 'teacher';
    album(ctx, 946, 62, 108, 60, tActive ? 0.6 : 0.35);
    lockTag(ctx, 958, 64);
    const kdOn = flow === 'train' || tActive || sel === 'vadapter';
    ctx.strokeStyle = kdOn ? SC.purple : mix(SC.purple, SC.bg, 0.55);
    ctx.lineWidth = kdOn ? 3 : 1.5;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(985, 124);
    ctx.lineTo(560, 198);
    ctx.stroke();
    ctx.setLineDash([]);
    // arrowhead
    ctx.fillStyle = kdOn ? SC.purple : mix(SC.purple, SC.bg, 0.55);
    ctx.beginPath();
    ctx.moveTo(560, 198);
    ctx.lineTo(574, 186);
    ctx.lineTo(576, 200);
    ctx.closePath();
    ctx.fill();

    // loss boxes (gradient exits)
    const lActive = sel === 'loss';
    ctx.strokeStyle = lActive ? SC.blue : SC.shade;
    ctx.lineWidth = lActive ? 3 : 1.5;
    ctx.strokeRect(420, 284, 150, 30);
    label(ctx, 'L_CE', 495, 304, SC.blue, 12, 'center');
    ctx.strokeStyle = lActive ? SC.green : SC.shade;
    ctx.lineWidth = lActive ? 3 : 1.5;
    ctx.strokeRect(610, 284, 170, 30);
    label(ctx, 'L_CE+λKD', 695, 304, SC.green, 12, 'center');
    if (flow === 'train') {
      // gradient arrows flow from loss boxes up into the adapter blocks
      arrowLine(ctx, 495, 284, 495, 152, SC.blue, 2.5);
      arrowLine(ctx, 695, 284, 660, 258, SC.green, 2.5);
    }
  }, [sel, flow]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = toLocalSafe(canvas, e.clientX, e.clientY);
    const hit = (Object.keys(REGIONS) as Array<Exclude<Sel, null>>).find((k) => {
      const r = REGIONS[k];
      return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    });
    setSel(hit ?? null);
  };

  const info = sel
    ? INFO[sel]
    : { title: 'MoDE 架构（图3）', body: '点组件或用下方按钮看职责；切流向看路径。训练流里梯度只流向两块适配器，教师虚线只把蒸馏信号送进 V-Adapter。' };

  const fb = !sel
    ? { text: '两种 token 各走各的适配器，骨干只读——这就是「不对称设计」的全部骨架。', cls: '' }
    : sel === 'router' && flow === 'generate'
    ? { text: '出图 token 不经过 T-MoE：生成时只有提示文本走文本股，图像 token 全程走 V-Adapter。', cls: 'bad' }
    : { text: INFO[sel].title + '：' + INFO[sel].body.replace(/<[^>]+>/g, ''), cls: 'good' };

  return (
    <div>
      <div className="chip-row">
        {(
          [
            ['understand', '答题流'],
            ['generate', '出图流'],
            ['train', '训练更新流'],
          ] as Array<[Flow, string]>
        ).map(([k, lbl]) => (
          <button key={k} className={`chip ${flow === k ? 'selected' : ''}`} onClick={() => setFlow(k)}>
            {lbl}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={onClick}
          style={{ maxWidth: '100%', cursor: 'pointer' }}
        />
        <div style={{ flex: 1, minWidth: 230, maxWidth: 330 }}>
          <div className="hotspot-info" style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{info.title}</div>
            <div dangerouslySetInnerHTML={{ __html: info.body }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(
              [
                ['backbone', '冻结骨干'],
                ['router', 'T-路由'],
                ['experts', '专家×4'],
                ['vadapter', 'V-Adapter'],
                ['teacher', '冻结教师'],
                ['loss', '两套损失'],
              ] as Array<[Exclude<Sel, null>, string]>
            ).map(([k, lbl]) => (
              <button key={k} className={`chip ${sel === k ? 'selected' : ''}`} onClick={() => setSel(k)}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

function toLocalSafe(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
}

export default M81Arch;
