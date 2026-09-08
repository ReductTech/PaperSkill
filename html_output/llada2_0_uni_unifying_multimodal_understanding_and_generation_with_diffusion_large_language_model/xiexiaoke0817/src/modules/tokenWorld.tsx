import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { Notice, Segmented, Stat, Token, type TokenKind } from './common';

export const SemanticTokenizerLab: React.FC<WidgetProps> = () => {
  const [semantic, setSemantic] = useState(74);
  const semanticScore = Math.round(40 + semantic * 0.55);
  const detailScore = Math.round(96 - semantic * 0.38);
  const codeCount = 16384;
  const tiles = useMemo(() => {
    const labels = semantic > 66
      ? ['人物', '杯子', '竹叶', '文字', '衣料', '光照', '布局', '动作']
      : semantic > 33
      ? ['暖色', '圆形', '竖线', '纹理', '亮区', '边缘', '绿色', '方块']
      : ['#7A', '#18', '#E2', '#4C', '#90', '#31', '#B7', '#0D'];
    return labels;
  }, [semantic]);
  return (
    <div className="ll-widget tokenizer-lab">
      <div className="tokenizer-preview">
        <div className="preview-image" aria-label="教学示意图：人物、杯子和竹叶"><span>人</span><span>杯</span><span>竹</span></div>
        <div className="tokenizer-arrow">语义量化 →</div>
        <div className="semantic-codes">
          {tiles.map((label, index) => <Token key={index} kind="image" label={label} delay={index * 45} />)}
        </div>
      </div>
      <div className="ctrl">
        <label>语义侧重 <span className="val">{semantic}%</span></label>
        <input aria-label="调整语义侧重" type="range" min="0" max="100" value={semantic} onChange={(e) => setSemantic(Number(e.target.value))} />
      </div>
      <div className="metrics">
        <Stat label="语义可读性" value={`${semanticScore}%`} tone="green" />
        <Stat label="细节示意" value={`${detailScore}%`} tone={detailScore > 70 ? 'blue' : 'orange'} />
        <Stat label="论文 codebook" value={codeCount.toLocaleString()} note="每码 2048 维" tone="purple" />
      </div>
      <Notice tone="orange">滑杆是教学模型，不是论文消融曲线。论文选择语义 token 支撑理解，但也明确承认极细图像细节仍可能损失。</Notice>
    </div>
  );
};

const tokenLayout: TokenKind[] = [
  'special','text','text','text','special','image','image','image','image','image','special','text',
  'text','text','special','image','image','image','image','special','text','text','text','text',
  'special','image','image','image','text','text','text','special','image','image','text','text',
  'image','image','special','text','text','image','image','image','special','text','text','text',
];

export const PixelMaskSwap: React.FC<WidgetProps> = () => {
  const [pattern, setPattern] = useState('center');
  const [revealed, setRevealed] = useState(false);
  const maskSet = useMemo(() => {
    const set = new Set<number>();
    tokenLayout.forEach((_, index) => {
      const x = index % 12;
      const y = Math.floor(index / 12);
      if (pattern === 'center' && x >= 4 && x <= 8 && y >= 1 && y <= 2) set.add(index);
      if (pattern === 'future' && x >= 7) set.add(index);
      if (pattern === 'checker' && (x + y) % 3 === 0) set.add(index);
    });
    return set;
  }, [pattern]);
  return (
    <div className="ll-widget">
      <Segmented
        label="选择遮盖形状"
        value={pattern}
        onChange={(value) => { setPattern(value); setRevealed(false); }}
        items={[
          { value: 'center', label: '局部编辑块' },
          { value: 'future', label: '未来片段' },
          { value: 'checker', label: '扩散噪声' },
        ]}
      />
      <div className={`pixel-swap ${revealed ? 'revealed' : ''}`}>
        {tokenLayout.map((kind, index) => {
          const masked = maskSet.has(index);
          return (
            <button
              type="button"
              key={index}
              className={`pixel-cell ${masked ? 'masked' : ''} ${kind}`}
              style={{ animationDelay: `${(index % 12) * 18}ms` }}
              title={masked ? (revealed ? '已恢复原 token' : '待预测 MASK') : '条件 token'}
              onClick={() => masked && setRevealed((value) => !value)}
            >
              {masked && !revealed ? '×' : kind === 'text' ? 'T' : kind === 'image' ? 'V' : 'S'}
            </button>
          );
        })}
      </div>
      <div className="step-ctrl">
        <button type="button" className={`tiny ${revealed ? 'ghost' : ''}`} onClick={() => setRevealed((value) => !value)}>
          {revealed ? '重新盖上 Mask' : '块状显影'}
        </button>
      </div>
      <Notice tone={revealed ? 'green' : 'blue'}>
        {revealed ? '揭开的仍然是离散 token；图像 token 之后还要交给扩散解码器恢复像素。' : 'PixelSwap 在这里被改造成论文逻辑：像素块不是装饰，而是“哪一组 token 正在被并行预测”。'}
      </Notice>
    </div>
  );
};

