from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
root = Path(__file__).resolve().parents[1]
source = Path('C:/Users/Md Roushan/.codex/generated_images/01a12672-1ef2-7612-b321-9f50e0f7c8d2')
assets = {
 'home':'exec-33cae7fe-d2ce-4901-8cd0-4a615acb4f4c.png',
 'onboarding':'exec-c093fea6-7b49-4ce5-b374-3afe764df44c.png',
 'teaching':'exec-58b314f0-9e29-4a80-9a40-cdbe240fecd0.png',
 'astra':'exec-64da8c8c-796a-4a4b-8260-4fe043813eaa.png',
 'mentor':'exec-e14c16b9-a4d4-4c41-b165-4f16b4d2ff13.png',
 'mentor-complete':'exec-8e086e94-88a2-4f41-9834-c8b66003f6e0.png',
 'mountain':'exec-7c3deed4-dd94-4db1-a0ad-6b7e3c96e692.png',
 'brain':'exec-b5e896b9-bc0f-40aa-bfa6-8b23a956ce92.png',
 'astra-attentive':'exec-551cc306-ecf5-4042-952d-a04b5a1df3b6.png',
}
out = root/'apps/web/public/art'
out.mkdir(exist_ok=True, parents=True)
previews=[]
for name, file in assets.items():
 im=Image.open(source/file)
 if name in ['astra','astra-attentive','mentor','mentor-complete','brain']:
  im=im.convert('RGBA')
  assert im.getextrema()[3][0] == 0, f'{name} lacks alpha'
  im.thumbnail((1000,1000), Image.Resampling.LANCZOS)
 else:
  im=im.convert('RGB')
  mobile=ImageOps.fit(im,(720,1100),Image.Resampling.LANCZOS,centering=(.58,.5))
  mobile.save(out/f'{name}-mobile.webp',quality=85,method=6)
 im.save(out/f'{name}.webp',quality=88,method=6)
 tile=Image.new('RGB',(440,295),'#071326')
 thumb=ImageOps.contain(im,(440,260),Image.Resampling.LANCZOS)
 if thumb.mode=='RGBA':tile.paste(thumb,((440-thumb.width)//2,(260-thumb.height)//2),thumb)
 else:tile.paste(thumb,((440-thumb.width)//2,(260-thumb.height)//2))
 ImageDraw.Draw(tile).text((15,275),name,fill='#c9e8ff')
 previews.append(tile)
 print(name,im.size,(out/f'{name}.webp').stat().st_size)
sheet=Image.new('RGB',(440*3,295*3),'#020819')
for i,t in enumerate(previews):sheet.paste(t,((i%3)*440,(i//3)*295))
sheet.save(root/'docs/frontend/art-contact-sheet.jpg',quality=92)
