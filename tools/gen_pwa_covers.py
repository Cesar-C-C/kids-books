"""为书架首页生成小尺寸封面派生图（`_card480.webp`）。

为什么需要这个脚本
------------------
首页 `.book-card .cover` 的槽位只有约 200px 宽（手机两列布局），而原图是
1216×832 的整页插画，12 张合计 2.81MB。直接拿原图当封面有两个代价：

  1. 首屏白白多传约 2.5MB —— 页面本身才 1.65MB，封面比页面重一倍；
  2. 更要命的是离线：封面在线上走 jsDelivr（跨域），Service Worker 按设计
     放行不缓存；于是断网打开书架时，只有「已下载那本书」的封面能从离线包
     命中，其余全是空白卡片 —— 而 `loading="lazy"` 使得折叠线以下的封面
     连第一次加载都没有，空白更明显。

   把 480px 派生图放进外壳预缓存（见 tools/gen_pwa_assets.py），一次性解决
   两件事：首屏少传 2.5MB，离线书架 12 张封面齐全。

命名规则
--------
    assets/01_cover_c_r2.webp  ->  assets/01_cover_c_r2_card480.webp

宽度写进文件名是有意的：万一以后要改尺寸，换的是新文件名而不是覆盖旧文件。
这也符合本仓库「图片绝不复用文件名」的缓存铁律 —— 源图从 _r2 换成 _r3 时，
派生名自动变成 _r3_card480，CDN 与浏览器都不会取到旧图。

用法
----
    python tools/gen_pwa_covers.py            # 生成（内容不变则不重写）
    python tools/gen_pwa_covers.py --check    # 只校验，缺失/尺寸不对则退出码 1
    python tools/gen_pwa_covers.py --print    # 只打印发现结果
"""
import argparse
import io
import os
import re
import sys

from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS = os.path.join(REPO, "books")

CARD_WIDTH = 480      # 约合手机两列布局 200px 槽位的 2.4x 像素密度
CARD_QUALITY = 72
CARD_METHOD = 6       # webp 编码努力度，越高越慢但越小

# 派生图后缀。改宽度时这里和 CARD_WIDTH 必须一起改。
CARD_SUFFIX = "_card%d" % CARD_WIDTH

COVER_IMG_RE = re.compile(r"coverImg\s*:\s*['\"](assets/[^'\"]+\.webp)['\"]")
ANY_COVER_RE = re.compile(r"['\"](assets/[^'\"]*cover[^'\"]*\.webp)['\"]")


def cover_rel(book_id):
    """从 book.js 取出首页封面用的那张图（相对 books/<id>/ 的路径）。

    优先认 `coverImg:` —— 这是 book.js 里封面页的正式声明，
    与 qa_library_r2_assets.py 的提取口径保持一致。取不到再退而求其次，
    在 book.js 里找第一个文件名带 cover 的 webp。
    """
    p = os.path.join(BOOKS, book_id, "book.js")
    if not os.path.exists(p):
        return None
    src = open(p, encoding="utf-8").read()
    m = COVER_IMG_RE.search(src) or ANY_COVER_RE.search(src)
    return m.group(1) if m else None


def card_rel(book_id, cover):
    """assets/01_cover_c_r2.webp -> assets/01_cover_c_r2_card480.webp"""
    stem, ext = os.path.splitext(cover)
    return stem + CARD_SUFFIX + ext


def book_ids():
    return sorted(
        d for d in os.listdir(BOOKS)
        if os.path.isdir(os.path.join(BOOKS, d))
        and os.path.exists(os.path.join(BOOKS, d, "book.js"))
    )


def discover():
    """返回 [(book_id, cover_rel, card_rel)]，跳过没有封面的书。"""
    out = []
    for bid in book_ids():
        cover = cover_rel(bid)
        if cover:
            out.append((bid, cover, card_rel(bid, cover)))
    return out


def expected_size(src_path):
    """派生图应有的像素尺寸：宽度收窄到 CARD_WIDTH，保持原图高宽比。"""
    with Image.open(src_path) as im:
        w, h = im.size
    return (CARD_WIDTH, max(1, round(h * CARD_WIDTH / w)))


def render(src_path):
    with Image.open(src_path) as im:
        im = im.convert("RGB")
        w, h = im.size
        if w <= CARD_WIDTH:
            # 原图本来就比目标窄，不要放大（放大只会糊，还更大）
            out = im
        else:
            out = im.resize((CARD_WIDTH, max(1, round(h * CARD_WIDTH / w))), Image.LANCZOS)
        buf = io.BytesIO()
        out.save(buf, "WEBP", quality=CARD_QUALITY, method=CARD_METHOD)
        return buf.getvalue()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="只校验派生图是否存在且尺寸正确，不写文件")
    ap.add_argument("--print", dest="show", action="store_true",
                    help="只打印发现结果")
    args = ap.parse_args()

    items = discover()
    missing_cover, missing_card, bad_size = [], [], []
    written, unchanged = 0, 0
    total_orig, total_card = 0, 0

    for bid, cover, card in items:
        src = os.path.join(BOOKS, bid, cover)
        dst = os.path.join(BOOKS, bid, card)
        if not os.path.exists(src):
            missing_cover.append("%s/%s" % (bid, cover))
            continue

        want = expected_size(src)
        orig_bytes = os.path.getsize(src)

        if args.show:
            print("%-11s %-34s %5d KB -> %dx%d" % (
                bid, os.path.basename(card), orig_bytes // 1024, want[0], want[1]))
            continue

        if args.check:
            if not os.path.exists(dst):
                missing_card.append("%s/%s" % (bid, card))
                continue
            with Image.open(dst) as im:
                got, fmt = im.size, im.format
            if got != want or fmt != "WEBP":
                bad_size.append("%s: %s %s，期望 %s" % (bid, got, fmt, want))
                continue
            total_orig += orig_bytes
            total_card += os.path.getsize(dst)
            continue

        data = render(src)
        if os.path.exists(dst) and open(dst, "rb").read() == data:
            unchanged += 1
        else:
            tmp = dst + ".tmp"
            with open(tmp, "wb") as f:
                f.write(data)
            os.replace(tmp, dst)      # 原子替换，避免中途失败留下半个文件
            written += 1
        total_orig += orig_bytes
        total_card += len(data)

    if args.show:
        return 0

    if args.check:
        for m in missing_cover:
            print("ERROR 缺原图：%s" % m)
        for m in missing_card:
            print("ERROR 缺派生图（跑 python tools/gen_pwa_covers.py）：%s" % m)
        for m in bad_size:
            print("ERROR 派生图不对：%s" % m)
        if missing_cover or missing_card or bad_size:
            print("\n%d 项失败" % (len(missing_cover) + len(missing_card) + len(bad_size)))
            return 1
        print("封面派生图 OK：%d 张，%.0f KB -> %.0f KB（省 %.1f MB）" % (
            len(items), total_orig / 1024, total_card / 1024,
            (total_orig - total_card) / 1048576))
        return 0

    for m in missing_cover:
        print("WARN 缺原图，已跳过：%s" % m)
    print("封面派生图：新写 %d，无变化 %d，共 %d 本，%.0f KB -> %.0f KB（省 %.1f MB）" % (
        written, unchanged, len(items), total_orig / 1024, total_card / 1024,
        (total_orig - total_card) / 1048576))
    return 0


if __name__ == "__main__":
    sys.exit(main())
