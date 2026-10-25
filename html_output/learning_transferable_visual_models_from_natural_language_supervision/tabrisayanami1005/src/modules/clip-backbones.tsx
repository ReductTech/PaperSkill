import { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Canvas, Chips, Feedback, card, photo, arrow, label, softmax } from './clip-scenes';

function text(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,color:string=C.text,size=20){ctx.fillStyle=color;ctx.font=`${size}px "Microsoft YaHei",sans-serif`;ctx.fillText(value,x,y);}
function grid(ctx:CanvasRenderingContext2D,x:number,y:number,side:number,size:number,color:string=C.border){ctx.strokeStyle=color;ctx.lineWidth=1;for(let i=0;i<=side;i++){ctx.beginPath();ctx.moveTo(x+i*size/side,y);ctx.lineTo(x+i*size/side,y+size);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y+i*size/side);ctx.lineTo(x+size,y+i*size/side);ctx.stroke();}}
export const ClipBackbones=(_props:WidgetProps)=>{
 const [stage,setStage]=useState(0);
 const feedback=[
  '同一张照片进入两种架构。ResNet 从像素网格上的局部窗口开始；ViT 先把图像切成小块（patch），把每块展开并线性投影成一个 token 向量，再加入位置表示。这里用 4×4 切块方便看图，不是论文实际分辨率。',
  '左侧窗口示意卷积：同一组可学习系数在不同位置重复做乘法与加法，提取局部模式；多层叠加能扩大感受野，CNN 并非只能看局部。右侧线条示意自注意力：各 token 根据内容为其他 token 分配权重，建立远近信息联系；ViT 也能学习局部特征。',
  '左侧先形成特征图，再将空间信息汇成一个图像特征；CLIP 的改进 ResNet 用注意力池化替代全局平均池化。右侧由可学习的类别 token 汇集视觉序列，输出整张图的表示；它并不是某个具体类别标签。两种分支最后都接 CLIP 的投影、L2 归一化和图文匹配目标。'
 ];
 return <>
  <p><strong>架构</strong>是模型计算的组织方式；<strong>卷积</strong>是在局部窗口重复使用同一组系数；<strong>token</strong>是序列中的一个向量单位，视觉 token 可以来自图片小块。<strong>注意力</strong>按内容匹配决定该从其他 token 取多少信息。</p>
  <Canvas ariaLabel={`ResNet与ViT同步对照：${['输入组织','信息混合','整图汇总'][stage]}`} draw={ctx=>{
   label(ctx,'ResNet',35,30);label(ctx,'ViT',565,30);
   ctx.strokeStyle=C.border;ctx.beginPath();ctx.moveTo(532,40);ctx.lineTo(532,260);ctx.stroke();
   if(stage===0){photo(ctx,56,60,200,'山');grid(ctx,72,76,10,151);ctx.strokeStyle=C.orange;ctx.lineWidth=4;ctx.strokeRect(118,122,45,45);arrow(ctx,271,139,317,139);card(ctx,333,94,156,89,'像素网格',C.blue);photo(ctx,582,60,200,'山');grid(ctx,598,76,4,151,C.blue);arrow(ctx,795,139,824,139);[0,1,2,3].forEach(i=>card(ctx,846+i*43,106,35,68,String(i+1),C.orange));}
   if(stage===1){grid(ctx,54,73,8,168);ctx.fillStyle=C.passive;ctx.fillRect(96,115,63,63);grid(ctx,54,73,8,168);ctx.strokeStyle=C.orange;ctx.lineWidth=4;ctx.strokeRect(96,115,63,63);arrow(ctx,236,153,277,153);card(ctx,295,96,190,100,'2 + 0.3 = 2.3',C.green);text(ctx,'x + F(x)',330,228,C.green);const pts=[[599,85],[685,85],[772,85],[858,85],[944,85],[599,205],[685,205],[772,205],[858,205],[944,205]];pts.forEach(([x,y],i)=>{if(i!==2){ctx.strokeStyle=C.blue;ctx.lineWidth=1+(i%3);ctx.beginPath();ctx.moveTo(788,101);ctx.lineTo(x+16,y+16);ctx.stroke();}});pts.forEach(([x,y],i)=>card(ctx,x,y,32,32,String(i+1),i===2?C.orange:C.blue));}
   if(stage===2){[0,1,2].forEach(i=>{ctx.fillStyle=i===2?C.blue:C.passive;ctx.fillRect(56+i*18,68+i*18,122,122);});arrow(ctx,224,142,285,142);card(ctx,310,94,185,93,'整图特征',C.green);[0,1,2,3].forEach(i=>card(ctx,573+i*54,54,43,47,String(i+1),C.blue));card(ctx,625,190,138,48,'类别 token',C.orange);[0,1,2,3].forEach(i=>arrow(ctx,594+i*54,110,694,180,C.blue));arrow(ctx,779,209,823,146,C.green);card(ctx,844,94,184,93,'整图特征',C.green);}
  }}/>
  <Chips options={['输入组织','信息混合','整图汇总']} value={stage} onChange={setStage} label="同步对照两种架构的步骤"/>
  <p>结构示意。网络连线不是某张照片的实测注意力；数字 2+0.3 是残差机制的标量例子。</p>
  <Feedback>{feedback[stage]}</Feedback>
  <p><strong>ResNet 的“残差”</strong>指保留输入 x，再加上网络学到的修正 F(x)：y=x+F(x)。例如输入 2、修正 0.3，输出为 2.3；它不是损失值，也不是把网络重置。直接传递 x 的路径叫跳跃连接，给信号与梯度提供较直接的通路，使深层网络更容易训练。实际输入通常是张量（带多个维度的数表），形状不同时需要先做适配。</p>
  <p><strong>卷积核</strong>就是局部窗口里那组可学习系数；同一个核滑过不同位置，叫权重共享。不同核可产生不同特征通道，通道在各个位置的数值组成<strong>特征图</strong>。某个输出能够受到输入中多大区域的影响，叫<strong>感受野</strong>；多层堆叠后这个区域可以扩大。<strong>池化</strong>是汇总空间位置的操作：平均池化取均值，注意力池化则学习按内容加权。CNN 是卷积神经网络的英文缩写。</p>
  <p><strong>局部先验</strong>指架构预先规定的偏好，例如邻近像素优先一起处理、不同位置用同一卷积核；它有助于利用图像结构，但也约束信息如何流动。ViT 通过全局自注意力直接混合不同位置的 token，并不意味着它没有结构偏好或永远需要更少数据。</p>
  <div style={{overflowX:'auto'}}><table className="paper" style={{whiteSpace:'normal'}}><thead><tr><th>比较点</th><th>ResNet 图像分支</th><th>ViT 图像分支</th></tr></thead><tbody>
   <tr><td>输入单位</td><td>像素网格与特征图</td><td>图片小块投影成 token，加位置表示</td></tr>
   <tr><td>局部先验</td><td>卷积窗口局部、同一核共享权重</td><td>先切块；注意力不强制只联系邻居</td></tr>
   <tr><td>全局信息</td><td>堆叠扩大感受野，池化汇总整图</td><td>token 间自注意力混合内容，亦可学局部信息</td></tr>
   <tr><td>CLIP 中的改动</td><td>ResNetD 改动、抗混叠模糊池化、注意力池化</td><td>Transformer 前增加层归一化，调整初始化</td></tr>
   <tr><td>共同目标</td><td colSpan={2}>整图特征→线性投影→L2 归一化→图文对比学习；不是两种不同的监督任务</td></tr>
  </tbody></table></div>
  <p>位置表示是加入 token 的位置相关向量，使 ViT 能区分小块在哪；抗混叠池化在缩小特征图前先平滑，减少采样造成的伪影。ResNetD 指论文沿用的一组 ResNet 结构改良（如卷积与下采样路径的调整），并非一个新的监督目标。初始化指训练开始前给参数设置初值；层归一化在下一模块解释。</p>
  <p>结构背景见 <a href="https://arxiv.org/abs/1512.03385" target="_blank" rel="noreferrer">ResNet 原论文</a>与 <a href="https://arxiv.org/abs/2010.11929" target="_blank" rel="noreferrer">ViT 原论文</a>；CLIP 的具体改动见第 3 页 §2.3。背景知识不等于 CLIP 首次提出的贡献，不能据此断言 ViT 在任何数据与硬件上都更好或更快。</p>
 </>;
};

