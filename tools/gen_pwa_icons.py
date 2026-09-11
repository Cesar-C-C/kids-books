"""生成 PWA 图标（纯手绘矢量风格，不使用任何原图素材）。

设计：绿色圆角底 + 白色摊开的书 + 黄色小星星，扁平无渐变。
输出：
  icons/icon-192.png           常规图标
  icons/icon-512.png           常规图标
  icons/icon-maskable-512.png  Android 自适应图标（内容收进 60% 安全区）
  icons/apple-touch-icon.png   iOS 主屏图标 180×180（不透明）
  icons/favicon-32.png         浏览器标签页
超采样 4 倍绘制后再缩小，得到平滑边缘。

用法： python tools/gen_pwa_icons.py
"""
import math
import os

from PIL import Image, ImageDraw

BG = (42, 157, 143, 255)        # --green #2a9d8f
PAGE = (255, 255, 255, 255)
PAGE_SHADE = (230, 244, 241, 255)
SPINE = (30, 122, 111, 255)
STAR = (255, 209, 102, 255)     # --yellow #ffd166
LINE = (196, 226, 220, 255)
SS = 4                          # 超采样倍数
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")


def star_points(cx, cy, outer, inner, n=5, rot=-math.pi / 2):
    pts = []
    for i in range(n * 2):
        r = outer if i % 2 == 0 else inner
        a = rot + i * math.pi / n
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def draw_icon(size, maskable=False):
    """返回 RGBA 图像。maskable=True 时内容缩小到安全区并铺满背景。"""
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if maskable:
        # 自适应图标会被系统裁成圆形/方形等各种形状，背景必须铺满整块画布，
        # 且视觉主体要落在中心 60% 的安全区内。
        d.rectangle([0, 0, s, s], fill=BG)
        k = 0.60
    else:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=s * 0.22, fill=BG)
        k = 1.0

    def X(v):  # 归一化坐标 → 画布坐标（围绕中心缩放到 k 倍）
        return s / 2 + (v - 0.5) * s * k

    def Y(v):
        return s / 2 + (v - 0.5) * s * k

    def poly(pts, fill):
        d.polygon([(X(x), Y(y)) for x, y in pts], fill=fill)

    # ---- 书：左右两页合成一个 V 形（书脊在中间偏上）----
    poly([(0.50, 0.365), (0.865, 0.455), (0.865, 0.745), (0.50, 0.665)], PAGE)
    poly([(0.50, 0.365), (0.135, 0.455), (0.135, 0.745), (0.50, 0.665)], PAGE_SHADE)
    # 书脊
    d.line([(X(0.50), Y(0.365)), (X(0.50), Y(0.667))], fill=SPINE, width=max(1, int(s * 0.012)))

    # ---- 页面上的文字示意线（小图标下省略，否则会糊成一团）----
    if size >= 96:
        w = max(1, int(s * 0.011))
        for i, y in enumerate((0.505, 0.565, 0.625)):
            d.line([(X(0.60), Y(y)), (X(0.795), Y(y))], fill=LINE, width=w)
            d.line([(X(0.205), Y(y)), (X(0.40), Y(y))], fill=LINE, width=w)

    # ---- 星星 ----
    outer = 0.098 * k
    cy = 0.5 + (0.205 - 0.5) * k
    d.polygon(
        [(X(0.5 + (px - 0.5) * 1.0), Y(0.5 + (py - 0.5) * 1.0))
         for px, py in star_points(0.5, 0.205, outer, outer * 0.42)],
        fill=STAR,
    )

    return img.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    jobs = [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-maskable-512.png", 512, True),
        ("apple-touch-icon.png", 180, False),
        ("favicon-32.png", 32, False),
    ]
    for name, size, maskable in jobs:
        img = draw_icon(size, maskable)
        path = os.path.join(OUT, name)
        img.save(path, "PNG", optimize=True)
        raw = img.convert("RGBA")
        assert raw.size == (size, size), name
        print("wrote %-26s %4dx%-4d %6d bytes" % (name, size, size, os.path.getsize(path)))


if __name__ == "__main__":
    main()
