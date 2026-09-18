import React, { useState } from 'react';
import { C } from './studioKit';
import type { WidgetProps } from './registry';

// §6 模块 6.2：规模阶梯端点（P4 芯片；技术视图）
// 只展示论文已验证的两个端点（Figure 9：思维链模式 GenEval++ 46.4% → 86.8%）；
// 两个端点均挂初步结论卡，共同揭示：LLM 学徒也参与影响文本质量。
// 无思考模式未发布具体数值 → 定性条；0.8B+思维链为标注的例外组合（不展示数值）。

type Size = '0.8B' | '397B';
type Mode = '无思考' | '思维链';

export const M621: React.FC<WidgetProps> = () => {
  const [size, setSize] = useState<Size>('0.8B');
  const [mode, setMode] = useState<Mode>('无思考');

  const pct =
    size === '397B' && mode === '思维链' ? 86.8
    : size === '0.8B' && mode === '思维链' ? null // 例外：劣化，无数值
    : size === '0.8B' ? 46.4
    : null; // 397B 无思考：未发布数值

  const fb =
    size === '397B' && mode === '思维链'
      ? { text: 'GenEval++ 46.4% → 86.8%：通用 LLM 的进步通过 SP 接口转化为图像质量', cls: 'fb-green' }
      : size === '0.8B' && mode === '思维链'
        ? { text: '最小规模下思维链常陷入循环、难产合法 JSON——该组合被论文标注为例外', cls: 'fb-orange' }
        : { text: '规模与推理模式整体正向，但该组合的逐级数值未发布，仅展示已验证端点', cls: 'fb-blue' };

  return (
    <div className="widget">
      <div className="bars">
        <div className="bar-item">
          <div className="bar-track">
            <div className="bar-fill" style={{ width: pct ? `${pct}%` : '38%', background: pct ? C.blue : C.border, opacity: pct ? 1 : 0.6 }} />
            <span className="bar-num">{pct !== null ? pct + '%' : mode === '思维链' ? '劣化' : '—'}</span>
          </div>
          <div className="bar-label">GenEval++（越高越好）· {size} · {mode}</div>
        </div>
        <div className="bar-item">
          <div className="bar-track">
            <div className="bar-fill" style={{ width: '86.8%', background: C.green }} />
            <span className="bar-num">86.8%</span>
          </div>
          <div className="bar-label">已验证端点：397B · 思维链（Figure 9）</div>
        </div>
      </div>
      <div className="ctrl-row">
        <button className={size === '0.8B' ? 'chip chip-on' : 'chip'} onClick={() => setSize('0.8B')}>0.8B 提示器</button>
        <button className={size === '397B' ? 'chip chip-on' : 'chip'} onClick={() => setSize('397B')}>397B 提示器</button>
        <button className={mode === '无思考' ? 'chip chip-on' : 'chip'} onClick={() => setMode('无思考')}>无思考</button>
        <button className={mode === '思维链' ? 'chip chip-on' : 'chip'} onClick={() => setMode('思维链')}>思维链</button>
      </div>

      {/* 规模阶梯的两个端点 + 初步结论 */}
      <div className="lad">
        <div className="lad-end">
          <b>端点 A · 最小学徒（0.8B）</b>
          <span className="lad-score">46.4%</span>
          <i>最小提示器难产合法字段——分数垫底</i>
        </div>
        <div className="lad-dots">⋯ 阶梯 ⋯</div>
        <div className="lad-end lad-end-top">
          <b>端点 B · 顶级学徒（397B + 思维链）</b>
          <span className="lad-score lad-score-top">86.8%</span>
          <i>同一个生成骨干，LLM 的语言能力经 SP 接口灌进画面</i>
        </div>
      </div>
      <div className="lad-conclusion">
        初步结论：两端点之间<b>只换了学徒、没动生成骨干</b>，画面质量相差 40 个百分点——
        <b>LLM 学徒也参与影响文本质量</b>，可提示性不只是生成模型的事。
      </div>

      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
