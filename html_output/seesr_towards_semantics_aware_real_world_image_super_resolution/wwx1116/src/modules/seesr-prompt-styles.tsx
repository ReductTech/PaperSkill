import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, SeaCliffScene, StudioVignette } from './seesr-cover';

type StyleKey = 'none' | 'class' | 'caption' | 'tagLr' | 'tagHr';

const STYLES: Array<{ key: StyleKey; name: string; prompt: string }> = [
  { key: 'none', name: '空提示', prompt: '（不提供任何提示）' },
  { key: 'class', name: '分类式提示', prompt: '“promontory”' },
  { key: 'caption', name: '描述式提示', prompt: '“a bird flying over a body of water”' },
  { key: 'tagLr', name: '标签式提示 · 来自 LR', prompt: '“airplane, boat, island, mountain, ocean, rock, water”' },
  { key: 'tagHr', name: '标签式提示 · 来自 HR（参考）', prompt: '“boat, building, cliff, cruise ship, coast, hill, sea, rocky island”' },
];

const VERDICT: Record<StyleKey, { text: string; tone: string; art: 'blur' | 'boat' | 'bird' | 'plane' }> = {
  none: { text: '没有任何提示：糊的地方保持糊，细节没有被补出来。', tone: 'is-mid', art: 'blur' },
  class: { text: '只有一个整图类别：局部物体得不到语义支持，结果与空提示接近。', tone: 'is-mid', art: 'blur' },
  caption: { text: '句子被退化带偏：船被画成了鸟。', tone: 'is-bad', art: 'bird' },
  tagLr: { text: '标签更细，但混入了 airplane：船被画成了飞机。', tone: 'is-bad', art: 'plane' },
  tagHr: { text: '准确的物体清单：船恢复了船体、窗与栏杆（推理时拿不到 HR）。', tone: 'is-good', art: 'boat' },
};

/** S2 — four prompt styles, one damaged fragment. */
export function SeesrPromptStyles(_props: WidgetProps) {
  const [style, setStyle] = useState<StyleKey>('none');
  const current = VERDICT[style];
  const active = STYLES.find((item) => item.key === style)!;

  return (
    <div className="seesr-scene">
      <div className="seesr-promptlist" style={{ left: 0, top: 0, width: 440, height: 622 }}>
        <div className="seesr-h">提示词风格</div>
        {STYLES.map((item) => (
          <button key={item.key} type="button"
            className={`seesr-chip seesr-slip ${style === item.key ? 'is-on' : ''}`}
            onClick={() => setStyle(item.key)} aria-pressed={style === item.key}>
            <b>{item.name}</b>
            {style === item.key ? <em>{item.prompt}</em> : null}
          </button>
        ))}
      </div>

      <div className="seesr-frame" style={{ left: 456, top: 0, width: 620, height: 424 }}>
        <SeaCliffScene interpretation={current.art} damage={0.85} detail={1} />
        <div className="seesr-frame-note">{active.key === 'tagHr' ? '按 HR 标签补绘' : '按所选提示补绘'}</div>
      </div>

      <div className="seesr-panel seesr-plain" style={{ left: 456, top: 440, width: 620, height: 182 }}>
        <div className="seesr-lead">这一段残卷上，究竟画着什么？</div>
        <p className={`seesr-feedback ${current.tone}`} aria-live="polite">{current.text}</p>
      </div>

      <div className="seesr-panel" style={{ left: 1092, top: 0, width: 380, height: 622 }}>
        {style === 'tagLr' ? (
          <>
            <div className="seesr-h">论文里的同一处</div>
            <figure className="seesr-figure">
              <img src="./images/panel-tag-lr.png" alt="论文 Figure 1(d)：来自 LR 的标签式提示把船重建成飞机" />
            </figure>
            <p className="seesr-muted">Fig.1(d)：LR 标签混入 airplane，橙框里的船变成了带机翼的飞行器。</p>
          </>
        ) : (
          <>
            <div className="seesr-h">论文要求的两件事</div>
            <div className="seesr-criteria">
              <p><b>覆盖尽量多的物体</b><br />一个整图类别或一句描述都做不到。</p>
              <p><b>提示必须退化感知</b><br />标签模型本身对退化很敏感。</p>
            </div>
            <div className="seesr-figure">
              <StudioVignette mode="magnify" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
