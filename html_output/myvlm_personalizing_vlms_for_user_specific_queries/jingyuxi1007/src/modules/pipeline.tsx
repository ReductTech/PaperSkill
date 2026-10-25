import React, {useState} from 'react';
import type {WidgetProps} from './registry';
const training=[['用户提供示例','示例图、名称 S*、含名称的目标描述。VQA 使用问题与目标答案。'],['分别建立识别与表达','人物保存人脸特征；物品用正负例训练线性 head。表达分支在冻结 VLM 上优化 e*。'],['保存，供以后复用','保存该概念的 head / 身份记录与已学好的 embedding。head 不直接生成 e*。']];
const inference=[['输入新图与指令','这是已登记实例的新照片；没有在本次推理中重新训练。'],['并行读取场景与识别','原 VLM 提取场景信息；外部 head 判断已登记目标是否出现。'],['识别后条件追加','选择已学习的 e*。未通过识别就不追加该向量；误识别仍可能影响输出。'],['生成个性化回答','冻结连接模块与语言模型结合场景、概念和用户指令生成 caption / answer。']];
export function Pipeline({chapterId}:WidgetProps){
  const [phase,setPhase]=useState<'train'|'infer'>(chapterId==='chap-5'?'infer':'train');
  const [step,setStep]=useState(chapterId==='chap-5'?2:0);
  const train=phase==='train';const steps=train?training:inference;
  const active=(n:number)=>'mv-node '+(step===n?'mv-active-node':'');
  return <div className="mv-widget" data-testid="pipeline" onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}}>
    <div className="mv-controls"><button className={'mv-button '+(train?'mv-selected':'')} aria-pressed={train} onClick={()=>{setPhase('train');setStep(0);}}>训练阶段</button><button className={'mv-button '+(!train?'mv-selected':'')} aria-pressed={!train} onClick={()=>{setPhase('infer');setStep(0);}}>推理阶段</button><span className="mv-freeze">🔒 原 VLM 权重始终冻结</span></div>
    <div className="mv-pipeline-map" aria-label={train?'训练时分别建立两种表示':'推理时条件注入概念'}>
      <div className={active(0)}><small>{train?'建立概念的输入':'本次任务的输入'}</small><b>{train?'示例图 + 名称 + 目标文本':'新图像 + 用户指令'}</b></div>
      <div className="mv-split-label">↓ {train?'分开建立':'并行读取'}</div>
      <div className="mv-branches">
        <div className={active(1)}><small>{train?'识别分支':'外部识别路径'}</small><b>{train?'Head / 身份记录':'Concept Head'}</b><span>{train?'人物：保存人脸特征；物品：正负例训练线性层。':'判断已登记目标是否出现。'}</span></div>
        <div className={active(1)}><small>{train?'表达分支':'原 VLM 场景路径'}</small><b>{train?'优化 Concept Embedding':'冻结视觉编码'}</b><span>{train?'通过冻结网络的目标文本监督，优化 e*。':'保留当前图片的场景特征。'}</span></div>
      </div>
      <div className="mv-split-label">↓ {train?'共同保存':'识别结果选择向量 + 场景继续传入'}</div>
      <div className={active(2)}><small>{train?'建立结束':'概念信息的入口'}</small><b>{train?'识别信息 + 对应 e*':'条件追加已学习的 e*'}</b><span>{train?'以后推理复用，不必每次把参考图片拼进 VLM。':'未识别到目标 → 不追加这个概念向量。'}</span></div>
      {!train&&<><div className="mv-split-label">↓ 结合用户指令</div><div className={active(3)}><small>原生成路径</small><b>冻结连接模块 + 冻结语言模型</b><span>personalized caption / answer</span></div></>}
    </div>
    <div className="mv-controls mv-step-controls"><button className="mv-button" disabled={step===0} onClick={()=>setStep(step-1)}>上一步</button><span className="mv-step-label">{train?'训练':'推理'} · {step+1} / {steps.length}</span><button className="mv-button" disabled={step===steps.length-1} onClick={()=>setStep(step+1)}>下一步</button></div>
    <div className="mv-detail" aria-live="polite"><h5>{steps[step][0]}</h5><p>{steps[step][1]}</p></div>
    <div className="mv-feedback" role="status">{train?'建立表示：识别与表达两个分支分别准备。':step<2?'先读取新图：识别结果和场景信息各有来源。':'注入的是已学习的向量，不是 head 的分数。'}</div>
    <div className={'mv-backbones '+(!train&&step===2?'mv-injection-active':'')}>
      <div><b>BLIP-2</b><div className="mv-token-route"><span>视觉编码</span><i>→</i><strong>视觉特征 + e*</strong><i>→</i><span>Q-Former</span><i>→</i><span>LLM</span></div></div>
      <div><b>LLaVA</b><div className="mv-token-route"><span>视觉编码</span><i>→</i><span>视觉投影</span><i>→</i><strong>投影 token + e*</strong><i>→</i><span>LLM</span></div></div>
    </div>
    <p className="mv-source">M Fig.2、§3.2–3.4；S §2.2 · 两种接入位置分开显示，结构教学示意。</p>
  </div>;
}
