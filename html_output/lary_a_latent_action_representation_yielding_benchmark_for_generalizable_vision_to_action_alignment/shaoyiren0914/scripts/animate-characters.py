from pathlib import Path
import math
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'public/images/characters'
for name, motion in [('nuonuo-supine', 'breathe'), ('phebe-investigate', 'question'), ('phebe-snacks', 'walk'), ('nuonuo-awake', 'wave')]:
    source = Image.open(root / (name + '.png')).convert('RGBA')
    assert source.getchannel('A').getextrema()[0] == 0, name + ' lacks transparency'
    source = source.crop(source.getchannel('A').getbbox())
    source.thumbnail((220, 240), Image.Resampling.LANCZOS)
    frames = []
    for i in range(24):
        t = 2 * math.pi * i / 24
        scale = 1 + (0.012 if motion == 'breathe' else 0.006) * math.sin(t)
        sprite = source.resize((round(source.width * scale), round(source.height * scale)), Image.Resampling.LANCZOS)
        angle = 0 if motion == 'breathe' else (1.5 if motion == 'walk' else 0.7) * math.sin(t)
        sprite = sprite.rotate(angle, Image.Resampling.BICUBIC, expand=True)
        frame = Image.new('RGBA', (256, 272))
        dy = 0 if motion == 'breathe' else round(2 * math.sin(t))
        frame.alpha_composite(sprite, ((256-sprite.width)//2, (272-sprite.height)//2+dy))
        alpha = frame.getchannel('A')
        indexed = frame.convert('RGB').quantize(colors=255)
        indexed.paste(255, mask=alpha.point(lambda a: 255 if a < 128 else 0))
        indexed.info['transparency'] = 255
        frames.append(indexed)
    frames[0].save(root / (name + '.gif'), save_all=True, append_images=frames[1:], duration=100, loop=0, transparency=255, disposal=2, optimize=False)
    print(name, '24 frames, transparent GIF')
