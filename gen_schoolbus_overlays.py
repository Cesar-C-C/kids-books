#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate books/schoolbus/overlays.js with ADAPTIVE-BUBBLE hotspot data.
For each hotspot we sample the illustration behind it (PIL) and compute the
relative luminance, then set bg:'light' (bright bg -> dark navy bubble) or
bg:'dark' (dark bg -> light cream bubble). Deterministic, no runtime CORS.
"""
import os
from PIL import Image

ROOT = "C:/Users/Administrator/WorkBuddy/cesar_agent_fold/kids-books"
BOOK = "schoolbus"
ASSETS = os.path.join(ROOT, "books", BOOK, "assets")
OUT = os.path.join(ROOT, "books", BOOK, "overlays.js")

# key -> illustration filename
IMG = {
    'sb_parts':    '01_parts_c.webp',
    'sb_driver':   '02_driver_c.webp',
    'sb_inside':   '03_inside_c.webp',
    'sb_wheels':   '04_wheels_c.webp',
    'sb_stopsign': '05_stopsign_c.webp',
    'sb_doors':    '06_doors_c.webp',
    'sb_aide':     '07_aide_c.webp',
    'sb_road':     '08_road_c.webp',
    'sb_arrive':   '09_arrive_c.webp',
    'sb_vocab':    '10_vocab_c.webp',
}

# hotspot data per page. px,py = IMAGE pixel coords (1216x832).
# Coordinates were visually calibrated against the generated illustrations.
HOT = {
    'sb_parts': [
        dict(px=600, py=420, name='Windows', nameZh='车窗',
             fact='where we look out', factZh='看风景的窗',
             line="Look out through me — what do you see?", lineZh='透过我看——你看到了什么？', lineKey='sb_parts_0'),
        dict(px=230, py=520, name='Friendly face', nameZh='车头笑脸',
             fact='the front with lights and window', factZh='有灯和窗的车头',
             line="Beep beep! I'm the friendly front of the bus.", lineZh='嘀嘀！我是巴士友好的车头。', lineKey='sb_parts_1'),
        dict(px=350, py=680, name='Wheels', nameZh='车轮',
             fact='the tires that roll the bus', factZh='让巴士滚动的轮胎',
             line="We roll and roll to move the bus!", lineZh='我们滚滚滚，带着巴士走！', lineKey='sb_parts_2'),
        dict(px=420, py=520, name='Stop sign', nameZh='停车牌',
             fact='swings out to stop cars', factZh='伸出去让车停下',
             line="When I pop out, cars must wait!", lineZh='我一伸出来，车车都要等！', lineKey='sb_parts_3'),
    ],
    'sb_driver': [
        dict(px=820, py=470, name='Driver', nameZh='司机',
             fact='the person who drives', factZh='开车的人',
             line="I keep everyone safe on the road.", lineZh='我保证大家在路上都安全。', lineKey='sb_driver_0'),
        dict(px=620, py=590, name='Steering wheel', nameZh='方向盘',
             fact='turns the bus', factZh='转动巴士',
             line="Turn me to steer the bus!", lineZh='转我，巴士就转弯！', lineKey='sb_driver_1'),
        dict(px=420, py=260, name='Windshield', nameZh='挡风玻璃',
             fact='the big front window', factZh='前面的大窗',
             line="I show the driver the road ahead.", lineZh='我让司机看到前面的路。', lineKey='sb_driver_2'),
        dict(px=520, py=620, name='Dashboard', nameZh='仪表盘',
             fact='dials that show speed', factZh='显示速度的仪表',
             line="My dials show how fast we go.", lineZh='我的仪表显示开多快。', lineKey='sb_driver_3'),
    ],
    'sb_inside': [
        dict(px=650, py=520, name='Seats', nameZh='座位',
             fact='cozy seats in rows', factZh='一排排舒服的座位',
             line="Sit here with your friends!", lineZh='和好朋友坐在这里吧！', lineKey='sb_inside_0'),
        dict(px=590, py=760, name='Aisle', nameZh='走道',
             fact='the walkway in the middle', factZh='中间的走道',
             line="Walk down me to your seat.", lineZh='沿着我走到你的座位。', lineKey='sb_inside_1'),
        dict(px=950, py=420, name='Window', nameZh='车窗',
             fact='where we look out', factZh='看外面的窗',
             line="Look outside with me!", lineZh='和我一起看外面！', lineKey='sb_inside_2'),
        dict(px=540, py=500, name='Friend', nameZh='小伙伴',
             fact='a happy child on board', factZh='车上的开心小朋友',
             line="Hi! I'm riding to school!", lineZh='嗨！我正坐车去幼儿园！', lineKey='sb_inside_3'),
    ],
    'sb_wheels': [
        dict(px=400, py=470, name='Tire', nameZh='轮胎',
             fact='thick rubber that grips road', factZh='抓路面的厚橡胶',
             line="My rubber grips the road tightly!", lineZh='我的橡胶紧紧抓着路面！', lineKey='sb_wheels_0'),
        dict(px=500, py=480, name='Hubcap', nameZh='轮毂',
             fact='shiny metal center', factZh='亮亮的金属中心',
             line="I spin round and round!", lineZh='我转呀转！', lineKey='sb_wheels_1'),
        dict(px=290, py=440, name='Treads', nameZh='胎纹',
             fact='grooves that stop slipping', factZh='防滑的凹槽',
             line="My grooves help the bus not slip.", lineZh='我的花纹让巴士不打滑。', lineKey='sb_wheels_2'),
        dict(px=620, py=780, name='Road', nameZh='马路',
             fact='the street the bus drives on', factZh='巴士行驶的马路',
             line="Smooth and strong — that's me!", lineZh='又平又结实——就是我！', lineKey='sb_wheels_3'),
    ],
    'sb_stopsign': [
        dict(px=430, py=530, name='Stop sign', nameZh='停车牌',
             fact='red sign that stops cars', factZh='让车停下的红牌',
             line="Stop! Wait for the children!", lineZh='停！等小朋友们先过！', lineKey='sb_stopsign_0'),
        dict(px=450, py=230, name='Flashing light', nameZh='警示灯',
             fact='yellow light that warns', factZh='提醒的黄色灯',
             line="Blink blink! Cars, please wait!", lineZh='眨呀眨！车车请等一下！', lineKey='sb_stopsign_1'),
        dict(px=1050, py=620, name='Car', nameZh='小汽车',
             fact='waits behind the bus', factZh='在巴士后面等',
             line="I wait for the bus to finish.", lineZh='我等着巴士先走完。', lineKey='sb_stopsign_2'),
        dict(px=650, py=500, name='Bus', nameZh='巴士',
             fact='our safe yellow friend', factZh='安全的黄色朋友',
             line="Hop on when it's safe!", lineZh='安全的时候上来吧！', lineKey='sb_stopsign_3'),
    ],
    'sb_doors': [
        dict(px=500, py=500, name='Door', nameZh='车门',
             fact='opens to let children off', factZh='打开让小朋友下车',
             line="Open sesame — step down!", lineZh='开门啦——下台阶！', lineKey='sb_doors_0'),
        dict(px=560, py=650, name='Child', nameZh='小朋友',
             fact='hops down the steps', factZh='跳下台阶的孩子',
             line="Bye bye, driver! See you!", lineZh='拜拜司机！明天见！', lineKey='sb_doors_1'),
        dict(px=300, py=380, name='Driver', nameZh='司机',
             fact='waves from the cab', factZh='在驾驶室挥手',
             line="Have a great day at school!", lineZh='在幼儿园玩得开心！', lineKey='sb_doors_2'),
        dict(px=850, py=300, name='Kindergarten', nameZh='幼儿园',
             fact='the school we go to', factZh='我们要去的幼儿园',
             line="Welcome to our kindergarten!", lineZh='欢迎来到我们的幼儿园！', lineKey='sb_doors_3'),
    ],
    'sb_aide': [
        dict(px=450, py=520, name='Bus aide', nameZh='随车老师',
             fact='helps the children', factZh='照顾小朋友',
             line="I help every child feel safe!", lineZh='我让每个小朋友都安心！', lineKey='sb_aide_0'),
        dict(px=620, py=560, name='Child', nameZh='小朋友',
             fact='gets help with the belt', factZh='被帮忙系安全带',
             line="Thank you for helping me!", lineZh='谢谢你帮我！', lineKey='sb_aide_1'),
        dict(px=650, py=560, name='Seat', nameZh='座位',
             fact='where the child sits', factZh='小朋友坐的位子',
             line="Sit down and buckle up!", lineZh='坐下，系好安全带！', lineKey='sb_aide_2'),
        dict(px=950, py=420, name='Window', nameZh='车窗',
             fact='sunny view outside', factZh='外面阳光的风景',
             line="Look — the sun is shining!", lineZh='看——太阳出来啦！', lineKey='sb_aide_3'),
    ],
    'sb_road': [
        dict(px=1080, py=300, name='Traffic light', nameZh='红绿灯',
             fact='red means stop, green go', factZh='红灯停绿灯行',
             line="Red means stop, green means go!", lineZh='红灯停，绿灯行！', lineKey='sb_road_0'),
        dict(px=1050, py=680, name='Car', nameZh='小汽车',
             fact='shares the road', factZh='一起走的小汽车',
             line="Vroom — sharing the road!", lineZh='呜——一起走！', lineKey='sb_road_1'),
        dict(px=700, py=770, name='Crosswalk', nameZh='斑马线',
             fact='where people cross', factZh='行人过马路的地方',
             line="Walk here, nice and slow.", lineZh='在这里慢慢走。', lineKey='sb_road_2'),
        dict(px=850, py=500, name='Bus', nameZh='巴士',
             fact='our yellow friend', factZh='我们的黄色朋友',
             line="We follow the rules, too!", lineZh='我们也守规矩！', lineKey='sb_road_3'),
    ],
    'sb_arrive': [
        dict(px=350, py=500, name='Bus', nameZh='巴士',
             fact='arrived at school', factZh='到学校的巴士',
             line="We made it — safe and sound!", lineZh='我们到啦——平平安安！', lineKey='sb_arrive_0'),
        dict(px=120, py=520, name='Slide', nameZh='滑梯',
             fact='fun to slide down', factZh='滑下来很好玩',
             line="Wheee! Down the slide I go!", lineZh='哇——从滑梯滑下来！', lineKey='sb_arrive_1'),
        dict(px=1050, py=450, name='Swing', nameZh='秋千',
             fact='swing up high', factZh='荡得高高的',
             line="Swing up to the sky!", lineZh='荡到天上去！', lineKey='sb_arrive_2'),
        dict(px=700, py=720, name='Friend', nameZh='小伙伴',
             fact='runs to play', factZh='跑着去玩',
             line="Yay! Time to play!", lineZh='耶！玩的时间到！', lineKey='sb_arrive_3'),
    ],
    'sb_vocab': [
        dict(px=500, py=450, name='School bus', nameZh='校车',
             fact='a yellow bus for kids', factZh='接送孩子的黄巴士',
             line="I'm the star of the show!", lineZh='我是今天的主角！', lineKey='sb_vocab_0'),
        dict(px=130, py=480, name='Tire', nameZh='轮胎',
             fact='the rubber wheel', factZh='橡胶车轮',
             line="I roll the bus along!", lineZh='我带着巴士跑！', lineKey='sb_vocab_1'),
        dict(px=240, py=180, name='Window', nameZh='车窗',
             fact='look out', factZh='看外面',
             line="Peek through me!", lineZh='透过我看！', lineKey='sb_vocab_2'),
        dict(px=740, py=190, name='Seat', nameZh='座位',
             fact='where kids sit', factZh='孩子坐的地方',
             line="Have a seat!", lineZh='坐下来吧！', lineKey='sb_vocab_3'),
        dict(px=230, py=760, name='Steering wheel', nameZh='方向盘',
             fact='turns the bus', factZh='让巴士转弯',
             line="I steer the way!", lineZh='我掌舵！', lineKey='sb_vocab_4'),
        dict(px=870, py=530, name='Stop sign', nameZh='停车牌',
             fact='stops the cars', factZh='让车停下',
             line="Cars wait for me!", lineZh='车车等我！', lineKey='sb_vocab_5'),
        dict(px=750, py=510, name='Flashing light', nameZh='警示灯',
             fact='warns drivers', factZh='提醒司机',
             line="Blink blink, be careful!", lineZh='眨呀眨，小心点！', lineKey='sb_vocab_6'),
        dict(px=750, py=780, name='Bus aide', nameZh='随车老师',
             fact='helps kids', factZh='照顾孩子',
             line="I keep kids safe!", lineZh='我保护孩子！', lineKey='sb_vocab_7'),
    ],
}


def rel_luminance(px, py, img):
    """Sample a patch around (px,py) and return relative luminance 0..1."""
    W, H = img.size
    x0 = max(0, px - 25); x1 = min(W, px + 25)
    y0 = max(0, py - 25); y1 = min(H, py + 25)
    crop = img.crop((x0, y0, x1, y1)).convert('RGB')
    data = list(crop.getdata())
    n = len(data) or 1
    r = sum(p[0] for p in data) / n
    g = sum(p[1] for p in data) / n
    b = sum(p[2] for p in data) / n
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0


# compute bg for every hotspot
for key, lst in HOT.items():
    img = Image.open(os.path.join(ASSETS, IMG[key])).convert('RGB')
    for h in lst:
        L = rel_luminance(h['px'], h['py'], img)
        h['bg'] = 'light' if L > 0.5 else 'dark'
        print(f"  {key} {h['lineKey']:14s} px({h['px']:4d},{h['py']:4d}) L={L:.2f} -> {h['bg']}")


def emit_part(h):
    return (
        f"      partSVG({{px:{h['px']}, py:{h['py']}, name:'{h['name']}', nameZh:'{h['nameZh']}', "
        f"fact:'{h['fact']}', factZh:'{h['factZh']}', "
        f"line:\"{h['line']}\", lineZh:'{h['lineZh']}', lineKey:'{h['lineKey']}', "
        f"bg:'{h['bg']}'}})"
    )


lines = []
lines.append("/* ============================================================")
lines.append("   Kindergarten School Bus overlays — BUBBLE-MODE adaptive hotspots.")
lines.append("   px/py are IMAGE pixel coords (1216x832). partSVG auto-converts.")
lines.append("   Each hotspot carries bg:'light'|'dark' (PIL-computed from the")
lines.append("   illustration) so the speech bubble stays legible on any bg.")
lines.append("   ============================================================ */")
lines.append("window.OVL = {")
for key in IMG:
    lines.append(f"  {key}(){{")
    lines.append("    return svgWrap(")
    parts = " +\n".join(emit_part(h) for h in HOT[key])
    lines.append(parts)
    lines.append("    );")
    lines.append("  },")
lines.append("};")

with open(OUT, 'w', encoding='utf-8') as f:
    f.write("\n".join(lines) + "\n")

print("\nWROTE", OUT)
