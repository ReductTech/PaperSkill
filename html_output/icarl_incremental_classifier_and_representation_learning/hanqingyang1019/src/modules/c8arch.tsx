import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, W, H, scene, txt, rr, arrow, canvasPoint, type WidgetProps } from './kit';

// Chapter 8.1 — click a component of the iCaRL pipeline.
type Node = { id: number; x: number; y: number; w: number; h: number; name: string; detail: string };

const NODES: Node[] = [
  { id: 0, x: 70, y: 108, w: 150, h: 64, name: '输入 x', detail: '一张图片。CIFAR 为 32×32，ILSVRC 为 224×224；不随类别数变化。' },
  { id: 1, x: 288, y: 108, w: 180, h: 64, name: '特征 φ', detail: 'ResNet 主干（iCIFAR-100 用 32 层，iILSVRC 用 18 层），输出 d 维 L2 归一化特征。参数固定，不随类别数增长——这是内存的主体。' },
  { id: 2, x: 556, y: 48, w: 180, h: 62, name: '分类头 w', detail: '每个已见类一个 d 维权重向量，共 t 个。参数随类别线性增长，但只用于蒸馏，不直接决定预测。' },
  { id: 3, x: 556, y: 170, w: 180, h: 62, name: '样本库 P', detail: '每类至多 m=⌊K/t⌋ 张样本，总量不超过 K。iCIFAR-100 用 K=2000，iILSVRC 用 K=20000。' },
  { id: 4, x: 842, y: 108, w: 168, h: 64, name: '损失 ℓ', detail: '新类样本走分类项，旧类样本同时走分类项与蒸馏项；两项共享一次前向。' },
];

export const C8Arch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState(1);
  const node = NODES[sel];

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);

    arrow(ctx, 220, 140, 286, 140, C.border, 2);
    arrow(ctx, 468, 128, 556, 84, C.border, 2);
    arrow(ctx, 468, 152, 556, 196, C.border, 2);
    arrow(ctx, 736, 84, 842, 126, C.border, 2);
    arrow(ctx, 736, 196, 842, 154, C.border, 2);

    NODES.forEach((n) => {
      const active = n.id === sel;
      rr(ctx, n.x, n.y, n.w, n.h, 12, active ? 'rgba(39,68,110,0.12)' : 'rgba(255,255,255,0.8)', active ? C.blue : C.border, active ? 3 : 1);
      txt(ctx, n.name, n.x + n.w / 2, n.y + n.h / 2, active ? C.blue : C.text, 19, 'center', '700');
    });

    txt(ctx, 'd', 262, 200, C.muted, 18, 'center', '700');
    txt(ctx, 'K', 792, 76, C.muted, 18, 'center', '700');
    c.classList.add('is-ready');
  }, [sel]);

  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current;
    if (!c) return;
    const p = canvasPoint(e, c);
    const found = NODES.find((n) => p.x >= n.x && p.x <= n.x + n.w && p.y >= n.y && p.y <= n.y + n.h);
    if (found) setSel(found.id);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        onPointerDown={hit}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        <div className="chip-row">
          {NODES.map((n) => (
            <button key={n.id} className={`chip ${sel === n.id ? 'selected' : ''}`} onClick={() => setSel(n.id)}>
              {n.name}
            </button>
          ))}
        </div>
      </div>
      <div className="feedback">{node.detail}</div>
    </div>
  );
};

export default C8Arch;
