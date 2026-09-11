"""给所有页面接上 PWA 与多节点 CDN（幂等，可重复运行）。

为什么做成工具而不是手改一次：以后加新书 / 新实验室时，
tools/gen_pwa_assets.py 会自动把它收进离线清单，但新页面的 <head> 里
不会自动长出 manifest 与 cdn.js 这些标签。跑一次这个脚本就补齐了。

会做的事（已存在的标签不会重复插入）：
  1. 补 <meta theme-color> / manifest / favicon / apple-touch-icon / pwa.css
  2. 把 labs 页面里占位的 href="data:," 换成本站真实 favicon
  3. 补 <script shared/cdn.js>（多节点 CDN 级联，必须早于 reader.js）
  4. 补 <script shared/pwa.js>（Service Worker 注册 + 安装引导 + 离线面板）

保留原文件的换行风格（本机工作区是 CRLF，仓库里是 LF），
不改动其它任何内容 —— 方便用 git diff 复核。

用法：
    python tools/wire_pwa_pages.py           # 写入
    python tools/wire_pwa_pages.py --check   # 只检查，有缺就非零退出
"""
import glob
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HEAD_TAGS = [
    '<meta name="theme-color" content="#2a9d8f">',
    '<link rel="manifest" href="{p}manifest.webmanifest">',
    '<link rel="icon" href="{p}icons/favicon-32.png">',
    '<link rel="apple-touch-icon" href="{p}icons/apple-touch-icon.png">',
    '<link rel="stylesheet" href="{p}shared/pwa.css">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-title" content="小小探索家">',
]


def pages():
    out = []
    for pat in ("index.html", "books/*/index.html", "labs/index.html", "labs/*/index.html"):
        out.extend(glob.glob(os.path.join(REPO, pat)))
    return [p for p in sorted(out) if os.path.isfile(p)]


def prefix_for(path):
    rel = os.path.relpath(path, REPO).replace("\\", "/")
    return "../" * rel.count("/")


def wire(path):
    """返回 (相对路径, 新内容, 改动说明列表)。"""
    rel = os.path.relpath(path, REPO).replace("\\", "/")
    p = prefix_for(path)
    with open(path, encoding="utf-8", newline="") as f:
        src = f.read()
    nl = "\r\n" if "\r\n" in src else "\n"
    original = src
    notes = []

    def indent_of(pos):
        m = re.match(r"[ \t]*", src[pos:])
        return m.group(0) if m else ""

    # ---- 1) 把 labs 里占位的 favicon 换成真的 ----
    if 'href="data:,"' in src:
        src = src.replace('href="data:,"', 'href="%sicons/favicon-32.png"' % p)
        notes.append("favicon")

    # ---- 2) head 标签 ----
    missing = []
    for t in HEAD_TAGS:
        tag = t.format(p=p)
        if tag in src:
            continue
        # theme-color 有些页面已经自己声明了（实验室用 #f7f8f2），别再插一个打架
        if 'name="theme-color"' in tag and re.search(r'<meta\s+name="theme-color"', src):
            continue
        missing.append(tag)
    if missing:
        m = re.search(r"[ \t]*</head>", src)
        if m:
            indent = indent_of(m.start()) or "  "
            src = src[:m.start()] + nl.join(indent + t for t in missing) + nl + src[m.start():]
            notes.append("head+%d" % len(missing))
        else:
            notes.append("!! 无 </head> 插入点")

    # ---- 3) cdn.js：必须早于 reader.js / overlays.js ----
    cdn_tag = '<script src="%sshared/cdn.js"></script>' % p
    if cdn_tag not in src:
        m = re.search(r'[ \t]*<script\s+src="[^"]*shared/(reader|overlays)\.js"', src)
        if m:
            indent = indent_of(m.start()) or "  "
            src = src[:m.start()] + indent + cdn_tag + nl + src[m.start():]
            notes.append("cdn.js")

    # ---- 4) pwa.js：放 body 末尾 ----
    pwa_tag = '<script src="%sshared/pwa.js"></script>' % p
    if pwa_tag not in src:
        m = re.search(r"[ \t]*</body>", src)
        if m:
            indent = indent_of(m.start()) or "  "
            src = src[:m.start()] + indent + pwa_tag + nl + src[m.start():]
            notes.append("pwa.js")

    return rel, src, (src != original), notes


def main():
    check_only = "--check" in sys.argv
    touched = 0
    for path in pages():
        rel, new, changed, notes = wire(path)
        print("%s %-36s %s" % ("CHANGED" if changed else "ok     ", rel, ", ".join(notes)))
        if changed:
            touched += 1
            if not check_only:
                with open(path, "w", encoding="utf-8", newline="") as f:
                    f.write(new)
    print("\n需要改动 %d 个页面%s" % (touched, "（--check 模式，未写入）" if check_only else ""))
    if check_only and touched:
        sys.exit(1)


if __name__ == "__main__":
    main()
