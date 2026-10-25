import {EmbeddingScene} from './VisualLessons';
import { useRef, useState, type PointerEvent } from 'react'
import { SceneCanvas, drawGarden, drawRobot, drawPrompt, drawTarget, C } from './GardenKit'

const initial={x:610,y:194}, target={x:850,y:94}
export function EmbedWidget(){
  const [point,setPoint]=useState(initial)
  const dragging=useRef(false)
  const changed=point.x!==initial.x||point.y!==initial.y
  const move=(event:PointerEvent<HTMLCanvasElement>)=>{
    const rect=event.currentTarget.getBoundingClientRect()
    setPoint({x:Math.max(520,Math.min(950,(event.clientX-rect.left)/rect.width*1080)),y:Math.max(60,Math.min(220,(event.clientY-rect.top)/rect.height*280))})
  }
  return <div className="experiment">
    <EmbeddingScene point={point} onChange={setPoint}/>
    <div className="trainer-controls"><button className="trainer-button" onClick={()=>setPoint(p=>({x:p.x+(target.x-p.x)*.3,y:p.y+(target.y-p.y)*.3}))}>向目标靠近</button><button className="trainer-button" onClick={()=>setPoint(initial)}>回到初始位置</button></div>
    <p className="trainer-feedback" role="status">{changed?'你改变了提示向量的位置；真实训练通过梯度而不是手工摆放。':'这是连续向量，不是从词表挑一个词。'}</p>
    <p className="metric-line">示意坐标：({((point.x-520)/440).toFixed(2)}, {((225-point.y)/177).toFixed(2)}) · 核心权重 θ：冻结</p>
    <p className="trainer-output">输入顺序：<strong>Pₑ（可训练提示） → Xₑ（文本嵌入） → 冻结编码器与解码器</strong></p>
    <p className="evidence-note">二维拖动用于理解连续向量，目标位置不是真实 T5 最优解，也不代表分类成功。论文 §2 的提示矩阵为 p × e；仅在编码器输入前拼接。冻结核心并不阻断梯度流向提示。</p>
  </div>
}
