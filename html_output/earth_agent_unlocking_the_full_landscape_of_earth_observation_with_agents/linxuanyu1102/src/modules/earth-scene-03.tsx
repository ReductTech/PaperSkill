import React, { useState } from 'react';
import { C, Notebook, Person, ToolIcon, Feedback, SymbolHint } from './earth-kit';

type Observation = { files: boolean; index: boolean; mean: number | null; answer: boolean };

export function EarthScene03() {
  const [state, setState] = useState<Observation>({ files: false, index: false, mean: null, answer: false });
  const [history, setHistory] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('从任务目标出发；每次工具返回都会写入历史，再供下一步决策使用。');
  const [failed, setFailed] = useState(false);

  const call = (tool: number) => {
    const next = { ...state };
    let line = '';
    let message = '';
    let error = false;
    if (tool === 0) {
      next.files = true;
      line = '目录工具 → 找到 Red / NIR 栅格';
      message = '工具返回观测；文件名现在可进入交互历史。';
    } else if (tool === 1) {
      if (!state.files) {
        line = '指数工具 → 失败：缺少已观察到的文件';
        message = '当前历史还没有文件观测。先查目录，再决定怎样计算。';
        error = true;
      } else {
        next.index = true;
        line = 'NDVI 工具 → [0.50, 0.25, 0.75]';
        message = '新观测是三个样地点的指数值；LLM 可据此选择统计工具。';
      }
    } else if (tool === 2) {
      if (!state.index) {
        line = '统计工具 → 失败：缺少指数数组';
        message = '工具调用依赖先前观测。失败也应进入历史，供后续决策修正。';
        error = true;
      } else {
        next.mean = (0.5 + 0.25 + 0.75) / 3;
        line = '均值工具 → 0.50';
        message = '当前观测已支持目标答案；现在可以停止调用并组织答复。';
      }
    } else {
      if (state.mean === null) {
        line = '最终答复 → 失败：目标尚未完成';
        message = '系统还没有可用的均值观测，不能提前报告结果。';
        error = true;
      } else {
        next.answer = true;
        line = '最终答复 → 平均 NDVI 为 0.50';
        message = '最终答案与可复核的工具观测相连；历史同时保留调用轨迹。';
      }
    }
    setState(next);
    setHistory(items => [...items, line].slice(-5));
    setFailed(error);
    setFeedback(message);
  };

  const reset = () => {
    setState({ files: false, index: false, mean: null, answer: false });
    setHistory([]);
    setFailed(false);
    setFeedback('历史已清空。再从任务目标开始，依次观察调用与返回结果。');
  };

  return <div className="ea-page">
    <svg viewBox="0 0 1472 386" className="ea-svg" style={{height:285}} role="img" aria-label="Earth-Agent 的 ReAct 工具调用与记忆更新循环">
      <rect x="8" y="8" width="1456" height="370" rx="24" fill="#f3f7f8" stroke={C.line} strokeWidth="2" />
      <text x="34" y="49" fontSize="24" fontWeight="700" fill={C.muted}>一个任务，逐步调用工具；每次观测都回到下一轮决策</text>

      <rect x="28" y="82" width="288" height="202" rx="18" fill="#fffdf7" stroke={C.line} strokeWidth="2" />
      <text x="52" y="119" fontSize="26" fontWeight="700" fill={C.blue}>用户目标 g</text>
      <Person x={91} y={231} scale={0.76} />
      <path d="M132 157h152v78H143l-18 16 6-24Z" fill="#e8eef5" stroke={C.line} strokeWidth="2" />
      <text x="150" y="186" fontSize="22" fill={C.ink}>求 3 个样地点的</text>
      <text x="150" y="215" fontSize="24" fontWeight="700" fill={C.ink}>平均 NDVI</text>

      <path d="M318 182H388" stroke={C.blue} strokeWidth="5" />
      <path d="m376 169 16 13-16 13" fill="none" stroke={C.blue} strokeWidth="5" strokeLinejoin="round" />

      <rect x="396" y="82" width="310" height="202" rx="18" fill="#eaf0f7" stroke={C.blue} strokeWidth="3" />
      <text x="420" y="119" fontSize="26" fontWeight="700" fill={C.blue}>LLM 控制器 · 策略 π</text>
      <text x="420" y="166" fontSize="22" fill={C.ink}>读取目标与当前历史</text>
      <text x="420" y="201" fontSize="22" fill={C.ink}>选择工具并组织参数</text>
      <text x="420" y="248" fontSize="19" fill={C.muted}>本页按钮驱动的是教学状态机，</text>
      <text x="420" y="273" fontSize="19" fill={C.muted}>不是在线 LLM 推理。</text>

      <path d="M708 182H778" stroke={C.blue} strokeWidth="5" />
      <path d="m766 169 16 13-16 13" fill="none" stroke={C.blue} strokeWidth="5" strokeLinejoin="round" />

      <rect x="786" y="82" width="304" height="202" rx="18" fill="#fffdf7" stroke={C.line} strokeWidth="2" />
      <text x="810" y="119" fontSize="26" fontWeight="700" fill={C.blue}>领域工具包 · 动作 aₜ</text>
      <g transform="translate(850 194)"><ToolIcon kind={0} size={0.54} selected /></g>
      <text x="890" y="202" fontSize="20" fill={C.ink}>Index · 计算 NDVI</text>
      <g transform="translate(850 246)"><ToolIcon kind={4} size={0.44} /></g>
      <text x="890" y="252" fontSize="20" fill={C.ink}>Statistics · 求均值</text>

      <path d="M1092 182H1150" stroke={C.green} strokeWidth="5" />
      <path d="m1138 169 16 13-16 13" fill="none" stroke={C.green} strokeWidth="5" strokeLinejoin="round" />

      <rect x="1158" y="82" width="282" height="202" rx="18" fill="#e9f4ee" stroke={C.green} strokeWidth="2" />
      <text x="1182" y="119" fontSize="26" fontWeight="700" fill={C.green}>环境观测 oₜ₊₁</text>
      <text x="1182" y="169" fontSize="21" fill={C.ink}>{state.files ? '文件：Red / NIR' : '文件：尚未查询'}</text>
      <text x="1182" y="208" fontSize="21" fill={C.ink}>{state.index ? 'NDVI：3 个数值' : '指数：尚未计算'}</text>
      <text x="1182" y="249" fontSize="23" fontWeight="700" fill={state.mean === null ? C.muted : C.green}>{state.mean === null ? '均值：待计算' : `均值：${state.mean.toFixed(2)}`}</text>

      <path d="M1300 293 C1280 345 1100 347 960 347 H558 C475 347 456 318 456 294" fill="none" stroke={C.purple} strokeWidth="4" strokeDasharray="10 8" />
      <path d="m447 307 9-17 12 15" fill="none" stroke={C.purple} strokeWidth="4" strokeLinejoin="round" />
      <text x="630" y="369" fontSize="21" fontWeight="700" fill={C.purple}>记忆 mₜ：把历史观测和动作带回下一轮决策</text>
      {state.answer && <g className="ea-write"><rect x="1200" y="300" width="230" height="48" rx="12" fill="#fff" stroke={C.green} strokeWidth="2"/><text x="1315" y="332" textAnchor="middle" fontSize="20" fontWeight="700" fill={C.green}>目标答案已生成</text></g>}
    </svg>

    <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:42,flexWrap:'wrap',margin:'7px 0 3px'}}>
      <div className="ea-equation" style={{textAlign:'center',fontSize:22}}>
        <SymbolHint meaning="aₜ：在时间步 t 选择的工具调用，包括工具标识与输入参数。">aₜ</SymbolHint>
        {' '}∼{' '}
        <SymbolHint meaning="π：LLM 控制器表示的策略。">π</SymbolHint>
        {' ('}<SymbolHint meaning="aₜ：本步工具调用。">aₜ</SymbolHint>{' | '}
        <SymbolHint meaning="g：任务目标，例如求样地平均 NDVI。">g</SymbolHint>{'，'}
        <SymbolHint meaning="mₜ：截至 t 的交互历史，包含此前的观测与动作。">mₜ</SymbolHint>{')'}
      </div>
      <div className="ea-equation" style={{textAlign:'center',fontSize:22}}>
        <SymbolHint meaning="mₜ：截至 t 的完整交互历史。">mₜ</SymbolHint>{' = ('}
        <SymbolHint meaning="o₀：初始观测。">o₀</SymbolHint>{'，'}
        <SymbolHint meaning="a₀：根据初始观测作出的第一个动作。">a₀</SymbolHint>{'，'}
        <SymbolHint meaning="o₁：第一个工具动作后的观测。">o₁</SymbolHint>{'，…，'}
        <SymbolHint meaning="oₜ：当前时刻可用的最新观测。">oₜ</SymbolHint>{')'}
      </div>
    </div>

    <div className="ea-controls" style={{justifyContent:'center',gap:10,marginTop:3}}>
      <button onClick={() => call(0)}>① 查目录</button>
      <button onClick={() => call(1)}>② 算 NDVI</button>
      <button onClick={() => call(2)}>③ 求均值</button>
      <button onClick={() => call(3)}>④ 生成答复</button>
      <button onClick={reset}>重置演示</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1.25fr 1fr',gap:14,marginTop:7}}>
      <div className="ea-panel" style={{padding:'8px 14px',minHeight:56}}>
        <strong style={{color:C.blue}}>交互历史</strong>
        <span style={{marginLeft:14,color:C.muted}}>{history.length ? history[history.length-1] : '等待第一次工具调用'}</span>
      </div>
      <div className="ea-panel" style={{padding:'8px 14px',minHeight:56}}>
        <strong style={{color:C.blue}}>最终答案</strong>
        <span style={{marginLeft:14,color:state.answer?C.green:C.muted}}>{state.answer ? '样地平均 NDVI = 0.50' : '完成工具观测后再回答'}</span>
      </div>
    </div>
    <Feedback tone={failed?'red':state.answer?'green':'blue'}>{feedback} 论文将其描述为 ReAct 式 POMDP：调用、记忆更新、思考、动作持续循环，直到满足停止条件。</Feedback>
  </div>;
}
