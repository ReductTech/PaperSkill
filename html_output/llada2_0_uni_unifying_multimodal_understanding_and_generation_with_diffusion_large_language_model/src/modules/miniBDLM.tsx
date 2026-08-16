import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { Notice, Stat, Token } from './common';

type Counts = Record<string, Record<string, number>>;

const corpus = [
  ['图', '文', '共享', '离散', '空间', '支持', '理解', '生成'],
  ['文本', '图像', '共享', '离散', '空间', '并行', '预测', '答案'],
  ['前序', '块', '条件', '当前', '块', '并行', '显影', '答案'],
  ['图', '文', '统一', '目标', '支持', '编辑', '理解', '生成'],
  ['语义', 'token', '进入', '共享', '骨干', '预测', '图像', '答案'],
];
const sample = ['图', '文', '共享', '离散', '空间', '并行', '预测', '答案'];
const vocab = Array.from(new Set(corpus.flat()));

function buildCounts(rounds: number): Counts {
  const counts: Counts = {};
  for (let r = 0; r < rounds; r += 1) {
    const sentence = corpus[r % corpus.length];
    sentence.forEach((token, index) => {
      const context = index === 0 ? '<s>' : sentence[index - 1];
      counts[context] ||= {};
      counts[context][token] = (counts[context][token] || 0) + 1;
    });
  }
  return counts;
}

function distribution(counts: Counts, context: string) {
  const row = counts[context] || {};
  const total = Object.values(row).reduce((sum, value) => sum + value, 0) + vocab.length;
  return vocab
    .map((token) => ({ token, p: ((row[token] || 0) + 1) / total }))
    .sort((a, b) => b.p - a.p);
}

