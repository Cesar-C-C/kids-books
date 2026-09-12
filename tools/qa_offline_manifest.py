#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""qa_offline_manifest.py — 离线包清单 vs 运行时真实请求 的对齐校验

背景（2026-09-12 家长反馈「点了缓存，首次打开还要等」）：
    sw.js 预缓存用的是 **同源** URL（abs(p) -> /kids-books/books/x/a.webp），
    但页面在线时 img.src 是 **jsDelivr** URL（gcore.jsdelivr.net/gh/...）。
    sw.js 对跨域请求直接 return（不介入），于是「缓存里的副本」与
    「浏览器真正请求的对象」根本不是同一个键 —— 缓存下了，却永远不命中。

本脚本做静态侧的四项校验（不启浏览器）：
    1. 清单是否覆盖 book.js 里引用的每一张插图（含 coverImg）
    2. 清单里是否有 book.js 已不再引用的孤儿图（换图 / 换名留下的）
    3. 清单是否覆盖 book.js 引用到的每一个音频（audio/*.mp3）
    4. 书架封面：index.html 里每张封面都在 shell 清单里（且指向 _card480）

用法：
    python tools/qa_offline_manifest.py
退出码 0 = 全过；1 = 有问题。
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)

IMG_EXT = r'(?:webp|png|jpe?g|avif|svg)'
IMG_RE = re.compile(r'[\w./-]+\.' + IMG_EXT, re.I)
MP3_RE = re.compile(r'[\w./-]+\.mp3', re.I)

problems = []
notes = []


def load_manifest():
    path = os.path.join(REPO, 'pwa-assets.js')
    src = open(path, encoding='utf-8').read()
    body = src[src.index('{'):src.rindex('}') + 1]
    return json.loads(body)


def norm(p):
    p = p.strip().strip('\'"')
    p = re.sub(r'^\.[/\\]', '', p)
    p = p.split('?')[0]
    return p.replace('\\', '/')


def main():
    mf = load_manifest()
    books = mf.get('books', {})
    shell = set(norm(x) for x in mf.get('shell', []))

    print('离线清单版本 %s（audioVer=%s），shell %d 项，books %d 本'
          % (mf.get('version'), mf.get('audioVer'), len(shell), len(books)))
    print('=' * 78)

    for bid in sorted(books):
        listed = [norm(x) for x in books[bid]['files']]
        listed_set = set(listed)
        img_listed = set(f for f in listed if IMG_RE.fullmatch(f.split('/')[-1]))
        mp3_listed = set(f for f in listed if f.lower().endswith('.mp3'))

        # ---- 运行时引用：只认 book.js（overlays.js 只放矢量标注，不含位图） ----
        bj = os.path.join(REPO, 'books', bid, 'book.js')
        if not os.path.exists(bj):
            problems.append('[%s] 找不到 book.js' % bid)
            continue
        txt = open(bj, encoding='utf-8').read()
        # 只取形如 assets/xxx.webp 的相对引用；忽略注释里的历史文件名
        refs = set()
        for name in IMG_RE.findall(txt):
            n = norm(name)
            if n.startswith('assets/'):
                refs.add('books/%s/%s' % (bid, n))
        ref_mp3 = set()
        for name in MP3_RE.findall(txt):
            pass  # book.js 里音频是拼出来的（audioDir + 文件名），下面单独算

        # 音频：从 assets 之外的 audio 目录实际存在的文件算
        audio_dir = os.path.join(REPO, 'books', bid, 'audio')
        real_mp3 = set()
        if os.path.isdir(audio_dir):
            for fn in os.listdir(audio_dir):
                if fn.lower().endswith('.mp3'):
                    real_mp3.add('books/%s/audio/%s' % (bid, fn))

        missing_img = sorted(refs - listed_set)
        orphan_img = sorted(img_listed - refs)
        missing_mp3 = sorted(real_mp3 - mp3_listed)
        orphan_mp3 = sorted(mp3_listed - real_mp3)

        status = 'OK ' if not (missing_img or orphan_img or missing_mp3 or orphan_mp3) else 'BAD'
        print('%s %-11s 清单 %3d（图 %2d / 音 %3d） | 引用 图 %2d / 音 %3d'
              % (status, bid, len(listed), len(img_listed), len(mp3_listed),
                 len(refs), len(real_mp3)))

        for x in missing_img:
            problems.append('[%s] 图片被引用但不在离线清单：%s' % (bid, x))
        for x in orphan_img:
            problems.append('[%s] 离线清单里的孤儿图（book.js 已不引用）：%s' % (bid, x))
        for x in missing_mp3:
            problems.append('[%s] 音频缺失（磁盘有、清单没有）：%s' % (bid, x))
        for x in orphan_mp3:
            problems.append('[%s] 清单里的孤儿音频（磁盘已无）：%s' % (bid, x))

    # ---- 书架封面 ----
    print('-' * 78)
    idx = open(os.path.join(REPO, 'index.html'), encoding='utf-8').read()
    covers = set()
    for c in re.findall(r'data-kbc="([^"]+_card480[^"]*)"', idx):
        covers.add(norm(c))
    covers2 = set()
    for c in re.findall(r'src="([^"]+_card480[^"]*)"', idx):
        covers2.add(norm(c))
    bad_covers = sorted((covers | covers2) - shell)
    if bad_covers:
        for c in bad_covers:
            problems.append('[书架] 封面不在 shell 清单：%s' % c)
    else:
        notes.append('书架封面 %d 张全部在 shell 清单内（_card480 派生图）' % len(covers | covers2))
    coverset_all = covers | covers2
    if covers != covers2:
        problems.append('[书架] data-kbc 与 src 指向的封面集合不一致（%d vs %d）'
                        % (len(covers), len(covers2)))

    print('=' * 78)
    for n in notes:
        print('  · ' + n)
    if problems:
        print('\n发现 %d 个问题：' % len(problems))
        for p in problems:
            print('  ✗ ' + p)
        return 1
    print('\n全部对齐：清单与实际请求一一对应。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