const scores=[[2,1,0],[0,2,1],[1,0,2]];
const values=[1,2,4];
export const ClipAttention=(_props:WidgetProps)=>{
 const [query,setQuery]=useState(0);
 const weights=softmax(scores[query]);
 const terms=weights.map((w,i)=>w*values[i]);
 const result=terms.reduce((a,b)=>a+b,0);
 return <>
  <p><strong>查询 Q</strong>表示当前 token 想获取什么，<strong>键 K</strong>表示各 token 可与查询匹配的特征，<strong>值 V</strong>表示被混合的信息。它们是从输入学到的不同投影视角，不是数据库键或字面上的提问句；自注意力表示它们都来自同一个输入序列。</p>
  <Canvas ariaLabel={`选中第${query+1}个查询，注意力加权输出${result.toFixed(4)}`} draw={ctx=>{
   label(ctx,'查询与权重',35,32);label(ctx,'加权输出',822,32);
   photo(ctx,32,69,160,'山');grid(ctx,46,83,3,118,C.blue);
   card(ctx,253,105,110,68,`Q${query+1}`,C.orange);
   [0,1,2].forEach(i=>{const yy=39+i*79;ctx.strokeStyle=C.blue;ctx.lineWidth=2+weights[i]*12;ctx.beginPath();ctx.moveTo(374,139);ctx.lineTo(524,yy+24);ctx.stroke();card(ctx,538,yy,135,48,`V${i+1}=${values[i]}`,C.blue);text(ctx,weights[i].toFixed(4),410,yy+18,C.blue,19);text(ctx,`× ${weights[i].toFixed(4)}`,687,yy+31,C.muted,19);});
   card(ctx,839,94,198,91,result.toFixed(4),C.green);
  }}/>
  <Chips options={['查询小块 1','查询小块 2','查询小块 3']} value={query} onChange={setQuery} label="切换注意力查询"/>
  <p>数值示例。三个匹配分数已经包含缩放；为便于算数，值 V 用标量，真实注意力混合的是向量。</p>
  <Feedback>查询 {query+1} 的分数是 [{scores[query].join(', ')}]，softmax 权重之和为 {weights.reduce((a,b)=>a+b,0).toFixed(4)}。输出 = {terms.map(x=>x.toFixed(4)).join(' + ')} = {result.toFixed(4)}；切换查询会改变连线宽度、每项贡献和最终输出。</Feedback>
  <div style={{overflowX:'auto'}}><table className="paper" style={{whiteSpace:'normal'}}><thead><tr><th>被读取的小块</th><th>匹配分数</th><th>softmax 权重</th><th>值 V</th><th>权重 × 值</th></tr></thead><tbody>{values.map((v,i)=><tr key={i}><td>{i+1}</td><td>{scores[query][i]}</td><td>{weights[i].toFixed(5)}</td><td>{v}</td><td>{terms[i].toFixed(5)}</td></tr>)}</tbody></table></div>
  <p>完整的单头公式为 Attention(Q,K,V)=softmax(QKᵀ/√dₖ)V。Kᵀ 表示把 K 的行列互换；QKᵀ 计算各查询与各键的点积；dₖ 是键向量的维度。除以 √dₖ 是为缓解维度增大时点积尺度变大、softmax 过于集中的问题。这里的维度缩放与 CLIP 最末端图文分数的可学习温度不是同一个参数。上方玩具分数已含缩放，省略了投影矩阵的具体数值。</p>
  <p><strong>多头注意力</strong>让多组投影在不同子空间中并行匹配，再整合结果。Transformer 通常还包含逐 token 的前馈网络（MLP，多层感知机）、残差连接与层归一化。前馈网络对每个位置分别做多层变换；其中的非线性函数使多层计算不至于退化成一次线性加权，并不是只有注意力连线。</p>
  <p><strong>层归一化（LN）</strong>按某层的特征统计调整数值分布，与 CLIP 最末端把整个向量长度变为 1 的 <strong>L2 归一化</strong>不同。CLIP 的文字 Transformer 使用因果掩码，后面的文字位置不能被前面的位置直接读取；它取结束符 EOS 的表示做整段文字汇总，原始推理接口仍是匹配而非生成。</p>
  <p>依据：注意力背景为 <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">Attention Is All You Need</a>，CLIP 文字结构见第 4 页 §2.3。这些权重只用于解释加权求和，不能当作真实 CLIP 的关注区域或语义解释。</p>
 </>;
};