export const MiniBDLMTraining: React.FC<WidgetProps> = () => {
  const [rounds, setRounds] = useState(0);
  const [ratio, setRatio] = useState(50);
  const counts = useMemo(() => buildCounts(rounds), [rounds]);
  const masked = useMemo(
    () => new Set(sample.map((_, index) => index).filter((index) => ((index * 37 + 19) % 100) < ratio)),
    [ratio],
  );
  const evaluation = useMemo(() => {
    let loss = 0;
    let correct = 0;
    const predictions = sample.map((target, index) => {
      const context = index === 0 ? '<s>' : sample[index - 1];
      const dist = distribution(counts, context);
      const targetP = dist.find((entry) => entry.token === target)?.p || 1 / vocab.length;
      if (masked.has(index)) {
        loss += -Math.log(targetP);
        if (dist[0].token === target) correct += 1;
      }
      return dist[0];
    });
    const count = Math.max(1, masked.size);
    return { loss: loss / count, accuracy: correct / count, predictions };
  }, [counts, masked]);

  return (
    <div className="ll-widget mini-lab">
      <div className="repro-ribbon"><b>机制级复现</b><span>微型条件计数模型 · 不含论文权重</span></div>
      <div className="mini-columns">
        <div className="mini-panel">
          <small>输入 x_t（只在 MASK 位置计损失）</small>
          <div className="task-token-row">
            {sample.map((token, index) => <Token key={index} kind={masked.has(index) ? 'mask' : 'text'} label={masked.has(index) ? 'MASK' : token} />)}
          </div>
        </div>
        <div className="mini-panel">
          <small>当前模型预测</small>
          <div className="task-token-row">
            {sample.map((token, index) => (
              <Token
                key={index}
                kind={!masked.has(index) ? 'text' : evaluation.predictions[index].token === token ? 'done' : 'mask'}
                label={!masked.has(index) ? '条件' : evaluation.predictions[index].token}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="ctrl">
        <label>Mask 比例 <span className="val">{ratio}%</span></label>
        <input aria-label="调整训练 Mask 比例" type="range" min="20" max="85" step="5" value={ratio} onChange={(e) => setRatio(Number(e.target.value))} />
      </div>
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => setRounds(0)}>重置模型</button>
        <button type="button" className="tiny" onClick={() => setRounds((value) => Math.min(20, value + 1))}>训练一轮</button>
      </div>
      <div className="metrics">
        <Stat label="已见样本" value={String(rounds)} tone="blue" />
        <Stat label="Mask 平均 NLL" value={evaluation.loss.toFixed(2)} tone={evaluation.loss < 2.5 ? 'green' : 'orange'} />
        <Stat label="Mask 命中率" value={`${Math.round(evaluation.accuracy * 100)}%`} tone={evaluation.accuracy > 0.5 ? 'green' : 'red'} />
      </div>
      <code className="algo-formula">loss = -mean(log p(target_i | clean previous blocks, noisy current block)), i only in MASK positions</code>
      <Notice tone={rounds > 4 ? 'green' : 'orange'}>
        {rounds > 4
          ? '计数确实由浏览器里的小语料更新，损失和预测会随训练数据变化；它复现的是目标函数形状。'
          : '继续训练，观察只对 MASK 位置计算的损失如何变化。真实论文使用 16B MoE 和大规模多阶段数据。'}
      </Notice>
    </div>
  );
};

const target = ['图', '文', '在', '同', '一', '空', '间', '并', '行', '生', '成', '答'];
const confidence = [0.96, 0.76, 0.91, 0.66, 0.88, 0.59, 0.81, 0.94, 0.63, 0.86, 0.71, 0.98];

export const MiniBDLMSampling: React.FC<WidgetProps> = () => {
  const [blockSize, setBlockSize] = useState(4);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [calls, setCalls] = useState(0);
  const [auto, setAuto] = useState(false);

  const currentBlock = Math.min(Math.floor(revealed.size / blockSize), Math.ceil(target.length / blockSize) - 1);
  const blockStart = currentBlock * blockSize;
  const blockIndices = Array.from({ length: Math.min(blockSize, target.length - blockStart) }, (_, i) => blockStart + i);
  const remaining = blockIndices.filter((index) => !revealed.has(index));

  const step = () => {
    if (revealed.size >= target.length) {
      setAuto(false);
      return;
    }
    const nextCandidates = [...remaining].sort((a, b) => confidence[b] - confidence[a]).slice(0, Math.max(1, Math.ceil(blockSize / 2)));
    setRevealed((previous) => new Set([...previous, ...nextCandidates]));
    setCalls((value) => value + 1);
  };

  useEffect(() => {
    if (!auto) return;
    const timer = window.setInterval(step, 720);
    return () => window.clearInterval(timer);
  });

  const reset = (nextBlock = blockSize) => {
    setBlockSize(nextBlock);
    setRevealed(new Set());
    setCalls(0);
    setAuto(false);
  };

  return (
    <div className="ll-widget mini-lab">
      <div className="sampling-header">
        <div><small>前序块</small><b>保持干净，作为条件</b></div>
        <div><small>当前块</small><b>块内并行去 Mask</b></div>
      </div>
      <div className="sampling-track">
        {target.map((token, index) => {
          const done = revealed.has(index);
          const active = index >= blockStart && index < blockStart + blockSize && !done;
          return (
            <div key={index} className={`sample-cell ${done ? 'done' : active ? 'current' : 'future'}`}>
              <Token kind={done ? 'done' : 'mask'} label={done ? token : 'M'} active={active} />
              <small>{done ? `${Math.round(confidence[index] * 100)}%` : active ? '待预测' : '未来块'}</small>
            </div>
          );
        })}
      </div>
      <div className="ctrl">
        <label>Block size <span className="val">{blockSize}</span></label>
        <input aria-label="调整 block size" type="range" min="2" max="6" step="2" value={blockSize} onChange={(e) => reset(Number(e.target.value))} />
      </div>
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => reset()}>重置</button>
        <button type="button" className="tiny ghost" onClick={step} disabled={revealed.size >= target.length}>采样一步</button>
        <button type="button" className="tiny" onClick={() => setAuto((value) => !value)} disabled={revealed.size >= target.length}>{auto ? '暂停' : '自动显影'}</button>
      </div>
      <div className="metrics">
        <Stat label="已恢复" value={`${revealed.size}/${target.length}`} tone={revealed.size === target.length ? 'green' : 'blue'} />
        <Stat label="BDLM 前向轮" value={String(calls)} tone="green" />
        <Stat label="AR 对照" value="12 token 步" tone="orange" />
      </div>
      <Notice tone={revealed.size === target.length ? 'green' : 'blue'}>
        {revealed.size === target.length
          ? '完成：块之间保留顺序，块内部按置信度并行揭开。'
          : '点击“采样一步”：当前块里高置信位置先显影，当前块完成后才进入下一块。'}
      </Notice>
    </div>
  );
};

