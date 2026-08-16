type TopicGroup = '表格机器学习' | '优化与搜索' | '降维与聚类' | '文本与主题模型' | '专项任务';

interface ArcBenchTopic {
  id: string;
  group: TopicGroup;
  title: string;
  methods: string;
  metric: string;
}

const topics: ArcBenchTopic[] = [
  { id: 'T01', group: '表格机器学习', title: 'Dropout 正则化', methods: 'MC-Dropout、标准 Dropout、无 Dropout', metric: 'ECE / Accuracy' },
  { id: 'T02', group: '表格机器学习', title: '集成方法', methods: 'Bagging、Boosting、Stacking', metric: 'Accuracy' },
  { id: 'T04', group: '表格机器学习', title: 'KNN 特征缩放', methods: 'StandardScaler、MinMax、Robust、None', metric: 'Accuracy' },
  { id: 'T08', group: '表格机器学习', title: '类别不均衡处理', methods: 'SMOTE、class weights、threshold tuning', metric: 'F1 (macro)' },
  { id: 'T09', group: '表格机器学习', title: 'RandomForest 调参', methods: '网格搜索、随机搜索、贝叶斯搜索', metric: 'CV score' },
  { id: 'T10', group: '表格机器学习', title: '交叉验证', methods: 'K-fold、stratified、leave-one-out', metric: 'Accuracy' },
  { id: 'T14', group: '表格机器学习', title: '稀疏线性模型', methods: 'Lasso、ElasticNet', metric: 'MSE' },
  { id: 'T15', group: '表格机器学习', title: '特征选择', methods: 'SelectKBest、RFE、noise injection', metric: 'Accuracy' },
  { id: 'T18', group: '表格机器学习', title: '迁移学习', methods: 'Fine-tune、feature extract、from scratch', metric: 'Accuracy' },
  { id: 'T19', group: '表格机器学习', title: '半监督学习', methods: 'Label propagation、self-training（10% labels）', metric: 'Accuracy' },
  { id: 'T20', group: '表格机器学习', title: '主动学习', methods: 'Uncertainty、margin、random sampling', metric: 'Accuracy' },
  { id: 'T22', group: '表格机器学习', title: '多标签分类', methods: 'BR、CC、label powerset', metric: 'F1 (micro)' },
  { id: 'T03', group: '优化与搜索', title: '无梯度优化', methods: 'Nelder-Mead、Powell、CMA-ES', metric: 'Regret' },
  { id: 'T06', group: '优化与搜索', title: '自适应学习率调度', methods: 'StepLR、CosineAnnealing、ReduceOnPlateau', metric: 'Loss' },
  { id: 'T13', group: '优化与搜索', title: 'GP 核函数选择', methods: 'RBF、Matérn、periodic（1-D / 5-D）', metric: 'NLPD' },
  { id: 'T21', group: '优化与搜索', title: '因果发现', methods: 'PC、GES、NOTEARS', metric: 'SHD' },
  { id: 'T05', group: '降维与聚类', title: '降维方法', methods: 'PCA、t-SNE、UMAP', metric: 'Silhouette' },
  { id: 'T12', group: '降维与聚类', title: '聚类算法', methods: 'K-means、DBSCAN、GMM（synthetic shapes）', metric: 'ARI' },
  { id: 'T07', group: '文本与主题模型', title: '文本特征提取', methods: 'TF-IDF、Hashing、Count vectoriser', metric: 'Accuracy' },
  { id: 'T17', group: '文本与主题模型', title: '主题建模', methods: 'LDA、NMF、LSA', metric: 'Coherence' },
  { id: 'T11', group: '专项任务', title: '异常检测', methods: 'IsolationForest、LOF、OCSVM', metric: 'ROC-AUC' },
  { id: 'T16', group: '专项任务', title: '时间序列预测', methods: 'ARIMA、指数平滑、MLP', metric: 'RMSE' },
  { id: 'T23', group: '专项任务', title: 'Learning-to-rank', methods: 'RankSVM、LambdaMART、listwise', metric: 'NDCG@10' },
  { id: 'T24', group: '专项任务', title: 'GP 回归', methods: 'RBF、Matérn、ARD kernels', metric: 'RMSE' },
  { id: 'T25', group: '专项任务', title: 'Reservoir computing', methods: 'ESN、MLP、GP on Lorenz-63', metric: 'NRMSE' },
];

export function ArcBenchExplorer() {
  const groupedTopics = topics.reduce<Record<TopicGroup, ArcBenchTopic[]>>((accumulator, topic) => {
    accumulator[topic.group].push(topic);
    return accumulator;
  }, { '表格机器学习': [], '优化与搜索': [], '降维与聚类': [], '文本与主题模型': [], '专项任务': [] });

  return <section className="benchmark-explorer benchmark-design" aria-labelledby="benchmark-title">
    <header className="benchmark-design-heading"><span className="eyebrow">实验设置 · ARC-Bench</span><h3 id="benchmark-title">25 个任务，检验科研闭环是否更可靠</h3><p>ARC-Bench 不是单一数据集，而是 25 个有明确研究问题与交付要求的机器学习任务；它考查系统能否写代码、跑实验并解释结果。</p></header>
    <div className="benchmark-quick-facts" aria-label="ARC-Bench 核心实验设置"><span><b>25</b> 个 ML 任务</span><i>·</i><span><b>3</b> 个评分维度</span><i>·</i><span><b>CD / CE / RA</b> = 25 / 25 / 50</span></div>
    <details className="benchmark-details"><summary>展开查看实验设计与任务范围</summary>
      <div className="experiment-design-flow" aria-label="ARC-Bench 受控实验设计">
        <article><span>01 · Benchmark</span><b>25 个 ML 研究任务</b><small>每题要求代码、执行结果与分析</small></article><i>→</i>
        <article><span>02 · Controlled comparison</span><b>相同模型、沙盒与预算</b><small>只比较科研工作流设计的贡献</small></article><i>→</i>
        <article><span>03 · Evaluation</span><b>CD / CE / RA</b><small>代码开发 25 · 执行 25 · 结果分析 50</small></article>
      </div>
      <div className="benchmark-protocol"><span><b>Q1</b> 全部 25 题的 experiment-stage 对比</span><i>→</i><span><b>Q3</b> T01–T10 的端到端 HITL 对比</span><i>→</i><span>结论看科学质量，不只看是否执行完成</span></div>
      <details className="benchmark-coverage"><summary>查看任务覆盖范围</summary><p>论文 Table 9 列出不同研究主题、比较方法与评价指标；它们不是共享的一个数据集。</p><div>{Object.entries(groupedTopics).map(([group, groupTopics]) => <article key={group}><b>{group}</b><span>{groupTopics.map((topic) => `${topic.id} ${topic.title}`).join(' · ')}</span></article>)}</div></details>
    </details>
  </section>;
}
