import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { Notice, Segmented, Stat, Token } from './common';

const finalTokens = ['蓝', '色', '蚂', '蚁', '抱', '着', '一', '只', '茶', '杯', '微', '笑'];
const revealOrder = [0, 11, 3, 7, 1, 9, 5, 10, 2, 6, 4, 8];

export const DenoisePlayer: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState('bdlm');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const maxSteps = mode === 'ar' ? finalTokens.length : 6;
  const visible = useMemo(() => {
    if (mode === 'ar') return new Set(Array.from({ length: step }, (_, index) => index));
    return new Set(revealOrder.slice(0, Math.min(finalTokens.length, step * 2)));
  }, [mode, step]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStep((value) => {
        if (value >= maxSteps) {
          setPlaying(false);
          return value;
        }
        return value + 1;
      });
    }, 620);
    return () => window.clearInterval(timer);
  }, [playing, maxSteps]);
  const switchMode = (value: string) => {
    setMode(value);
    setStep(0);
    setPlaying(false);
  };
  return (
    <div className="ll-widget">
      <Segmented label="选择采样方式" value={mode} onChange={switchMode} items={[
        { value: 'ar', label: 'AR：从左到右' },
        { value: 'bdlm', label: 'BDLM：块内并行' },
      ]} />
      <div className={`denoise-stage ${mode}`}>
        <div className="denoise-beam" style={{ width: `${Math.max(2, (step / maxSteps) * 100)}%` }} />
        <div className="task-token-row">
          {finalTokens.map((token, index) => <Token key={index} kind={visible.has(index) ? 'done' : 'mask'} label={visible.has(index) ? token : 'M'} delay={index * 25} />)}
        </div>
      </div>
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => setStep((value) => Math.max(0, value - 1))}>上一步</button>
        <span className="step-label">轮次 <b>{step}/{maxSteps}</b></span>
        <button type="button" className="tiny ghost" onClick={() => setStep((value) => Math.min(maxSteps, value + 1))}>下一步</button>
        <button type="button" className="tiny" onClick={() => setPlaying((value) => !value)}>{playing ? '暂停' : '播放'}</button>
      </div>
      <Notice tone={step === maxSteps ? 'green' : 'blue'}>
        {mode === 'ar'
          ? 'AR 教学对照：每步只新增左侧的一个 token。'
          : 'BDLM 教学对照：同一轮可恢复当前块里的多个 token，顺序不必严格从左到右。'}
        {' '}这不等价于“任何扩散实现都一定更快”。
      </Notice>
    </div>
  );
};

const stages = [
  { id: 's0', name: 'S0 对齐', tokens: '100B', color: 'purple', desc: '先让视觉 token 与语言骨干坐标对齐，建立共同词典。', bars: [42, 25, 18] },
  { id: 's1', name: 'S1 多任务预训练', tokens: '210B', color: 'blue', desc: '混合理解、生成、编辑和交错数据，扩大任务覆盖。', bars: [76, 82, 66] },
  { id: 's2', name: 'S2 SFT', tokens: '80B', color: 'green', desc: '通过指令微调改善可控性与回答格式，并处理长度差异。', bars: [88, 86, 91] },
];

export const CurriculumLab: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState(0);
  const stage = stages[selected];
  return (
    <div className="ll-widget">
      <div className="curriculum-track">
        {stages.map((item, index) => (
          <button type="button" key={item.id} className={index <= selected ? `done ${item.color}` : ''} onClick={() => setSelected(index)}>
            <small>{item.id.toUpperCase()}</small><b>{item.name}</b><span>{item.tokens} tokens</span>
          </button>
        ))}
      </div>
      <div className="ability-bars">
        {['图文对齐', '任务覆盖', '指令服从'].map((label, index) => (
          <div key={label}><span>{label}</span><i><b style={{ width: `${stage.bars[index]}%` }} /></i><strong>{stage.bars[index]}%</strong></div>
        ))}
      </div>
      <Notice tone={selected === 2 ? 'green' : 'blue'}>{stage.desc} 百分比是能力演化示意；100B/210B/80B 是论文报告的阶段 token 数。</Notice>
    </div>
  );
};

type PackItem = { id: string; label: string; size: number; type: string };
const packItems: PackItem[] = [
  { id: 'a', label: 'T2I', size: 3, type: 'pink' },
  { id: 'b', label: 'MMU', size: 2, type: 'purple' },
  { id: 'c', label: 'Editing', size: 4, type: 'green' },
  { id: 'd', label: 'Text', size: 2, type: 'yellow' },
  { id: 'e', label: 'Interleaved', size: 5, type: 'blue' },
];

