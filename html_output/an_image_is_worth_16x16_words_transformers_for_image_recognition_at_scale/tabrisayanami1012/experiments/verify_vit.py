"""ViT结构教学验证：NumPy CPU、固定随机编码器，绝不是原论文复现。"""
from pathlib import Path
import argparse
import hashlib
import json
import platform
import time
import numpy as np


def patchify(images, patch):
    batch, height, width, channels = images.shape
    if height % patch or width % patch:
        raise ValueError('图像高宽必须能被图块边长整除')
    return images.reshape(batch, height//patch, patch, width//patch, patch, channels).transpose(0,1,3,2,4,5).reshape(batch,-1,patch*patch*channels)


def unpatchify(tokens, height, width, patch, channels):
    return tokens.reshape(len(tokens),height//patch,width//patch,patch,patch,channels).transpose(0,1,3,2,4,5).reshape(len(tokens),height,width,channels)


def softmax(x):
    exponent = np.exp(x - x.max(axis=-1,keepdims=True))
    return exponent / exponent.sum(axis=-1,keepdims=True)


def layer_norm(x):
    return (x-x.mean(axis=-1,keepdims=True))/np.sqrt(x.var(axis=-1,keepdims=True)+1e-5)


def gelu(x):
    return 0.5*x*(1+np.tanh(np.sqrt(2/np.pi)*(x+0.044715*x**3)))


def make_encoder(seed, width=24, heads=4, depth=2):
    rng=np.random.default_rng(seed)
    matrix=lambda a,b: rng.normal(0,1/np.sqrt(a),(a,b))
    return {'width':width,'heads':heads,'patch':matrix(48,width),
            'cls':rng.normal(0,.2,(1,1,width)), 'pos':rng.normal(0,.2,(1,5,width)),
            'blocks':[{'qkv':matrix(width,3*width),'out':matrix(width,width),
                       'fc1':matrix(width,4*width),'fc2':matrix(4*width,width)} for _ in range(depth)]}


def encode(patches, model, use_position):
    b,n,_=patches.shape
    d,h=model['width'],model['heads']
    z=np.concatenate([np.broadcast_to(model['cls'],(b,1,d)),patches@model['patch']],axis=1)
    if use_position:
        z=z+model['pos']
    max_row_error=0.0
    for block in model['blocks']:
        q,k,v=(layer_norm(z)@block['qkv']).reshape(b,n+1,3,h,d//h).transpose(2,0,3,1,4)
        attention=softmax(q@k.swapaxes(-1,-2)/np.sqrt(d//h))
        max_row_error=max(max_row_error,float(np.max(np.abs(attention.sum(axis=-1)-1))))
        z=z+(attention@v).transpose(0,2,1,3).reshape(b,n+1,d)@block['out']
        z=z+gelu(layer_norm(z)@block['fc1'])@block['fc2']
    return layer_norm(z),max_row_error


def paired_images(seed, pairs):
    rng=np.random.default_rng(seed)
    pictures=[]
    labels=[]
    for _ in range(pairs):
        tokens=rng.uniform(.10,.35,(4,4,4,3))
        tokens[0]=np.clip(np.array([.9,.15,.12])+rng.normal(0,.045,(4,4,3)),0,1)
        tokens[1]=np.clip(np.array([.12,.15,.9])+rng.normal(0,.045,(4,4,3)),0,1)
        for order,target in [([0,1,2,3],1),([1,0,2,3],0)]:
            token=tokens[order].reshape(1,4,48)
            pictures.append(unpatchify(token,8,8,4,3)[0])
            labels.append(target)
    return np.array(pictures),np.array(labels,dtype=np.float64)


def fit_linear_head(train_features, train_labels, test_features, test_labels):
    mean=train_features.mean(axis=0)
    std=np.maximum(train_features.std(axis=0),.05)
    train=np.column_stack([(train_features-mean)/std,np.ones(len(train_features))])
    test=np.column_stack([(test_features-mean)/std,np.ones(len(test_features))])
    weights=np.zeros(train.shape[1])
    losses=[]
    epochs,learning_rate,l2=400,.2,1e-4
    for step in range(epochs+1):
        logits=train@weights
        loss=np.mean(np.logaddexp(0,logits)-train_labels*logits)+l2*np.sum(weights[:-1]**2)/2
        if step in (0,50,100,200,400):
            losses.append({'step':step,'loss':float(loss)})
        if step==epochs: break
        probability=1/(1+np.exp(-np.clip(logits,-50,50)))
        gradient=train.T@(probability-train_labels)/len(train)
        gradient[:-1]+=l2*weights[:-1]
        weights-=learning_rate*gradient
    # 近零的对称计算误差不应假装能区分数学上相同的配对输入。
    predict=lambda x: np.round(x@weights,decimals=12)>=0
    return {'train_accuracy':float(np.mean(predict(train)==train_labels)),
            'test_accuracy':float(np.mean(predict(test)==test_labels)),
            'loss_history':losses,'head_weight_norm':float(np.linalg.norm(weights))}


def run():
    started=time.perf_counter()
    rng=np.random.default_rng(20261012)
    images=rng.normal(size=(3,8,8,3))
    patches=patchify(images,4)
    restored=unpatchify(patches,8,8,4,3)
    kernel=rng.normal(size=(4,4,3,7))
    projected=patches@kernel.reshape(48,7)
    convolution=np.stack([np.stack([np.einsum('bhwc,hwcd->bd',images[:,r:r+4,c:c+4,:],kernel) for c in (0,4)],axis=1) for r in (0,4)],axis=1).reshape(3,4,7)
    model=make_encoder(0)
    permutation=[1,0,3,2]
    original,row_error=encode(patches,model,False)
    shuffled,_=encode(patches[:,permutation],model,False)
    position_original,_=encode(patches,model,True)
    position_shuffled,_=encode(patches[:,permutation],model,True)
    checks={'patch_roundtrip_max_abs_error':float(np.max(np.abs(images-restored))),
            'projection_vs_stride_conv_max_abs_error':float(np.max(np.abs(projected-convolution))),
            'attention_row_sum_max_abs_error':row_error,
            'no_position_cls_permutation_max_abs_error':float(np.max(np.abs(original[:,0]-shuffled[:,0]))),
            'no_position_patch_equivariance_max_abs_error':float(np.max(np.abs(original[:,1:][:,permutation]-shuffled[:,1:]))),
            'fixed_position_cls_permutation_max_abs_difference':float(np.max(np.abs(position_original[:,0]-position_shuffled[:,0])))}
    for name,value in checks.items():
        if name.endswith('error'): assert value<1e-10,(name,value)
    q=np.array([1.,1.]);keys=np.array([[1,0],[0,1],[-1,0]]);values=np.array([[1,0],[0,1],[1,1]])
    attention=softmax(q@keys.T/np.sqrt(2))
    sgd=[];weight=0.
    for step in range(6):
        p=1/(1+np.exp(-weight))
        sgd.append({'step':step,'weight':float(weight),'probability':float(p),'loss':float(-np.log(p))})
        weight+=1-p
    assert all(sgd[i+1]['loss']<sgd[i]['loss'] for i in range(5))
    train_x,train_y=paired_images(13001,128)
    test_x,test_y=paired_images(24002,64)
    train_p,test_p=patchify(train_x,4),patchify(test_x,4)
    trials=[]
    for seed in range(5):
        model=make_encoder(seed)
        for position in (False,True):
            train_features,_=encode(train_p,model,position)
            test_features,_=encode(test_p,model,position)
            result=fit_linear_head(train_features[:,0],train_y,test_features[:,0],test_y)
            trials.append({'seed':seed,'position':position,**result})
    summary=[]
    for position in (False,True):
        values=[t['test_accuracy'] for t in trials if t['position']==position]
        summary.append({'position':position,'mean_test_accuracy':float(np.mean(values)),'sample_std_test_accuracy':float(np.std(values,ddof=1))})
    return {'schema_version':1,'study_date':'2026-10-12','scope':'教学验证；固定随机两层微型Transformer编码器，仅训练二分类线性头；非ViT原论文复现',
            'environment':{'python':platform.python_version(),'numpy':np.__version__,'platform':platform.platform(),'dtype':'float64','device':'CPU'},
            'script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'numerical_checks':checks,
            'attention_example':{'weights':attention.tolist(),'output':(attention@np.array([[1,0],[0,1],[1,1]])).tolist()},
            'sgd_example':sgd,
            'resolution_checks':[{'resolution':r,'patch':p,'patches':(r//p)**2,'tokens':(r//p)**2+1,'per_head_attention_elements':((r//p)**2+1)**2} for r,p in [(224,16),(384,16),(224,14),(518,14)]],
            'experiment':{'task':'同一对图块的左右交换，预测红色图块在左边；每对输入图块集合完全相同，标签相反',
                          'train_examples':256,'test_examples':128,'train_seed':13001,'test_seed':24002,
                          'train_data_sha256':hashlib.sha256(train_x.tobytes()+train_y.tobytes()).hexdigest(),
                          'test_data_sha256':hashlib.sha256(test_x.tobytes()+test_y.tobytes()).hexdigest(),
                          'encoder':{'image_shape':[8,8,3],'patch':4,'width':24,'heads':4,'depth':2,'mlp_width':96,'position_std':.2,'dropout':0,'trained':False},
                          'head_training':{'optimizer':'full-batch gradient descent','epochs':400,'learning_rate':.2,'l2':.0001,'feature_standardization':'仅用训练集均值/标准差；std下限0.05','initial_weights':'zero'},
                          'seeds':[0,1,2,3,4],'trials':trials,'summary':summary,
                          'limitations':['只改变固定随机位置表是否加入；位置表本身未训练，而原论文学习位置表。','只在自造空间关系任务上做线性读出，不证明真实图像准确率或端到端ViT训练效果。','五seed共享同一数据划分，只反映编码器初始化敏感性，不覆盖数据划分不确定性。','无位置仍可能完成无需空间顺序的任务；加位置允许但不保证学会有用空间关系。']},
            'elapsed_seconds':round(time.perf_counter()-started,3)}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=Path(__file__).with_name('results.json'))
    args=parser.parse_args()
    result=run()
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'checks':result['numerical_checks'],'summary':result['experiment']['summary'],'elapsed_seconds':result['elapsed_seconds']},ensure_ascii=True))
