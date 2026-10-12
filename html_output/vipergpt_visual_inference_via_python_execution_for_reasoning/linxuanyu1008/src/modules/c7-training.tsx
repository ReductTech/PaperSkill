import React from 'react';
import {LabStyles} from './lab-kit';
export function ViperTrainingBoundary(){
 return <div className="vlab"><LabStyles/><div className="lab-columns" style={{gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,210px),1fr))'}}>
 <div className="lab-output"><strong>✓ 底层模型已预训练</strong><p>复用现有视觉与语言能力。</p></div>
 <div className="lab-output is-good"><strong>✓ 无需下游再训练</strong><p>新查询生成程序，不重新训练ViperGPT。</p></div>
 <div className="lab-output"><strong>＋ 新能力通过API扩展</strong><p>接入实现、更新规范；不保证任意任务正确。</p></div>
 </div></div>;
}
