import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

export const FlamingoExplorer: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(3);
  const [focus, setFocus] = useState(1);
  const [problem, setProblem] = useState(0);
  const [travel, setTravel] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 640;
    const height = 190;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, width, height);
    const blue = '#27446e';
    const green = '#228d5c';
    const orange = '#f07e47';
    const muted = '#68778f';
    ctx.font = '13px sans-serif';
    ctx.fillStyle = muted;
    ctx.fillText(`章节 ${chapterId.replace('chap-', '')} · 模块 ${moduleId}`, 18, 22);
    if (moduleId === '1.1') {
      const cards = [
        ['算力昂贵', '全量微调每个新任务'],
        ['输入受限', '难处理交错图文/视频'],
        ['表达受限', '只能选标签，难生成自由文本'],
        ['迁移缓慢', '少量示例也不够用'],
      ];
      cards.forEach((card, i) => {
        const y = 48 + i * 30;
        const active = i === problem;
        ctx.fillStyle = active ? '#27446e' : '#b8c9a7';
        ctx.fillRect(18, y, 116, 22);
        ctx.fillStyle = active ? '#ffffff' : '#21324a';
        ctx.fillText(card[0], 28, y + 15);
        ctx.fillStyle = active ? '#f07e47' : '#68778f';
        ctx.fillText(card[1], 150, y + 15);
      });
      ctx.fillStyle = '#21324a';
      ctx.fillText(problem === 0 ? '线索：重复训练让成本随任务数线性上升。' : problem === 1 ? '线索：固定接口无法表达媒体出现的位置和顺序。' : problem === 2 ? '线索：分类头只能输出预设集合，无法自然对话。' : '线索：真正需要的是上下文学习，而非再次更新参数。', 18, 180);
      return;
    }
    if (moduleId === '1.2') {
      const labels = ['图片像素', '视觉编码器', 'Resampler', '门控桥', '语言生成'];
      const xs = [48, 165, 282, 399, 516];
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(xs[0], 94); ctx.lineTo(xs[4], 94); ctx.stroke();
      labels.forEach((label, i) => {
        const active = i === travel;
        ctx.beginPath(); ctx.arc(xs[i], 94, active ? 25 : 17, 0, Math.PI * 2);
        ctx.fillStyle = active ? '#f07e47' : i < travel ? '#228d5c' : '#b8c9a7'; ctx.fill();
        ctx.strokeStyle = active ? '#27446e' : '#76906a'; ctx.lineWidth = active ? 3 : 1; ctx.stroke();
        ctx.fillStyle = '#21324a'; ctx.fillText(label, xs[i] - 34, 140);
      });
      ctx.fillStyle = '#68778f';
      ctx.fillText(travel === 0 ? '你是一张还未被读取的图片。点击时间轴，开始穿越。' : travel === 1 ? '视觉编码器把像素变成可比较的视觉特征。' : travel === 2 ? 'Resampler 用固定数量的“查询”压缩整张图。' : travel === 3 ? '门控交叉注意力决定何时把视觉证据交给语言状态。' : '语言模型沿着上下文逐 token 生成自由文本。', 18, 176);
      return;
    }
    const left = 42;
    const gap = Math.max(42, (width - 90) / 7);
    for (let i = 0; i < 7; i++) {
      const x = left + i * gap;
      const active = i < level;
      ctx.beginPath();
      ctx.arc(x, 92, active ? 18 : 13, 0, Math.PI * 2);
      ctx.fillStyle = active ? (i === focus ? orange : green) : '#b8c9a7';
      ctx.fill();
      ctx.strokeStyle = active ? blue : '#76906a';
      ctx.lineWidth = i === focus ? 3 : 1;
      ctx.stroke();
      if (i < 6) {
        ctx.beginPath(); ctx.moveTo(x + 18, 92); ctx.lineTo(x + gap - 18, 92);
        ctx.strokeStyle = active && i < level - 1 ? green : '#d7deea'; ctx.lineWidth = 4; ctx.stroke();
      }
    }
    ctx.fillStyle = blue;
    ctx.fillText('视觉证据', left - 22, 137);
    ctx.fillText('语言输出', left + 6 * gap - 22, 137);
    ctx.fillStyle = '#21324a';
    ctx.fillText(level >= 5 ? '证据已通过桥接进入回答' : '增加示例或连接强度，观察证据如何进入回答', 18, 172);
  }, [chapterId, moduleId, level, focus]);

  return <div className="flamingo-widget">
    <canvas ref={ref} aria-label="Flamingo 视觉到语言的交互示意" />
    <div className="flamingo-controls">
      {moduleId === '1.1' ? <>
        <label>问题卡 <select value={problem} onChange={e => setProblem(Number(e.target.value))}>{['算力昂贵','输入受限','表达受限','迁移缓慢'].map((x,i) => <option key={x} value={i}>{i + 1}. {x}</option>)}</select></label>
        <label>任务变化 <input type="range" min="1" max="7" value={level} onChange={e => setLevel(Number(e.target.value))} /></label>
      </> : moduleId === '1.2' ? <>
        <label>时间轴 <input type="range" min="0" max="4" value={travel} onChange={e => setTravel(Number(e.target.value))} /></label>
        <button type="button" onClick={() => setTravel((travel + 1) % 5)}>穿越下一站 →</button>
      </> : <>
        <label>上下文/连接强度 <input type="range" min="1" max="7" value={level} onChange={e => setLevel(Number(e.target.value))} /></label>
        <label>聚焦节点 <select value={focus} onChange={e => setFocus(Number(e.target.value))}>{[0,1,2,3,4,5,6].map(i => <option key={i} value={i}>{i + 1}</option>)}</select></label>
      </>}
    </div>
    <div className={moduleId === '1.1' ? 'flamingo-feedback mid' : moduleId === '1.2' && travel === 4 ? 'flamingo-feedback good' : 'flamingo-feedback'}>
      {moduleId === '1.1' ? (problem === 0 ? '问题已定位：需要冻结大骨干，只训练轻量连接器。' : problem === 1 ? '问题已定位：需要一个能压缩任意媒体并保留交错顺序的视觉接口。' : problem === 2 ? '问题已定位：需要把视觉证据接入语言生成器，而不是只接分类头。' : '问题已定位：需要让示例留在上下文里，作为临时任务说明书。') : moduleId === '1.2' ? (travel === 4 ? '穿越完成：一张图片已经变成可生成的语言证据。' : '沿着时间轴前进，亲自观察图片在 Flamingo 中如何被逐步重写。') : (level >= 5 ? '绿色反馈：视觉证据与语言回答已稳定对齐。' : level >= 3 ? '蓝色反馈：桥接正在工作，仍可加入更相关的示例。' : '橙色反馈：连接太弱，回答容易忽略图片。')}
    </div>
  </div>;
};