const configs=[{name:'ViT-B/32',resolution:224,patch:32},{name:'ViT-B/16',resolution:224,patch:16},{name:'ViT-L/14',resolution:224,patch:14},{name:'ViT-L/14@336px',resolution:336,patch:14}];
export const ClipConfigurations=(_props:WidgetProps)=>{
 const [selected,setSelected]=useState(0);
 const config=configs[selected];
 const side=config.resolution/config.patch,patches=side*side,tokens=patches+1,pairs=tokens*tokens;
 return <>
  <p>配置名中的 <strong>B / L</strong>表示模型大小系列（Base / Large），斜杠后的数表示图片小块的边长，<strong>@336px</strong>表示输入分辨率。224 像素是这组三个普通配置的输入边长；模型大小、块大小与输入大小是三个不同概念。</p>
  <Canvas ariaLabel={`${config.name}，${side}乘${side}网格，共${patches}个图片小块，加类别token为${tokens}`} draw={ctx=>{
   label(ctx,'图像切块',35,31);photo(ctx,48,47,270,'山');grid(ctx,65,64,side,194,C.blue);
   arrow(ctx,337,153,402,153);card(ctx,434,65,591,146,'',C.green);
   text(ctx,`${config.resolution} ÷ ${config.patch} = ${side} 块／边`,465,106,C.blue,24);
   text(ctx,`${side} × ${side} = ${patches} 个图片小块`,465,147,C.blue,24);
   text(ctx,`${patches} + 1 = ${tokens} 个 token`,465,187,C.green,24);
  }}/>
  <Chips options={configs.map(x=>x.name)} value={selected} onChange={setSelected} label="选择 ViT 配置并计算切块数量"/>
  <p>切块示意。图示网格用于算术；类别 token 是额外的可学习汇总向量，不是一块图片，也不是“猫”这样的标签。</p>
  <Feedback>当前 {config.name}：{patches} 个图片小块，加 1 个类别 token 得 {tokens} 个 token。全连接注意力每头的查询—键配对数为 {tokens}²={pairs.toLocaleString('zh-CN')}；固定宽度时这一部分随 token 数平方增长，但这不等于整模型运行时间或显存严格按相同比例增长。</Feedback>
  <div style={{overflowX:'auto'}}><table className="paper" style={{whiteSpace:'normal'}}><thead><tr><th>论文研究配置</th><th>具体型号与解释</th></tr></thead><tbody>
   <tr><td>5 个 ResNet</td><td>RN50、RN101、RN50x4、RN50x16、RN50x64；x4/x16/x64 表示近似计算量倍数，不是深度或参数量简单倍数。</td></tr>
   <tr><td>3 个 ViT</td><td>ViT-B/32、ViT-B/16、ViT-L/14；最佳 L/14 又以 336px 额外训练 1 个 epoch（完整遍历训练集一次）。</td></tr>
   <tr><td>文字基准配置</td><td>12 层：12 个 Transformer 层；512 宽：特征宽度；8 头：多头注意力的头数。较大的图像配置会调整文字宽度，这些值不属于所有 CLIP 的固定规格。</td></tr>
  </tbody></table></div>
  <p><strong>论文中的效率比较有条件：</strong>第 6 页 §3.3 与第 7 页图 6 比较冻结特征上线性分类的平均成绩和每图前向计算量（GFLOPs，十亿次浮点运算）。作者在研究设置下发现 CLIP ViT 约比 CLIP ResNet 计算效率高 3 倍；这不是任意硬件上的延迟快 3 倍，也不是此网页重新跑出的结果。</p>
  <p><strong>训练资源说明规模：</strong>第 4 页 §2.4 报告 RN50x64 使用 592 张 V100 训练约 18 天，ViT-L/14 使用 256 张 V100 约 12 天。两者模型与资源不同，不能拿 18/12 直接算架构速度提升；这些训练成本也不能代表零样本推理的单次开销。</p>
 </>;
};
