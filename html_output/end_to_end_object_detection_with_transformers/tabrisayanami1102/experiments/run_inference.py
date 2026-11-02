from pathlib import Path
import json,time,hashlib,platform,urllib.request,sys
from PIL import Image,ImageDraw
import torch,torchvision
from torchvision import transforms as T

def compact_json(value,depth=0):
    """Keep each numeric tensor row on one line for readable result diffs."""
    pad='  '*depth
    if isinstance(value,list):
        if not value or all(isinstance(x,(int,float)) for x in value):
            return json.dumps(value,ensure_ascii=False)
        return '[\n'+',\n'.join('  '*(depth+1)+compact_json(x,depth+1) for x in value)+'\n'+pad+']'
    if isinstance(value,dict):
        return '{\n'+',\n'.join('  '*(depth+1)+json.dumps(k,ensure_ascii=False)+': '+compact_json(v,depth+1) for k,v in value.items())+'\n'+pad+'}'
    return json.dumps(value,ensure_ascii=False)

OUT=Path(__file__).resolve().parent.parent
MEDIA=OUT/'public/images';MEDIA.mkdir(parents=True,exist_ok=True)
EXP=OUT/'experiments';EXP.mkdir(exist_ok=True)
torch.set_num_threads(4)
torch.manual_seed(0)
print('Loading official DETR ResNet50',flush=True)
REVISION='29901c51d7fe8712168b8d0d64351170bc0f83e0'
model=torch.hub.load('facebookresearch/detr:'+REVISION,'detr_resnet50',pretrained=True,trust_repo=True,skip_validation=True).eval()
pre=T.Compose([T.Resize(800,max_size=1333),T.ToTensor(),T.Normalize([.485,.456,.406],[.229,.224,.225])])
samples=[('astronaut','person',1,'NASA / Eileen Collins, public domain'),('chelsea','cat',17,'Stefan van der Walt, CC0'),('coffee','cup',47,'Rachel Michetti, CC0; courtesy Pikolo Espresso Bar')]
records=[]
for name,target,tid,credit in samples:
    url=f'https://raw.githubusercontent.com/scikit-image/scikit-image/v0.25.2/skimage/data/{name}.png'
    path=MEDIA/f'{name}-original.png'
    if not path.exists():
        try:urllib.request.urlretrieve(url,path)
        except Exception:
            url=f'https://raw.githubusercontent.com/scikit-image/scikit-image/v0.20.0/skimage/data/{name}.png'
            urllib.request.urlretrieve(url,path)
    image=Image.open(path).convert('RGB');w,h=image.size
    for condition in ['original','lowres','occluded']:
        im=image.copy()
        if condition=='lowres':
            factor=48/min(w,h);im=im.resize((round(w*factor),round(h*factor)),Image.Resampling.BILINEAR).resize((w,h),Image.Resampling.BILINEAR)
        if condition=='occluded':
            ImageDraw.Draw(im).rectangle([round(.35*w),round(.18*h),round(.65*w),round(.82*h)],fill=(128,128,128))
        variant=MEDIA/f'{name}-{condition}.png'
        if condition!='original':im.save(variant)
        x=pre(im).unsqueeze(0)
        if not records:
            with torch.inference_mode():model(x)
        t=time.perf_counter()
        with torch.inference_mode():pred=model(x)
        elapsed=time.perf_counter()-t
        logits=pred['pred_logits'][0];boxes=pred['pred_boxes'][0];prob=logits.softmax(-1)
        scores,labels=prob[:,:-1].max(-1)
        detections=[]
        for i,(score,label,b) in enumerate(zip(scores,labels,boxes)):
            if score.item()>=.7:
                cx,cy,bw,bh=b.tolist();detections.append(dict(slot=i,label_id=label.item(),score=score.item(),box_cxcywh=b.tolist(),box_xyxy=[(cx-bw/2)*w,(cy-bh/2)*h,(cx+bw/2)*w,(cy+bh/2)*h]))
        target_scores=prob[:,tid];idx=int(target_scores.argmax())
        row=dict(sample=name,target=target,target_id=tid,condition=condition,input_path=f'images/{name}-{condition}.png',image_size=[w,h],input_tensor_shape=list(x.shape),image_sha256=hashlib.sha256(variant.read_bytes()).hexdigest(),elapsed_seconds=elapsed,detections=detections,target_max_probability=target_scores[idx].item(),target_best_slot=idx,target_box_cxcywh=boxes[idx].tolist(),logits=logits.tolist(),boxes=boxes.tolist(),source_url=url,credit=credit)
        records.append(row)
        print(name,condition,len(detections),f'target={row["target_max_probability"]:.6f}',f'{elapsed:.3f}s',flush=True)
result=dict(description='官方预训练DETR-R50在三张真实照片及其变体上的实际CPU推理记录。没有重新训练模型。',model='facebookresearch/detr detr_resnet50 pretrained',code_revision=REVISION,weights_url='https://dl.fbaipublicfiles.com/detr/detr-r50-e632da11.pth',protocol=dict(seed=0,device='cpu',threads=4,model_mode='eval; torch.inference_mode',normalization_mean=[.485,.456,.406],normalization_std=[.229,.224,.225],resize='shortest800,longest<=1333',display_threshold=.7,display_rule='best nonempty class probability; no NMS',lowres='shortest48 bilinear then restore original size',occluded='constant gray rectangle x35%-65%,y18%-82% of image; covers19.2% area',runs_per_condition=1,warmup='one original astronaut forward beforetiming',timing_scope='model forward only, excludes download/loading/preprocessing; illustrative CPU observation',metric='target maximum class probability is confidence, not accuracy; no complete GT so do not compute AP or recall',classes='COCO official indices with unused91class positions +empty in checkpoint'),versions=dict(python=platform.python_version(),torch=torch.__version__,torchvision=torchvision.__version__),records=records)
checkpoint=Path(torch.hub.get_dir())/'checkpoints/detr-r50-e632da11.pth'
result['weights_sha256']=hashlib.sha256(checkpoint.read_bytes()).hexdigest()
code_dir=Path(torch.hub.get_dir())/('facebookresearch_detr_'+REVISION)
result['code_sha256']={f:hashlib.sha256((code_dir/f).read_bytes()).hexdigest() for f in ['hubconf.py','models/detr.py','models/transformer.py','models/backbone.py','util/misc.py']}
(EXP/'results.json').write_text(compact_json(result)+'\n',encoding='utf-8')
(EXP/'environment.json').write_text(json.dumps(result['versions'],indent=2),encoding='utf-8')
print('Saved all100logits and boxes for9runs.',flush=True)