export const TaskMaskStudio: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState('understand');
  const configs: Record<string, { title: string; cells: Array<{ kind: TokenKind; label: string }>; note: string }> = {
    understand: {
      title: '看图回答：最高降雨量在哪个区域？',
      cells: [
        { kind: 'special', label: '<img>' }, { kind: 'image', label: '图表' }, { kind: 'special', label: '</img>' },
        { kind: 'text', label: '问题' }, { kind: 'text', label: '最高' }, { kind: 'text', label: '区域' },
        { kind: 'special', label: '<ans>' }, { kind: 'mask', label: 'MASK' }, { kind: 'mask', label: 'MASK' },
      ],
      note: '理解任务：图像与问题是条件，只遮住答案文本。',
    },
    generate: {
      title: '生成：一只抱着茶杯的蓝色小蚂蚁',
      cells: [
        { kind: 'text', label: '蓝色' }, { kind: 'text', label: '蚂蚁' }, { kind: 'text', label: '茶杯' },
        { kind: 'special', label: '<h,w>' }, { kind: 'mask', label: 'MASK' }, { kind: 'mask', label: 'MASK' },
        { kind: 'mask', label: 'MASK' }, { kind: 'mask', label: 'MASK' }, { kind: 'mask', label: 'MASK' },
      ],
      note: '生成任务：提示词保留，目标图像 token 被 Mask。',
    },
    edit: {
      title: '编辑：保留人物，把白裙改为金色',
      cells: [
        { kind: 'image', label: '参考图' }, { kind: 'text', label: '改裙色' }, { kind: 'special', label: '<target>' },
        { kind: 'mask', label: 'MASK' }, { kind: 'mask', label: 'MASK' }, { kind: 'mask', label: 'MASK' },
        { kind: 'mask', label: 'MASK' }, { kind: 'mask', label: 'MASK' }, { kind: 'special', label: '</target>' },
      ],
      note: '编辑任务：参考图和指令作为条件，目标图区域待预测。',
    },
    interleave: {
      title: '交错：步骤文字 ↔ 过程图 ↔ 下一步文字',
      cells: [
        { kind: 'text', label: '步骤1' }, { kind: 'image', label: '图1' }, { kind: 'text', label: '步骤2' },
        { kind: 'image', label: '图2' }, { kind: 'mask', label: 'MASK' }, { kind: 'mask', label: 'MASK' },
        { kind: 'mask', label: 'MASK' }, { kind: 'mask', label: 'MASK' }, { kind: 'special', label: '<eos>' },
      ],
      note: '交错任务：已完成的图文片段共同条件化未来片段。',
    },
  };
  const current = configs[mode];
  return (
    <div className="ll-widget">
      <Segmented
        label="切换统一任务"
        value={mode}
        onChange={setMode}
        items={[
          { value: 'understand', label: '理解' },
          { value: 'generate', label: '生成' },
          { value: 'edit', label: '编辑' },
          { value: 'interleave', label: '交错' },
        ]}
      />
      <div className="mask-studio">
        <strong>{current.title}</strong>
        <div className="task-token-row">
          {current.cells.map((cell, index) => <Token key={index} kind={cell.kind} label={cell.label} delay={index * 45} />)}
        </div>
      </div>
      <Notice tone="green">{current.note} 统一的是表示与目标，不是把任务差异抹掉。</Notice>
    </div>
  );
};

export const ArchitectureRoute: React.FC<WidgetProps> = () => {
  const [route, setRoute] = useState('understand');
  const nodes = [
    { id: 'text', label: 'Text Tokenizer', routes: ['understand','generate','edit'] },
    { id: 'vision', label: 'SigLIP-VQ', routes: ['understand','edit'] },
    { id: 'backbone', label: '16B MoE dLLM', routes: ['understand','generate','edit'] },
    { id: 'textout', label: 'Text De-tokenizer', routes: ['understand'] },
    { id: 'decoder', label: '6B Diffusion Decoder', routes: ['generate','edit'] },
  ];
  return (
    <div className="ll-widget">
      <Segmented
        label="选择端到端路径"
        value={route}
        onChange={setRoute}
        items={[{ value: 'understand', label: '理解路径' }, { value: 'generate', label: '生成路径' }, { value: 'edit', label: '编辑路径' }]}
      />
      <div className={`route-map ${route}`}>
        {nodes.map((node, index) => (
          <React.Fragment key={node.id}>
            <div className={`route-node ${node.routes.includes(route) ? 'active' : 'muted'} ${node.id}`}>
              <small>{index < 2 ? '输入' : index === 2 ? '共享骨干' : '输出'}</small>
              <b>{node.label}</b>
            </div>
            {index < nodes.length - 1 ? <span className="route-arrow">→</span> : null}
          </React.Fragment>
        ))}
      </div>
      <Notice>
        {route === 'understand'
          ? '图像经语义 tokenizer 进入统一骨干，答案走文本输出；不需要把图像重建成像素再理解。'
          : route === 'generate'
          ? '提示词进入骨干，生成语义图像 token，再由独立扩散解码器恢复高分辨率像素。'
          : '参考图和指令一起成为条件，目标图像 token 被预测后再解码成像素。'}
      </Notice>
    </div>
  );
};

export const MoEExplorer: React.FC<WidgetProps> = () => {
  const [token, setToken] = useState('image');
  const experts = token === 'image' ? [1, 4] : token === 'text' ? [0, 3] : [2, 5];
  return (
    <div className="ll-widget">
      <Segmented label="选择送入骨干的 token" value={token} onChange={setToken} items={[
        { value: 'text', label: '文本 token' },
        { value: 'image', label: '图像 token' },
        { value: 'mixed', label: '交错 token' },
      ]} />
      <div className="moe-stage">
        <div className="moe-token"><Token kind={token === 'text' ? 'text' : token === 'image' ? 'image' : 'special'} label={token === 'mixed' ? 'T+V' : token === 'text' ? 'T' : 'V'} /></div>
        <div className="moe-router">Router</div>
        <div className="moe-experts">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className={experts.includes(index) ? 'active' : ''}>E{index + 1}</div>)}
        </div>
        <div className="moe-merge">加权合并 → 下一层</div>
      </div>
      <Notice tone="orange">MoE 是共享骨干内部的稀疏计算组织方式；不能把六个专家解读成“六种任务各有一套模型”。</Notice>
    </div>
  );
};

