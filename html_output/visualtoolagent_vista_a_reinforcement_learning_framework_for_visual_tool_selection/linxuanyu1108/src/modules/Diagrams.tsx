import { useId } from 'react';
type Node = {x:number;y:number;label:string;step?:number};
type Edge = readonly [number,number,string?,boolean?];
function Diagram({nodes,edges,active,height,label}:{nodes:Node[];edges:Edge[];active?:number;height:number;label:string}){
  const id=useId();
  const width=136;
  const nodeHeight=42;
  return <div className="v-diagram" tabIndex={0} role="group" aria-label={label}>
    <svg viewBox={`0 0 700 ${height}`} role="img" aria-label={label}>
      <defs><marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#557394"/></marker></defs>
      {edges.map(([from,to,route,trainingOnly],i)=>{
        const a=nodes[from],b=nodes[to];
        const dx=b.x-a.x,dy=b.y-a.y;
        const horizontal=Math.abs(dx)>Math.abs(dy)*1.3;
        const x1=a.x+(horizontal?Math.sign(dx)*width/2:0),x2=b.x-(horizontal?Math.sign(dx)*width/2:0);
        const y1=a.y+(horizontal?0:Math.sign(dy)*nodeHeight/2),y2=b.y-(horizontal?0:Math.sign(dy)*nodeHeight/2);
        const d=route??(horizontal?`M${x1} ${y1}H${(x1+x2)/2}V${y2}H${x2}`:`M${x1} ${y1}V${(y1+y2)/2}H${x2}V${y2}`);
        return <path key={i} d={d} className={trainingOnly?"v-connector v-training-edge":"v-connector"} markerEnd={`url(#${id})`}/>;
      })}
      {nodes.map(({x,y,label,step},i)=><g key={i} data-step={step} className={active!==undefined&&step===active?'v-diagram-node is-current':'v-diagram-node'}><rect x={x-width/2} y={y-nodeHeight/2} width={width} height={nodeHeight} rx="8"/><text x={x} y={y+5} textAnchor="middle">{label}</text></g>)}
    </svg>
  </div>;
}
export function Architecture({step}:{step:number}){
  const nodes=[
    {x:86,y:37,label:'原图 I 与问题 q'},
    {x:260,y:37,label:'可训练 Agent πφ',step:0},
    {x:435,y:37,label:'从工具池选取 t',step:0},
    {x:610,y:37,label:'工具各自读取原图',step:1},
    {x:610,y:112,label:'原输入 + 工具证据',step:1},
    {x:435,y:112,label:'调用冻结 fθ · 增强',step:2},
    {x:260,y:112,label:'增强答案'},
    {x:86,y:188,label:'原图 I 与问题 q'},
    {x:260,y:188,label:'调用同一 fθ · 直接',step:2},
    {x:435,y:188,label:'直接答案'},
    {x:610,y:188,label:'两答案对照标准答案',step:3},
    {x:610,y:260,label:'计算奖励',step:3},
    {x:435,y:260,label:'GRPO 更新 Agent',step:4}
  ];
  const edges:Edge[]=[
    [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],
    [0,4,'M86 58V72H610V91'],
    [7,8,undefined,true],[8,9,undefined,true],[9,10,undefined,true],
    [6,10,'M260 133V151H610V167',true],
    [10,11,undefined,true],[11,12,undefined,true],
    [12,1,'M367 260H9V11H260V16',true]
  ];
  return <Diagram nodes={nodes} edges={edges} height={290} active={step} label="VisTA 架构。实线表示部署路径，虚线表示训练额外调用与反馈。两次推理共享冻结参数，奖励只更新 Agent。"/>;
}
export function ReasoningFlow({training,highlight,direct,augmented}:{training:boolean;highlight:boolean;direct:number;augmented:number}){
  const y=training?102:52;
  const nodes:Node[]=[
    {x:85,y,label:'原图 I 与问题 q'},
    {x:260,y,label:'原输入 + 所选证据'},
    {x:435,y,label:training?'调用 ② · 冻结 fθ':'调用冻结 fθ',step:0},
    {x:610,y,label:'增强答案 · '+augmented+' 人'}
  ];
  const edges:Edge[]=[[0,1],[1,2],[2,3]];
  if(training){
    nodes.push(
      {x:260,y:32,label:'直接输入 · 原图与题'},
      {x:435,y:32,label:'调用 ① · 冻结 fθ',step:0},
      {x:610,y:32,label:'直接答案 · '+direct+' 人'},
      {x:610,y:174,label:'对照标准答案 y*'},
      {x:435,y:174,label:'计算训练奖励'}
    );
    edges.push([0,4,'M85 81V32H192'],[4,5],[5,6],
      [6,7,'M678 32H691V174H678',true],[3,7,undefined,true],[7,8,undefined,true]);
  }
  return <Diagram nodes={nodes} edges={edges} height={training?205:87} active={highlight?0:undefined} label={training?'训练时两次独立前向计算，输入不同，fθ 参数相同且冻结':'部署时只运行工具增强调用，不计算训练奖励'}/>;
}
export function ToolDependencies({chain}:{chain:boolean}){
  const nodes=chain?[
    {x:85,y:70,label:'原图'},{x:260,y:70,label:'OCR · 输出文字'},
    {x:435,y:70,label:'按文字结果裁剪'},{x:610,y:70,label:'读取裁剪图再识别',step:0}
  ]:[
    {x:85,y:70,label:'同一原图'},{x:265,y:36,label:'T1 · 独立转表'},
    {x:265,y:104,label:'T4 · 独立取颜色'},{x:445,y:70,label:'汇合工具输出'},{x:620,y:70,label:'冻结 Reasoner',step:0}
  ];
  const edges:Edge[]=chain?[[0,1],[1,2],[2,3]]:[[0,1],[0,2],[1,3],[2,3],[3,4]];
  return <Diagram nodes={nodes} edges={edges} active={0} height={137} label={chain?'依赖链，文字是裁剪的输入，裁剪图是再识别的输入':'两个工具独立读取同一原图，输出汇合后交给推理器'}/>;
}
