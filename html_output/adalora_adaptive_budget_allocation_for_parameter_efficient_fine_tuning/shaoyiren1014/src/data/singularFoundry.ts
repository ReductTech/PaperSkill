export const foundryPredictions = [
  {id:'retain',label:'先把贡献调到零，留下方向，之后还可以再调整。'},
  {id:'delete',label:'只要暂时不用，就应该把整套方向参数删掉。'},
  {id:'same',label:'调到零和删除参数，应该是同一回事。'},
] as const;
export const foundrySimulation = {
  source:{type:'conceptual_simulation' as const,scenarioId:'act-3-singular-directions',assumptions:['三条抽象更新方向','强度为教学相对量，不是实测奇异值','手动恢复用于说明结构保留'],disclaimer:'没有运行训练，不测量准确率或真实参数内存'},
  initialStrengths:[8,5,2],performanceMetrics:null,
};
export const foundryEvidence = [
  {id:'svd-like',source:{type:'paper_evidence' as const,sourceId:'uploaded-pdf',page:4,section:'3.1',locator:'Eq. 3–4',representation:'author_statement',url:'https://arxiv.org/abs/2303.10512v2'},intuition:'把一条更新拆成两端的方向和中间的强度。这样，可以抑制它现在的贡献，同时保留两端的方向参数。'},
  {id:'recovery',source:{type:'paper_evidence' as const,sourceId:'uploaded-pdf',page:6,section:'4',locator:'Implementation Details',representation:'author_statement',url:'https://arxiv.org/abs/2303.10512v2'},intuition:'论文按一定间隔执行掩蔽，而不是每一步都把方向永久锁死；保留下来的结构给后续调整留出可能。'},
] as const;
