"""Synthetic pen strokes, circles and ruling for reader regression checks.

These are generated fixtures, not a benchmark of real teacher handwriting.
Run with Python and Pillow. No student data is used.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / 'tests/fixtures/marks'
SCALE = 2
PEN = (40, 54, 109)

def stroke(draw, points, width=4, color=PEN):
    draw.line([(round(x*SCALE), round(y*SCALE)) for x,y in points], fill=color,
              width=width*SCALE, joint='curve')

def loop(draw, cx, cy, rx, ry, width=4):
    stroke(draw, [(cx+rx*math.cos(t)*(1+.025*math.sin(3*t)),
                   cy+ry*math.sin(t)+3*math.cos(2*t))
                  for t in [i*2*math.pi/240 for i in range(241)]], width)

def paper():
    im = Image.new('RGB', (900*SCALE,520*SCALE), (247,244,231))
    d = ImageDraw.Draw(im)
    for y in range(38,520,54): stroke(d, [(0,y),(900,y+3)], 1, (155,180,200))
    stroke(d, [(105,0),(108,520)], 1, (207,153,156))
    return im,d

def eight(d,cx,cy):
    stroke(d, [(cx+41*math.sin(2*t)+4*math.cos(t), cy-83*math.cos(t))
               for t in [i*2*math.pi/260 for i in range(261)]])

def save(im,name):
    im.resize((im.width//SCALE,im.height//SCALE),Image.Resampling.LANCZOS).save(OUT/(name+'.png'))

im,d=paper(); eight(d,470,260); loop(d,470,260,111,132,3)
save(im,'circled-eight-lined')
save(im.rotate(90,expand=True),'circled-eight-lined-rotated')
im,d=paper(); loop(d,470,260,42,76); loop(d,470,260,112,135,3)
save(im,'circled-zero-lined')
im,d=paper()
stroke(d,[(342,187),(405,183),(367,330)])
stroke(d,[(540,186),(479,186),(474,249),(508,243),(539,258),(546,289),(532,321),(500,331),(473,315)])
d.ellipse((431*SCALE,313*SCALE,439*SCALE,321*SCALE),fill=PEN)
loop(d,443,260,151,139,3)
save(im,'circled-decimal-lined')
im,d=paper(); save(im,'lined-no-mark')
im,d=paper(); eight(d,330,260); loop(d,330,260,108,132,3)
loop(d,660,260,42,76); loop(d,660,260,111,133,3)
save(im,'circled-multiple-lined')
