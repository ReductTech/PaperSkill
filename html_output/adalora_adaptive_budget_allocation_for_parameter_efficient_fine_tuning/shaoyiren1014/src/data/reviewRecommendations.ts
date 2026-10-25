import {route} from './storyScript';
import {limits,relations} from './finalReview';
import type {VerdictState} from '../store/verdictStore';
import type {LearningSnapshot} from './knowledgeUnlocks';
export function reviewRecommendations(chapters:LearningSnapshot[],verdict:VerdictState){
 const result:{act:number;title:string;reason:string;kind:'unfinished'|'revisit'}[]=[];
 const add=(act:number,title:string,reason:string)=>result.push({act,title,reason,kind:'revisit'});
 chapters.forEach((s,i)=>{if(!s.completed)result.push({act:i,title:route[i].subtitle,reason:'这章尚未完成。继续探索后再整理认识。',kind:'unfinished'});});
 const reminders:[number,string,string,string,string][]=[
 [2,'prediction','accuracy','Rank 与任务表现','你曾把容量与效果联系起来。回看容量变化，再确认它不能直接保证准确率。'],
 [2,'prediction','free','固定预算的取舍','你曾预测增加容量不需要付出代价。回看一次筹码转移，确认总预算约束。'],
 [3,'prediction','delete','抑制贡献与删除结构','你曾倾向删除整对因子。回看归零后保留的零件，区分结构与有效贡献。'],
 [4,'prediction','current','单次测量与历史信号','你曾选择只看当前批次。再比较多个批次，检查单次测量的局限。'],
 [4,'prediction','magnitude','大小与重要性','你曾选择只看参数大小。回看敏感性与历史信息，它们回答不同问题。'],
 [5,'prediction','immediate','何时收紧预算','你曾选择立即削减。回看预热阶段留下的探索空间。'],
 [5,'prediction','never','探索与最终预算','你曾选择永不削减。回看最终目标怎样限制保留的方向数。'],
 [7,'combinationPrediction','sum','消融与组合推断','你曾尝试相加消融差距。回看控制条件：单项结果不能生成未经实验的组合成绩。'],
 ];
 for(const [act,key,value,title,reason] of reminders)if(chapters[act]?.[key]===value)add(act,title,reason+' 这是对初次假设的复习提醒，不表示你现在仍持有它。');
 for(const l of limits){const r=verdict.limits[l.id];if(r.first!==null&&r.first!==l.correct)add(l.id==='noise'?4:l.id==='budget'?6:9,l.title,r.answer===l.correct?'你已经修正了最初判断，建议再看一次证据，巩固适用边界。':'这条判断仍值得核对证据，再整理适用边界。');}
 for(const r of relations){const record=verdict.relations[r.id];if(record.first!==null&&record.first!==r.correct)add(r.act,r.question,record.answer===r.correct?'你已修正初次回答，可以回看对应操作，巩固变量关系。':'回到对应章节，对照操作与证据重新理解这个关系。');}
 return result;
}