export const PackingLab: React.FC<WidgetProps> = () => {
  const capacity = 8;
  const [bins, setBins] = useState<string[][]>([[], []]);
  const placed = new Set(bins.flat());
  const add = (item: PackItem, binIndex: number) => {
    const used = bins[binIndex].reduce((sum, id) => sum + (packItems.find((entry) => entry.id === id)?.size || 0), 0);
    if (placed.has(item.id) || used + item.size > capacity) return;
    setBins((prev) => prev.map((bin, index) => index === binIndex ? [...bin, item.id] : bin));
  };
  const autoPack = () => {
    const next: string[][] = [[], []];
    const used = [0, 0];
    [...packItems].sort((a, b) => b.size - a.size).forEach((item) => {
      const target = used[0] <= used[1] ? 0 : 1;
      if (used[target] + item.size <= capacity) {
        next[target].push(item.id);
        used[target] += item.size;
      } else {
        const other = 1 - target;
        if (used[other] + item.size <= capacity) {
          next[other].push(item.id);
          used[other] += item.size;
        }
      }
    });
    setBins(next);
  };
  const usedTotal = bins.flat().reduce((sum, id) => sum + (packItems.find((entry) => entry.id === id)?.size || 0), 0);
  return (
    <div className="ll-widget">
      <div className="pack-source">
        {packItems.map((item) => (
          <button
            type="button"
            draggable
            key={item.id}
            disabled={placed.has(item.id)}
            className={`pack-item ${item.type}`}
            style={{ '--units': item.size } as React.CSSProperties}
            onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
            onClick={() => add(item, bins[0].reduce((s, id) => s + (packItems.find((x) => x.id === id)?.size || 0), 0) <= bins[1].reduce((s, id) => s + (packItems.find((x) => x.id === id)?.size || 0), 0) ? 0 : 1)}
          >
            {item.label}<small>{item.size} 格</small>
          </button>
        ))}
      </div>
      <div className="pack-bins">
        {bins.map((bin, binIndex) => {
          const used = bin.reduce((sum, id) => sum + (packItems.find((entry) => entry.id === id)?.size || 0), 0);
          return (
            <div
              key={binIndex}
              className="pack-bin"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const item = packItems.find((entry) => entry.id === e.dataTransfer.getData('text/plain'));
                if (item) add(item, binIndex);
              }}
            >
              <div className="pack-bin-head"><b>固定长度序列 {binIndex + 1}</b><span>{used}/{capacity}</span></div>
              <div className="pack-slots">
                {bin.map((id) => {
                  const item = packItems.find((entry) => entry.id === id)!;
                  return <span key={id} className={item.type} style={{ flex: item.size }}>{item.label}</span>;
                })}
                {used < capacity ? <span className="padding" style={{ flex: capacity - used }}>Padding {capacity - used}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => setBins([[], []])}>清空</button>
        <button type="button" className="tiny" onClick={autoPack}>自动 Packing</button>
      </div>
      <div className="metrics">
        <Stat label="有效 token 格" value={String(usedTotal)} tone="green" />
        <Stat label="Padding 格" value={String(capacity * 2 - usedTotal)} tone={usedTotal > 12 ? 'green' : 'orange'} />
        <Stat label="批次利用率" value={`${Math.round((usedTotal / (capacity * 2)) * 100)}%`} tone="blue" />
      </div>
      <Notice>可拖拽，也可点击样本。论文做法是把多个短样本拼入固定长度序列，减少 padding 和无效算力。</Notice>
    </div>
  );
};

export const SprintLab: React.FC<WidgetProps> = () => {
  const [prefix, setPrefix] = useState(46);
  const [threshold, setThreshold] = useState(93);
  const tokens = Array.from({ length: 18 }, (_, index) => ({ index, confidence: 70 + ((index * 17) % 29) }));
  const keptPrefix = Math.max(2, Math.round((prefix / 100) * 8));
  const accepted = tokens.filter((token) => token.index >= 8 && token.confidence >= threshold).length;
  return (
    <div className="ll-widget">
      <div className="sprint-track">
        {tokens.map((token) => {
          const prefixToken = token.index < 8;
          const kept = !prefixToken || token.index >= 8 - keptPrefix;
          const early = !prefixToken && token.confidence >= threshold;
          return (
            <div key={token.index} className={`sprint-token ${prefixToken ? kept ? 'prefix-kept' : 'prefix-pruned' : early ? 'early' : 'refine'}`}>
              <span>{prefixToken ? kept ? 'P' : '×' : early ? '✓' : 'M'}</span>
              <small>{prefixToken ? 'prefix' : `${token.confidence}%`}</small>
            </div>
          );
        })}
      </div>
      <div className="ctrl">
        <label>稀疏保留前缀 <span className="val">{prefix}%</span></label>
        <input aria-label="调整稀疏前缀保留比例" type="range" min="25" max="100" value={prefix} onChange={(e) => setPrefix(Number(e.target.value))} />
      </div>
      <div className="ctrl">
        <label>置信阈值 <span className="val">{(threshold / 100).toFixed(2)}</span></label>
        <input aria-label="调整置信度阈值" type="range" min="85" max="99" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
      </div>
      <div className="metrics">
        <Stat label="保留 prefix token" value={`${keptPrefix}/8`} tone="blue" />
        <Stat label="本轮提前揭开" value={String(accepted)} tone="green" />
        <Stat label="论文固定锚点" value="1.6× TPS" note="24.3 → 39.8" tone="orange" />
      </div>
      <Notice tone="orange">滑杆只解释两种机制的方向，不外推真实吞吐。论文消融：平均分 76.3→75.7，TPS 24.3→39.8。</Notice>
    </div>
  );
};

