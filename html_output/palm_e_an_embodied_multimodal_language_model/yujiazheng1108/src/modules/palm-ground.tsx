import { useState } from 'react';
import { Choice, Feedback, Kitchen } from './palm-kit';

export function PalmGround() {
  const [right, setRight] = useState(false);
  const [camera, setCamera] = useState(false);
  return <div className="pk-body pk-split pk-ground">
    <div className="pk-card pk-kitchen-stage">
      <Kitchen opening={1} sponge={right ? 1 : 0} camera={camera}
        arm={camera && right ? 515 : 280} spill />
      <div className="pk-options">
        <Choice active={!right} onClick={() => setRight(false)}>海绵放左抽屉</Choice>
        <Choice active={right} onClick={() => setRight(true)}>海绵移到右抽屉</Choice>
      </div>
    </div>
    <div className="pk-card pk-stack">
      <h2>“帮我拿块海绵。”</h2>
      <p>指令没有变，抽屉里的位置会变。切换输入，看看夹具下一步能依据什么。</p>
      <div className="pk-options">
        <Choice active={!camera} onClick={() => setCamera(false)}>只给文字</Choice>
        <Choice active={camera} onClick={() => setCamera(true)}>加入图像</Choice>
      </div>
      <Feedback tone={camera ? 'green' : 'red'}>
        {camera ? (right ? '当前图像显示右侧有海绵，可以规划去右侧取。' : '当前图像显示海绵在左侧，可以规划去左侧取。') : '仅凭这句文字，无法确定海绵在哪个抽屉。'}
      </Feedback>
    </div>
  </div>;
}
