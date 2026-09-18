import React, { useState } from 'react';

export function Character({name, alt}: {name:string; alt:string}) {
  const base = import.meta.env.BASE_URL;
  return <picture className="character-sprite"><source media="(prefers-reduced-motion: reduce)" srcSet={`${base}images/characters/${name}.png`}/><img src={`${base}images/characters/${name}.gif`} alt={alt} width="128" height="136"/></picture>;
}

const prompts:Record<string,[string,string]> = {
  'mod-1-2':['你怎么看？两帧画面，够不够给“理解”盖章？','先找一种也能造成相同画面变化的解释。我负责皱眉，你负责推理。'],
  'mod-4-1':['你会怎么抽查模型脑子里到底学到了什么？','如果让整个策略一起上场，是谁在回答问题？先把这个变量拎出来。'],
  'mod-7-1':['专业刷题的学生一定赢吗？你先押，我先收起得意脸。','比较结果前，先看指标的方向：哪个要高，哪个要低？'],
  'mod-9-1':['词典越厚，真的就用得越好吗？','试着同时盯住容量和利用率。买了书与翻过书，是两条证据。'],
  'mod-10-1':['这句话的证据够吗？你来决定结案报告怎么写。','把“在哪套评测下”加回句子里，看看结论还站不站得住。'],
};

export function PhebePrompt({scene, ready}:{scene:string; ready:boolean}) {
  const [hint,setHint]=useState(false);
  const pair=prompts[scene];
  if(!pair)return null;
  return <aside className="phebe-prompt"><Character name="phebe-investigate" alt="Phebe 拿着放大镜向你征询判断"/><div><small>PHEBE · 调查搭档</small><p aria-live="polite">{hint?pair[1]:ready?'你的判断已记录。哪条证据让你想坚持或修正它？':pair[0]}</p><button onClick={()=>setHint(!hint)}>{hint?'收起提示':'问问 Phebe 的思路'}</button></div></aside>;
}
