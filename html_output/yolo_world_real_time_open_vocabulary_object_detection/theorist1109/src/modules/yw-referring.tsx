import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bloom, blooms, blue, drawBloom, drawMarket, drawPot, drawRing, drawTag, green, orange, paint, red } from './flowerKit';

type Phrase = {
  id: string;
  text: string;
  target: Bloom | null;
  kind: 'class' | 'look' | 'refer';
  note: string;
};

const phrases: Phrase[] = [
  { id: 'rose', text: '玫瑰', target: 'rose', kind: 'class', note: '类名提示，对应表里常见的开放词汇设定。' },
  { id: 'pitcher', text: '猪笼草', target: 'pitcher', kind: 'class', note: '稀有外形也能用名词直接提示。' },
  { id: 'red', text: '红瓣带刺那盆', target: 'rose', kind: 'look', note: '外形短语：不报类名，只写外观。' },
  { id: 'tube', text: '管状捕虫叶', target: 'pitcher', kind: 'look', note: '细粒度描述，仍指向同一盆猪笼草。' },
  { id: 'left-red', text: '左边那盆红的', target: 'rose', kind: 'refer', note: '指称短语演示：位置 + 颜色。画面布局固定，不是论文测得的定位分数。' },
  { id: 'right-tube', text: '右边管状捕虫的', target: 'pitcher', kind: 'refer', note: '指称短语演示：位置 + 外形。论文图 6–7 是定性例子，本页只做机制示意。' },
  { id: 'none', text: '蓝瓷花瓶', target: null, kind: 'refer', note: '词表外且画面没有的物体：不会圈中任何一盆。' },
];

const pots: Array<{ kind: Bloom; x: number; label: string }> = [
  { kind: 'fern', x: 220, label: '左后' },
  { kind: 'rose', x: 420, label: '左边红的' },
  { kind: 'sun', x: 620, label: '中间黄的' },
  { kind: 'pitcher', x: 800, label: '右边管状' },
];

export const YwReferring: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [id, setId] = useState('left-red');
  const phrase = useMemo(() => phrases.find((item) => item.id === id) || phrases[4], [id]);
  const w = 900;
  const h = 622;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = paint(canvas, w, h);
    drawMarket(ctx, w, h, 'front');
    pots.forEach((pot) => {
      const hit = phrase.target === pot.kind;
      drawPot(ctx, pot.x, 430, 0.82);
      drawBloom(ctx, pot.x, 386, pot.kind, 0.74, hit ? 0.95 : 0.08, hit ? 0 : 0.2);
      if (hit) {
        drawRing(ctx, pot.x, 412, green, 0.82);
        drawTag(ctx, pot.x, 250, phrase.text, green);
      }
      ctx.fillStyle = '#68778f';
      ctx.font = '700 20px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pot.label, pot.x, 500);
      ctx.textAlign = 'left';
    });
    if (!phrase.target) {
      drawTag(ctx, 450, 210, '没有匹配', red);
    }
    ctx.fillStyle = '#21324a';
    ctx.font = '700 28px "Microsoft YaHei", sans-serif';
    ctx.fillText(phrase.kind === 'refer' ? '指称说法也能圈花' : phrase.kind === 'look' ? '外形说法也能圈花' : '类名说法圈花', 36, 78);
    ctx.fillStyle = phrase.kind === 'refer' ? orange : blue;
    ctx.font = '700 22px "Microsoft YaHei", sans-serif';
    ctx.fillText('对照论文图 6–7 的定性演示，不是新的 AP 表', 36, 118);
  }, [phrase]);

  return <div className="yw-split">
    <canvas ref={ref} style={{ width: w, height: h, display: 'block' }} />
    <div className="yw-side">
      <h3 className="yw-h">自定义说法与指称短语</h3>
      <p className="yw-p">离线词表不必只写印刷类名。点一句提示，看哪一盆被圈住；画面没有的物体就不会亮。</p>
      <div className="yw-row">
        {phrases.map((item) => <button key={item.id} className={item.id === phrase.id ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setId(item.id)}>{item.text}</button>)}
      </div>
      <p className="yw-em" style={{ color: phrase.target ? green : red }}>{phrase.target ? blooms[phrase.target].name : '无匹配'}</p>
      <p className="yw-note">{phrase.note}</p>
    </div>
  </div>;
};
