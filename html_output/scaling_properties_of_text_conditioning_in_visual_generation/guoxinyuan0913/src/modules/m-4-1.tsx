import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// §4 模块 4.1：逐词增益·GPG 计量台
// 同义句对照：劣质句（口语词多）→ 用户逐词点击替换为信息词 → GPG / 有图 logp 随接地比例上升。
const NO_IMG_LOGP = -5.8;

interface Slot {
  poor: string;
  good: string;
}

const TOKENS: (Slot | string)[] = [
  { poor: '就是那种', good: '黄昏时分的' },
  { poor: '大概很厉害的', good: '暖橙色天空' },
  '照片里',
  { poor: '好像有个什么', good: '一只白鹭' },
  { poor: '在上面', good: '贴着湖面低飞' },
  '，',
  { poor: '就感觉', good: '翅尖正' },
  { poor: '特别的好看吧', good: '溅起一串水花' },
  '。',
];

const N_SLOTS = TOKENS.filter((t) => typeof t !== 'string').length; // 6 个可替换位

export const M411: React.FC<WidgetProps> = () => {
  const [replaced, setReplaced] = useState<boolean[]>(() => TOKENS.map(() => false));

  const n = replaced.filter(Boolean).length;
  const ratio = n / N_SLOTS;
  const gpg = Math.round(14 + ratio * 172); // 14 → 186 nats（示意刻度，方向同论文 Eq.(1)）
  const imgLogp = (NO_IMG_LOGP + 3.7 * ratio).toFixed(2); // 每 token：-5.80 → -2.10

  const toggle = (i: number) =>
    setReplaced((r) => r.map((v, k) => (k === i ? !v : v)));

  const fb =
    ratio < 0.3
      ? { text: '大量词不看图也写得出——单据几乎没有携带图像独有信息', cls: 'fb-red' }
      : ratio < 0.65
        ? { text: '部分词由图像支撑，GPG 开始累积', cls: 'fb-blue' }
        : { text: '高接地比例：GPG 高。但这只是信息量的一半刻画——换 ED 再看（第 5 章）', cls: 'fb-green' };

  return (
    <div className="widget">
      <div className="gpg-hint">
        点击<b>灰色口语词</b>换成<b>橙色信息词</b>——两句是同一个意思，但看图才写得出的词越多，GPG 越高
      </div>

      <div className="gpg-sent">
        {TOKENS.map((t, i) => {
          if (typeof t === 'string') {
            return <span key={i} className="gpg-fixed">{t}</span>;
          }
          const on = replaced[i];
          return (
            <button
              key={i}
              className={on ? 'gpg-word gpg-word-on' : 'gpg-word'}
              onClick={() => toggle(i)}
              title={on ? '点击换回口语词' : '点击换成信息词'}
            >
              {on ? t.good : t.poor}
            </button>
          );
        })}
      </div>

      <div className="gpg-meter-row">
        <span className="gpg-meter-label">接地词比例</span>
        <div className="gpg-meter">
          <div className="gpg-meter-fill" style={{ width: `${ratio * 100}%` }} />
        </div>
        <span className="gpg-meter-val">{(ratio * 100).toFixed(0)}%</span>
      </div>

      <div className="gpg-stats">
        <div className="gpg-stat gpg-stat-gpg">
          <i>GPG（全句）</i>
          <b>{gpg} nats</b>
        </div>
        <div className="gpg-stat">
          <i>有图 logp / token</i>
          <b>{imgLogp}</b>
        </div>
        <div className="gpg-stat">
          <i>无图 logp / token</i>
          <b>{NO_IMG_LOGP.toFixed(2)}（恒定）</b>
        </div>
      </div>

      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
