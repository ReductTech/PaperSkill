"""A tiny two-feature classification experiment; NOT LLaVA inference or reproduction.
Standard-library only. python experiments/shortcut_experiment.py
"""
import json, math, random, statistics
from pathlib import Path

def sigmoid(x):
    return 1/(1+math.exp(-x))

def dataset(seed,n,mode):
    rng=random.Random(seed)
    data=[]
    for i in range(n):
        target=1 if i%2==0 else -1
        shape=.3*target+rng.uniform(-.03,.03)
        background=target if mode=='biased' else (1 if (i//2)%2==0 else -1)
        if mode=='reversed': background=-target
        data.append((shape,float(background),1 if target>0 else 0))
    return data

def train(data,seed):
    rng=random.Random(seed)
    w=[rng.uniform(-.02,.02),rng.uniform(-.02,.02)]
    losses=[]
    for epoch in range(300):
        g=[0.,0.];loss=0.
        for a,b,y in data:
            p=sigmoid(w[0]*a+w[1]*b)
            g[0]+=(p-y)*a;g[1]+=(p-y)*b
            loss-=y*math.log(max(p,1e-15))+(1-y)*math.log(max(1-p,1e-15))
        losses.append(loss/len(data))
        for j in range(2):w[j]-=.3*g[j]/len(data)
    return w,losses

def accuracy(w,data):
    return sum((sigmoid(w[0]*a+w[1]*b)>=.5)==bool(y) for a,b,y in data)/len(data)

def run():
    runs=[]
    for seed in range(5):
        for mode in ['biased','balanced']:
            w,loss=train(dataset(seed,400,mode),seed)
            tests={m:accuracy(w,dataset(1000+seed,400,m)) for m in ['biased','balanced','reversed']}
            runs.append(dict(seed=seed,mode=mode,weights=w,initial_loss=loss[0],final_loss=loss[-1],test=tests,loss_curve=loss[::15]+[loss[-1]]))
    summary={mode:{metric:dict(mean=statistics.mean(r['test'][metric] for r in runs if r['mode']==mode),sd=statistics.stdev(r['test'][metric] for r in runs if r['mode']==mode)) for metric in ['biased','balanced','reversed']} for mode in ['biased','balanced']}
    result=dict(description='人工二维特征上的线性连接层分类机制实验；不是LLaVA复现，不读取照片，不生成语言。',protocol=dict(seeds=list(range(5)),train=400,test_per_condition=400,epochs=300,learning_rate=.3,loss='mean binary cross entropy',features='shape=.3*y+Uniform(-.03,.03); background=±1',train_modes='biased: background=y; balanced: all four class/background combinations equal',heldout='new noise and random seed1000+seed, labels never used during fit',head='two logits [w·z,0], frozen identity readout; only w changes',metric='accuracy higher better; sample SD across5 initializations',boundary='标签直接构造了人工主体特征，无法证明从像素学会识别；因果干预仅限这个可控模型'),runs=runs,summary=summary)
    out=Path(__file__).with_name('results.json');out.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(summary,ensure_ascii=False,indent=2))
    # Checks assert invariants, not desired experimental outcomes.
    for r in runs:
        assert all(math.isfinite(x) for x in r['weights'])
        assert 0<=r['test']['balanced']<=1
    return result

if __name__=='__main__':run()
