import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C } from './seesr-cover';

type Key = 'gt' | 'lr' | 'esrgan' | 'stablesr' | 'diffbir' | 'pasd' | 'seesr';

const COLS: Array<{
  key: Key; name: string; verdict: string; img: string;
  confusion?: number; best?: number; note: string; tone: string;
}> = [
  {
    key: 'gt', name: 'GT', verdict: '真值：白色游船', img: './images/qual-gt.png',
    note: '论文的真值（HR）图像：红框处是游船的船体、栏杆与窗。它只作参照，不是参赛方法。', tone: 'is-good',
  },
  {
    key: 'lr', name: 'Zoomed LR', verdict: '放大后仍是一团色块', img: './images/qual-lr.png',
    note: '放大后的 LR：只剩蓝白色块，船的结构已经不可辨认——这正是“语义不足”的起点。', tone: 'is-bad',
  },
  {
    key: 'esrgan', name: 'Real-ESRGAN', verdict: '军舰式轮廓', img: './images/qual-esrgan.png',
    confusion: 5.4, best: 0,
    note: '生成出军舰式的锐利轮廓：细节是编出来的，和这艘游船对不上。', tone: 'is-bad',
  },
  {
    key: 'stablesr', name: 'StableSR', verdict: '语义含糊', img: './images/qual-stablesr.png',
    confusion: 5.4, best: 14.3,
    note: '结构错位、语义含糊：缺少文本提示时，模型只能靠图像先验猜。', tone: 'is-bad',
  },
  {
    key: 'diffbir', name: 'DiffBIR', verdict: '画成了鱼', img: './images/qual-diffbir.png',
    confusion: 12.5, best: 15.2,
    note: '把船画成了鱼：语义被先验带偏，这也是论文用来对比“缺少语义条件”的例子。', tone: 'is-bad',
  },
  {
    key: 'pasd', name: 'PASD', verdict: '画成了鸟', img: './images/qual-pasd.png',
    confusion: 10.7, best: 13.4,
    note: 'PASD 的描述模型输出错误语义，结果长出了翅膀：说明提示的来源同样关键。', tone: 'is-bad',
  },
  {
    key: 'seesr', name: 'SeeSR', verdict: '船体、栏杆与窗', img: './images/qual-seesr.png',
    confusion: 38.6, best: 57.1,
    note: '保留了船体轮廓、栏杆与窗：硬提示给物体名，软提示补上阈值之外的信息。', tone: 'is-good',
  },
];

/** S10 — Figure 4 (case 1, zoom row) plus the user-study numbers. */
export function SeesrQualitative(_props: WidgetProps) {
  const [selected, setSelected] = useState<Key>('seesr');
  const current = COLS.find((item) => item.key === selected)!;

  return (
    <div className="seesr-scene">
      <div className="seesr-qualrow" style={{ left: 0, top: 0, width: 1472, height: 296 }}>
        {COLS.map((col) => (
          <button key={col.key} type="button"
            className={`seesr-qualcol ${selected === col.key ? 'is-on' : ''}`}
            onClick={() => setSelected(col.key)} aria-pressed={selected === col.key}>
            <b>{col.name}</b>
            <img src={col.img} alt={`${col.name} 对同一处船只细节的复原结果`} />
            <span className={selected === col.key ? `is-${col.tone.slice(3)}` : ''}>{col.verdict}</span>
          </button>
        ))}
      </div>

      <div className="seesr-panel" style={{ left: 0, top: 312, width: 900, height: 310 }}>
        <div className="seesr-h">用户研究：{current.name}</div>
        {current.confusion === undefined ? (
          <p className="seesr-muted">这一列不是参赛方法，用户研究里没有它的数据。</p>
        ) : (
          <>
            <div className="seesr-userbar">
              <span>合成数据混淆率 ↑</span>
              <span className="seesr-bar"><i style={{ width: `${(current.confusion! / 60) * 100}%`, background: C.blue }} /></span>
              <b>{current.confusion!.toFixed(1)}%</b>
            </div>
            <div className="seesr-userbar">
              <span>真实数据最佳率 ↑</span>
              <span className="seesr-bar"><i style={{ width: `${(current.best! / 60) * 100}%`, background: C.green }} /></span>
              <b>{current.best!.toFixed(1)}%</b>
            </div>
            <p className="seesr-muted">20 名参与者、6 个方法、16 组合成数据与 16 组真实数据；混淆率越高说明越难与 GT 区分。</p>
          </>
        )}
      </div>

      <div className="seesr-panel seesr-plain" style={{ left: 916, top: 312, width: 556, height: 310 }}>
        <p className={`seesr-feedback ${current.tone}`} aria-live="polite">{current.note}</p>
        <p className="seesr-muted">图像为论文图 4 第一例的放大行裁剪；结论只针对这一组图。</p>
      </div>
    </div>
  );
}
