import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  applyOps,
  createReferenceImage,
  diffImage,
  drawImageTo,
  meanAbsDiff,
  type Op,
} from './bsrganKit';

type Key = 'blur' | 'down' | 'gauss' | 'jpeg';

const FIXED: Key[] = ['blur', 'down', 'gauss', 'jpeg'];
const LABELS: Record<Key, { name: string; sym: string }> = {
  blur: { name: '模糊', sym: 'Biso' },
  down: { name: '下采样', sym: 'Ds' },
  gauss: { name: '高斯噪声', sym: 'NG' },
  jpeg: { name: 'JPEG', sym: 'NJPEG' },
};

const OP: Record<Key, Op> = {
  blur: { type: 'blur', kind: 'iso', width: 1.2, angle: 0, ratio: 1 },
  down: { type: 'down', mode: 'bicubic', scale: 2, align: false, a: 1 },
  gauss: { type: 'gauss', sigma: 8 },
  jpeg: { type: 'jpeg', quality: 60 },
};

export function Ch2Shuffle(_props: WidgetProps) {
  const [order, setOrder] = useState<Key[]>(['down', 'jpeg', 'blur', 'gauss']);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const fixedRef = useRef<HTMLCanvasElement>(null);
  const customRef = useRef<HTMLCanvasElement>(null);
  const diffRef = useRef<HTMLCanvasElement>(null);
  const hr = useMemo(() => createReferenceImage(320, 240), []);
  const fixed = useMemo(() => applyOps(hr, FIXED.map((k) => OP[k])), [hr]);
  const custom = useMemo(() => applyOps(hr, order.map((k) => OP[k])), [hr, order]);
  const diff = useMemo(() => diffImage(fixed, custom), [fixed, custom]);
  const mad = meanAbsDiff(fixed, custom);

  useEffect(() => { if (fixedRef.current) drawImageTo(fixedRef.current, fixed, true); }, [fixed]);
  useEffect(() => { if (customRef.current) drawImageTo(customRef.current, custom, true); }, [custom]);
  useEffect(() => { if (diffRef.current) drawImageTo(diffRef.current, diff, false); }, [diff]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return;
    setOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>, index: number) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag(index);
    setOver(index);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (drag === null) return;
    const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    const card = el?.closest('[data-card-index]') as HTMLElement | null;
    if (card) setOver(Number(card.dataset.cardIndex));
  };
  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (drag !== null && over !== null) move(drag, over);
    setDrag(null);
    setOver(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const reset = () => setOrder(['down', 'jpeg', 'blur', 'gauss']);
  const same = mad < 0.35;
  const feedback = same
    ? '当前顺序与固定链路的效果几乎一致（差值接近 0）。拖一张卡，让噪声或 JPEG 换个位置。'
    : mad < 3
      ? '顺序变了，但这组参数下差异还不大。试试把 JPEG 放到最前或最后。'
      : '顺序改变噪声与压缩的作用位置；差值图红色区域就是顺序造成的差异。';

  return (
    <div className="bsr-ch2-shuffle">
      <section className="bsr-shuffle-left">
        <div className="bsr-panel-head"><span>固定链路</span><b>模糊 → 下采样 → 高斯 → JPEG</b></div>
        <canvas ref={fixedRef} className="bsr-image bsr-compare-image" aria-label="固定顺序生成的 LR" />
        <div className="bsr-chain bsr-chain-small" aria-label="固定顺序">
          {FIXED.map((k, i) => (
            <React.Fragment key={k}>
              <div className="bsr-chain-node is-fixed"><span>{LABELS[k].name}</span><b>{LABELS[k].sym}</b></div>
              {i < 3 && <span className="bsr-chain-arrow">→</span>}
            </React.Fragment>
          ))}
        </div>
      </section>
      <section className="bsr-shuffle-right">
        <div className="bsr-panel-head">
          <span>打乱链路</span>
          <button className="bsr-text-btn" onClick={reset}>重置为示例顺序</button>
        </div>
        <div className="bsr-drag-row" role="group" aria-label="可拖动的退化算子顺序">
          {order.map((key, index) => (
            <button
              key={key}
              ref={(el) => { refs.current[index] = el; }}
              type="button"
              data-card-index={index}
              className={`bsr-drag-card ${drag === index ? 'is-dragging' : ''} ${over === index && drag !== null && drag !== index ? 'is-over' : ''}`}
              aria-label={`${LABELS[key].name}，第 ${index + 1} 位；拖动或按左右方向键调整顺序`}
              onPointerDown={(e) => onPointerDown(e, index)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => { setDrag(null); setOver(null); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') { e.preventDefault(); move(index, index - 1); }
                if (e.key === 'ArrowRight') { e.preventDefault(); move(index, index + 1); }
              }}
            >
              <span className="bsr-drag-handle" aria-hidden="true">⠿</span>
              <span>{LABELS[key].name}</span>
              <b>{LABELS[key].sym}</b>
              <em>{index + 1}</em>
            </button>
          ))}
        </div>
        <div className="bsr-shuffle-results">
          <figure>
            <canvas ref={customRef} className="bsr-compare-image" aria-label="打乱顺序生成的 LR" />
            <figcaption>打乱顺序的 LR</figcaption>
          </figure>
          <figure>
            <canvas ref={diffRef} className="bsr-diff-image" aria-label="两张 LR 的绝对差异图" />
            <figcaption>差异图（红 = 大）</figcaption>
          </figure>
          <div className="bsr-mad-card">
            <span>平均绝对差</span>
            <b>{mad.toFixed(2)}<em>/255</em></b>
            <p>教学示例，非论文指标</p>
          </div>
        </div>
        <p className={`bsr-feedback ${same ? 'is-blue' : 'is-orange'}`}>{feedback}</p>
        <p className="bsr-note">论文 Fig.1 打乱六类算子；本页用四类做对比。差值图为教学示例。</p>
      </section>
    </div>
  );
}
