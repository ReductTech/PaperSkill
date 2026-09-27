import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

type Fragment = { id: number; x: number; y: number; tx: number; ty: number; solved: boolean };

const QUESTIONS = [
  { title: '计算为什么会越来越昂贵？', body: '每换一个视觉任务，就收集大量标注、重新微调一套模型。怎样让已有能力被重复利用？', options: ['为每个任务训练更大的专用模型', '冻结强大的骨干，只学习一个轻量的连接方式', '把图像全部改成文字再处理'], answer: 1, hint: '把已有的视觉与语言能力保留下来，成本才不会随任务数量一起膨胀。' },
  { title: '为什么图片和文字总是对不上？', body: '现实网页里可能先出现文字，再出现图片、视频，又回到文字。怎样保留这种任意交错的顺序？', options: ['只保留最后一张图片', '让所有图片共用同一个固定标签', '把媒体压缩成可插入序列的短表示，并记住它出现的位置'], answer: 2, hint: '问题不是“看没看见”，而是视觉证据要在正确的位置重新出现。' },
  { title: '为什么系统不能自然地说话？', body: '很多视觉系统只能从预设类别里挑一个答案；面对开放问题，它们很难写出完整句子。', options: ['把答案类别做得无限多', '让视觉证据进入一个真正的语言生成器', '只允许用户问选择题'], answer: 1, hint: '开放式表达需要生成器，而不只是分类头。' },
  { title: '为什么少量示例还不够？', body: '换一个任务，模型往往要再次训练。能不能把少量示例直接放进当前上下文，让它临时理解任务？', options: ['把示例留在提示里，作为当前任务的说明书', '删除示例，避免模型分心', '每次都从随机参数开始训练'], answer: 0, hint: '示例不一定要改参数；它也可以先改变模型正在理解的上下文。' },
];

export const OpeningScene: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fragments, setFragments] = useState<Fragment[]>(() => QUESTIONS.map((_, i) => ({ id: i, x: 12 + i * 22, y: 34 + (i % 2) * 28, tx: 20 + (i % 2) * 30, ty: 42 + Math.floor(i / 2) * 18, solved: false })));
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState('天空里漂浮着 4 个问题碎片。先选择一个。');
  const [travel, setTravel] = useState(false);

  const solvedCount = fragments.filter(f => f.solved).length;
  const complete = solvedCount === fragments.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth || 720;
    const height = 360;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#526b5d'; ctx.fillRect(0, 0, width, height);
    const t = performance.now() / 1000;
    for (let i = 0; i < 22; i++) {
      const x = (i * 97 + Math.sin(t * 0.18 + i) * 22) % width;
      const y = (i * 53 + Math.cos(t * 0.16 + i) * 16) % height;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(229,218,166,.23)' : 'rgba(199,219,198,.18)';
      ctx.fillRect(x, y, 2 + (i % 3), 2 + (i % 2));
    }
    const targetW = Math.min(width * .72, 520);
    const targetH = 190;
    const ox = (width - targetW) / 2;
    const oy = 86;
    if (complete) {
      ctx.fillStyle = 'rgba(239,228,174,.9)';
      ctx.fillRect(ox, oy, targetW, targetH);
      ctx.strokeStyle = '#274b3a'; ctx.lineWidth = 3; ctx.strokeRect(ox, oy, targetW, targetH);
    }
    fragments.forEach((f, i) => {
      const px = f.solved ? ox + (i % 2) * targetW / 2 + targetW / 4 : width * f.x / 100;
      const py = f.solved ? oy + Math.floor(i / 2) * targetH / 2 + targetH / 4 : height * f.y / 100;
      const wobble = f.solved ? 0 : Math.sin(t * .45 + i) * 5;
      ctx.save(); ctx.translate(px, py + wobble); ctx.rotate(Math.sin(t * .18 + i) * .035);
      ctx.fillStyle = f.solved ? '#d9c982' : 'rgba(232,220,171,.9)';
      ctx.strokeStyle = '#274b3a'; ctx.lineWidth = f.solved ? 1 : 2;
      ctx.fillRect(-62, -29, 124, 58); ctx.strokeRect(-62, -29, 124, 58);
      ctx.fillStyle = '#274b3a'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(f.solved ? '已回答' : `问题 ${i + 1}`, 0, 5); ctx.restore();
    });
    if (travel) {
      ctx.fillStyle = 'rgba(224,239,220,.18)'; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(243,235,192,.8)'; ctx.lineWidth = 2;
      for (let r = 12; r < width; r += 24) { ctx.beginPath(); ctx.arc(width / 2, height / 2, r + Math.sin(t + r) * 4, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#fff5c4'; ctx.beginPath(); ctx.arc(width / 2, height / 2, 18 + Math.sin(t * 2) * 3, 0, Math.PI * 2); ctx.fill();
    }
    const frame = requestAnimationFrame(() => setFragments(v => [...v]));
    return () => cancelAnimationFrame(frame);
  }, [fragments, complete, travel]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (complete) { setTravel(true); setMessage('矩形板块正在打开一条安静的时间通道……'); setTimeout(() => { const next = document.querySelector('button.slide-nav-btn-primary:not(:disabled)') as HTMLButtonElement | null; if (next) { next.focus(); next.click(); } }, 1600); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const hit = fragments.find(f => !f.solved && Math.abs(f.x - x) < 12 && Math.abs(f.y - y) < 12);
    if (hit) setSelected(hit.id);
  };

  const choose = (option: number) => {
    if (selected === null) return;
    const q = QUESTIONS[selected];
    setFragments(fs => fs.map(f => f.id === selected ? { ...f, solved: true } : f));
    setMessage(option === q.answer ? `回答成立：${q.hint}` : `先记下这个线索：${q.hint}`);
    setSelected(null);
  };

  return <div className="opening-scene">
    <canvas ref={canvasRef} onClick={handleCanvasClick} aria-label="漂浮问题碎片与矩形入口" />
    <div className="opening-fragments" aria-label="问题碎片列表">
      {fragments.map((f, i) => !f.solved && <button key={f.id} type="button" className="opening-fragment" style={{ left: `${f.x}%`, top: `${f.y}%` }} onClick={(e) => { e.stopPropagation(); setSelected(f.id); }}>问题 {i + 1}</button>)}
    </div>
    <div className="opening-caption">{complete ? '所有碎片已经安静地拼合。' : `${solvedCount} / ${fragments.length} 个问题已得到回答`}</div>
    {selected !== null && <div className="opening-question">
      <div className="opening-question-title">{QUESTIONS[selected].title}</div>
      <p>{QUESTIONS[selected].body}</p>
      <div className="opening-options">{QUESTIONS[selected].options.map((option, i) => <button key={option} type="button" onClick={() => choose(i)}>{String.fromCharCode(65 + i)} · {option}</button>)}</div>
    </div>}
    {!selected && <div className="opening-message">{message}</div>}
    {complete && !travel && <button type="button" className="opening-try" onClick={() => { setTravel(true); setMessage('矩形板块正在打开一条安静的时间通道……'); setTimeout(() => { const next = document.querySelector('button.slide-nav-btn-primary:not(:disabled)') as HTMLButtonElement | null; if (next) { next.focus(); next.click(); } }, 1600); }}>Do you want to have a try?</button>}
    {travel && <div className="opening-travel-label">穿越开始</div>}
  </div>;
};
