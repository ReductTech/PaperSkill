import { useState } from 'react';
import { Sheet, Feedback } from './camf-kit';
export function ProtocolScene() {
  const [duts, setDuts] = useState(true);
  const [cos, setCos] = useState(false);
  const [pretrain, setPretrain] = useState(true);
  const valid = duts && !cos && pretrain;
  return <div className="camf-page"><div className="camf-split"><div><Sheet detail={cos ? 1 : .45}/><h3>零伪装标注，不是零训练</h3></div><section className="camf-stack"><h3>训练数据账本</h3>
    <label className="camf-check"><input type="checkbox" checked={pretrain} onChange={event => setPretrain(event.target.checked)}/>预训练 EVA02-L 主干</label>
    <label className="camf-check"><input type="checkbox" checked={duts} onChange={event => setDuts(event.target.checked)}/>DUTS 显著性像素标注</label>
    <label className="camf-check"><input type="checkbox" checked={cos} onChange={event => setCos(event.target.checked)}/>CAMO / COD10K 伪装标注</label>
    <p>目标：不使用任何伪装目标标注，测试时仍输出二值分割掩码。</p><div className="camf-stamp" style={{color:valid?'var(--green)':'var(--red)'}}>{valid ? '符合论文 ZS 协议' : '不符合论文 ZS 协议'}</div></section></div>
    <Feedback tone={valid?'green':'red'}>{cos?'加入 COS 标注后，不能再称为本文的零伪装标注设置。':!duts?'去掉 DUTS 标注并不等于复现本文：它仍需要显著性监督训练。':!pretrain?'本文使用预训练主干；从随机初始化开始不是这里验证过的协议。':'用 DUTS 学语义，再迁移到伪装数据；基础模型预训练并没有因此消失。'}</Feedback></div>;
}
