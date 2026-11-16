import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { WidgetProps } from './registry';

// Click-through the three columns of Figure 1. The pins sit on the figure;
// no prose is overlaid on the image itself.
const parts = [
  {
    id: 'vqa',
    n: 1,
    left: '3.2%',
    top: '8%',
    w: '29%',
    h: '82%',
    title: '左：互联网图文语料',
    desc: 'VQA、描述与交错图文都写成“问题 → 文本答案”的 token 序列。动作数据也按同样格式追加：问题 → 8 个整数 token。',
  },
  {
    id: 'vit',
    n: 2,
    left: '36%',
    top: '30%',
    w: '11%',
    h: '42%',
    title: 'ViT：把画面切成 patch',
    desc: '图像先经 ViT 编码成视觉 token；模型没有新增视觉模块，直接复用预训练主干。',
  },
  {
    id: 'llm',
    n: 3,
    left: '48%',
    top: '30%',
    w: '22%',
    h: '24%',
    title: '大语言模型：同一个词表',
    desc: '动作整数与文字共用词表。模型不必“换头”，只需在原有输出层把动作 token 也预测出来。',
  },
  {
    id: 'detok',
    n: 4,
    left: '40%',
    top: '66%',
    w: '22%',
    h: '18%',
    title: '去 token 化',
    desc: '“132 114 128 5 25 156” 还原成 ΔT=[0.1,−0.2,0]、ΔR=[10°,25°,−7°]，交给控制器执行。',
  },
  {
    id: 'loop',
    n: 5,
    left: '72%',
    top: '6%',
    w: '26%',
    h: '88%',
    title: '右：闭环执行',
    desc: '每条指令只推理一次、执行 8 个动作 token；下一帧再观察，形成闭环。55B 模型的查询频率约 1–3 Hz。',
  },
] as const;

export const Rt2ArchOverview: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState<string>('llm');
  const [zoom, setZoom] = useState(false);
  const chosen = parts.find((p) => p.id === active) || parts[2];
  return (
    <div>
      <div style={{ position: 'relative', border: '1px solid var(--rt2-line)', borderRadius: 10, overflow: 'hidden' }}>
        <img src="./images/paper/fig-1.png" alt="RT-2 总览：图文语料、模型与闭环控制" style={{ display: 'block', width: '100%', height: 'auto' }} />
        {parts.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            aria-label={`查看第 ${p.n} 个部件：${p.title}`}
            style={{
              position: 'absolute',
              left: p.left,
              top: p.top,
              width: p.w,
              height: p.h,
              background: active === p.id ? 'rgba(47,111,208,0.09)' : 'transparent',
              border: active === p.id ? '2px solid #2f6fd0' : 'none',
              boxShadow: active === p.id ? '0 0 0 4px rgba(47,111,208,0.06)' : 'none',
              borderRadius: 8,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                ...(p.id === 'llm'
                  ? { right: 4, bottom: 4 }
                  : { left: 4, top: 4 }),
                width: 22,
                height: 22,
                borderRadius: 11,
                background: active === p.id ? '#2f6fd0' : '#fff',
                color: active === p.id ? '#fff' : '#2f6fd0',
                border: '1px solid #2f6fd0',
                fontSize: 12,
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {p.n}
            </span>
          </button>
        ))}
      </div>
      <div className="rt2-controls">
        {parts.map((p) => (
          <button
            key={p.id}
            className={`rt2-btn ${active === p.id ? 'is-active' : ''}`}
            onClick={() => setActive(p.id)}
          >
            {p.n} · {p.title}
          </button>
        ))}
        <button className="rt2-btn" onClick={(e) => { e.stopPropagation(); setZoom(true); }}>放大原图</button>
      </div>
      {zoom ? createPortal(
        <div
          className="rt2-zoom"
          role="dialog"
          aria-label="放大查看图 1"
          onClick={(e) => { e.stopPropagation(); setZoom(false); }}
        >
          <img src="./images/paper/fig-1.png" alt="RT-2 架构原图（放大）" />
          <span className="rt2-zoom-hint">点击任意位置关闭</span>
        </div>,
        document.body,
      ) : null}
      <p className="rt2-note">
        <b>{chosen.title}：</b>
        {chosen.desc}
      </p>
    </div>
  );
};

export default Rt2ArchOverview;
