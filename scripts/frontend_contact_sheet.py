from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
root=Path(__file__).resolve().parents[1]
folder=root/'docs/frontend/screens'
names=['01-welcome','02-meet','03-details','04-questions','05-summary','06-home','07-plan','08-confirm','09-session','10-thinking','11-complete','12-debrief','13-next','14-artifacts','15-return']
sheet=Image.new('RGB',(2000,990),'#030916')
for i,name in enumerate(names):
 im=Image.open(folder/f'{name}-desktop.png').convert('RGB')
 thumb=ImageOps.contain(im,(392,290),Image.Resampling.LANCZOS)
 x=(i%5)*400+4;y=(i//5)*330+32
 sheet.paste(thumb,(x+(392-thumb.width)//2,y))
 ImageDraw.Draw(sheet).text((x+8,y-22),name.replace('-',' ').upper(),fill='#b9e9ff')
sheet.save(root/'docs/frontend/journey-contact-sheet.jpg',quality=94)
ref=Image.open('E:/STARTUP/ASTRA HUMANIS/ASTRA EDU/ASTRA Futuristic Learning Journey UI Board.png').convert('RGB')
compare=Image.new('RGB',(2000,2040),'#030916')
compare.paste(ImageOps.contain(ref,(1980,990),Image.Resampling.LANCZOS),(260,30))
compare.paste(sheet,(0,1040))
ImageDraw.Draw(compare).text((20,12),'REFERENCE BOARD',fill='#b9e9ff')
ImageDraw.Draw(compare).text((20,1015),'IMPLEMENTED INTERACTIVE FRONTEND',fill='#b9e9ff')
compare.save(root/'docs/frontend/reference-comparison.jpg',quality=93)
