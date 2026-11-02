import React,{useState} from 'react';
import {C,useCanvas,roundRect,arrow,drawInstrument,Feedback,Source,MathBlock} from './mir-kit';
const nodes=[{x:385,y:75,name:'当前输入'},{x:590,y:75,name:'自编码器'},{x:820,y:75,name:'分类器'},{x:590,y:205,name:'压缩缓存'},{x:820,y:205,name:'测试路径'}];
const descriptions=['当前新图像是否先重建，决定它与旧回放是否带有不同的处理痕迹。','AE 的编码器压缩，解码器重建；本论文混合实验每个任务先离线训练 AE 五轮。','共享分类器可能利用“原图还是重建图”猜测任务，而不是只学习类别。','缓存保存潜编码与标签；先搜索潜空间，再匹配存储编码的近邻，最后解码回放。','原文消融发现测试也经 AE 有收益；训练与测试的输入处理需要一致说明。'];
export function MirC8(){
 const [unified,setUnified]=useState(false),[active,setActive]=useState(0),[rawByte,setRawByte]=useState(false);
 const raw=3072*(rawByte?1:4),code=320*4,ratio=raw/code;
 const ref=useCanvas(ctx=>{
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,280);drawInstrument(ctx,145,140,.8,[0,unified?0:.7,0]);
  nodes.forEach((n,i)=>roundRect(ctx,n.x-60,n.y-23,120,46,8,C.bg,i===active?C.orange:C.env));
  arrow(ctx,445,75,530,75,unified?C.green:C.axis);arrow(ctx,650,75,760,75,unified?C.green:C.blue);
  if(!unified){arrow(ctx,390,42,820,42,C.red);arrow(ctx,820,42,820,49,C.red);}
  arrow(ctx,590,182,590,102,C.purple);arrow(ctx,820,182,820,101,unified?C.green:C.blue);
  ctx.font='18px sans-serif';ctx.fillStyle=C.ink;ctx.fillText('参考弦',60,35);ctx.fillText('重建路径',530,25);
 },[unified,active]);
 return <div className="mir-widget"><canvas className="mir-canvas" ref={ref} aria-label="可点击的 AE-MIR 输入、自编码器、缓存、分类器与测试节点" onClick={e=>{const b=e.currentTarget.getBoundingClientRect(),x=(e.clientX-b.left)/b.width*1080,y=(e.clientY-b.top)/b.height*280;const i=nodes.findIndex(n=>Math.abs(x-n.x)<70&&Math.abs(y-n.y)<35);if(i>=0)setActive(i);}}/>
 <div className="mir-controls"><button aria-pressed={!unified} onClick={()=>setUnified(false)}>新原图／旧重建混用</button><button aria-pressed={unified} onClick={()=>setUnified(true)}>新旧与测试都重建</button>{nodes.map((n,i)=><button key={n.name} aria-pressed={active===i} onClick={()=>setActive(i)}>{n.name}</button>)}<button aria-pressed={rawByte} onClick={()=>setRawByte(v=>!v)}>原图存储：{rawByte?'uint8':'float32'}</button></div>
 <Feedback tone={unified?'green':'red'}>{unified?'统一重建削弱输入处理痕迹与新旧任务之间的关联；不保证消除所有域差异。':'新图是原图、旧图是重建图时，分类器可能走任务识别捷径。'} {nodes[active].name}：{descriptions[active]} 输入 {raw} 字节／编码 {code} 字节，缓存条目比 {ratio.toFixed(1)} 倍（未计 AE）。</Feedback>
 <div className="mir-prose">
 <p>图中左边三根参考弦比喻新旧输入应处在一致的处理条件；它不代表图像真实重建质量。右边上排从左到右为当前输入、自编码器、分类器，下排为压缩缓存、测试路径。点击节点或同名按钮查看角色；混用时红色捷径绕过新图重建，统一模式则让三种输入都遵循重建处理。</p>
 <h3>为什么不能只把旧输入压缩就结束？</h3>
 <p>Autoencoder（自编码器，AE）把图像 x 编码为 h=Encodeφ(x)，再解码为 x̃=Decodeγ(h)。AE-MIR 存储 h 与标签，在可微潜空间搜索高干扰位置后，查找已存编码近邻，再解码为回放图像。它利用了连续潜空间可优化、存储样本更轻以及近邻约束输出来源的性质；不是无约束生成任意“最难图像”。</p>
 <p>新任务输入若为清晰原图，旧任务输入却带重建痕迹，这些痕迹与“新还是旧”相关。共享分类器可以据此把所有原图判为最后任务的类别。作者因此把当前输入也先重建，并在测试中使用同样处理，减少这种 Shortcut Learning（捷径学习）。这是一种实验支持的解释，不等于已证明所有分布捷径都被消除。</p>
 <MathBlock title="训练路径与推断路径"><p>新输入：x→Encode→Decode→分类器；旧输入：缓存 h→Decode→分类器；测试：x_test→Encode→Decode→分类器。</p><p>分类器损失可写为 Lcls=CE(fθ(x̃_new),y_new)+回放项；AE 自身以重建 MSE 训练。两者的目标、数据访问与梯度路径应分别记录。</p></MathBlock>
 <h3>9.6 倍压缩究竟比较什么？</h3>
 <p>CIFAR 输入为 32×32×3=3072 个标量，编码为 4×4×20=320 个标量，3072/320=9.6。若两侧均为 float32，则 12288/1280=9.6；若原图可存 uint8 而潜编码是 float32，则 3072/1280=2.4。上图按钮只改变这个明确的存储假设，不能把 9.6 当作任何实现的实际 RAM 减少比例。</p>
 <MathBlock title="从元素数量到总字节"><p>原始缓存 ≈ Kraw·(3072·braw+b_label)；潜编码缓存 ≈ Kcode·(320·bcode+b_label)+AE 参数字节。</p><p>还须计算优化器状态、检索临时张量及编码／解码时间。若输入与编码精度不同，等元素比例不等于等字节预算。</p></MathBlock>
 <h3>这部分实验并非严格的一遍在线训练</h3>
 <p>补充材料 Algorithm 3 的外层按任务循环，先用当前任务数据离线训练 AE 五个 epoch，再遍历该任务进行分类器更新；批量大小为 10，混合实验平均五次运行。因而它需要任务组织和多遍 AE 数据访问。不能从论文题目“Online”推断全部变体都满足单遍、无边界 GCL。GEN 的任务末教师快照也有类似边界依赖。</p>
 <h3>Fig. 4 与附录 C 怎样支持设计？</h3>
 <p>Fig. 4 横轴为压缩缓存规模，纵轴分别比较平均准确率与遗忘。AE-MIR 和 AE-Random 的准确率较接近，但前者遗忘更低；增加压缩样本数量还能改善结果。这里不从图像估读未经核对的小数，更不把减少遗忘写成每个条件都提高准确率。</p>
 <p>附录 C 的消融把测试改成原图（“−test AE”），再把当前训练输入也改成原图（“−train &amp; test AE”）。后者表现明显差，测试仍重建也带来额外收益，支持统一处理路径的重要性；这些是同一实验设置下的比较。重建与真实图像之间仍有性能差距，AE 的离线成本和存储参数也没有消失。</p>
 <Source href="https://proceedings.neurips.cc/paper_files/paper/2019/file/15825aee15eb335cc13f9b559f166ee8-Supplemental.zip">原文 §3.3、§4.3、Fig. 4；附录 C 的 Algorithm 3 与训练／测试重建消融。</Source>
 </div></div>;
}
