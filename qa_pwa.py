"""PWA / 离线包 / 多节点 CDN 的静态校验。

这些检查故意不依赖浏览器，可以在 CI 里跑（现有 .github/workflows/labs.yml
只跑纯 Node 校验，绘本类与 PWA 类校验一直是盲区）。

检查项：
  1. manifest.webmanifest 合法、图标文件存在且尺寸与声明一致
  2. pwa-assets.js 内容指纹仍匹配当前文件；每个文件存在；音频 URL 带正确的 ?v=<AUDIO_VER>
  3. Service Worker 的关键约定没被改坏（离线包缓存不随版本清空、只回填 200）
  4. 所有页面都接上了 manifest / cdn.js / pwa.js
  5. reader.js 里没有遗留的旧 CDN 常量
  6. 首页封面走 _card480 小派生图，且都在外壳预缓存里

用法：python qa_pwa.py      退出码 0 = 全部通过
"""
import json
import hashlib
import os
import re
import struct
import sys

from tools.pwa_fingerprint import content_sha256 as fingerprint_sha256
from tools.story_resources import discover as story_resources

REPO = os.path.dirname(os.path.abspath(__file__))
fails, warns, checks = [], [], 0


def bad(msg):
    fails.append(msg)


def warn(msg):
    warns.append(msg)


def ok():
    global checks
    checks += 1


def png_size(path):
    """不依赖 Pillow，直接读 PNG 的 IHDR。"""
    with open(path, "rb") as f:
        head = f.read(26)
    if head[:8] != b"\x89PNG\r\n\x1a\n" or head[12:16] != b"IHDR":
        return None
    return struct.unpack(">II", head[16:24])


def rel_path(p):
    return os.path.join(REPO, p.replace("/", os.sep).split("?")[0])


def content_sha256(asset):
    return fingerprint_sha256(rel_path(asset))


def expected_asset_version(data):
    """Recompute the generator's content fingerprint without writing files."""
    digest = hashlib.sha256()
    for asset in data.get("shell", []):
        digest.update(("%s:%s;" % (asset, content_sha256(asset))).encode())
    for book_id in sorted(data.get("books", {})):
        for asset in data["books"][book_id].get("files", []):
            digest.update(("%s:%s;" % (asset, content_sha256(asset))).encode())
    for animation_id in sorted(data.get("animations", {})):
        for asset in data["animations"][animation_id].get("files", []):
            animation_path(asset)
            digest.update(("%s:%s;" % (asset, content_sha256(asset))).encode())
    return digest.hexdigest()[:12]


def expected_asset_total(data):
    """Keep the historical book budget; charge shared animation URLs only once."""
    shell = data.get("shell", [])
    animation_extra = {asset for package in data.get("animations", {}).values()
                       for asset in package["files"] if asset not in set(shell)}
    return (sum(os.path.getsize(rel_path(asset)) for asset in shell)
            + sum(book["bytes"] for book in data.get("books", {}).values())
            + sum(os.path.getsize(rel_path(asset)) for asset in animation_extra))


def animation_path(asset, prefix="animations/"):
    """Validate an exact same-origin cache key before opening its disk path."""
    if (not isinstance(asset, str) or not asset.startswith(prefix)
            or not re.fullmatch(r"[A-Za-z0-9_./-]+(?:\?v=[a-f0-9]{12})?", asset)
            or any(part in ("", ".", "..") for part in asset.split("?")[0].split("/"))):
        raise ValueError("动画资源 URL 非规范或越界：%r" % asset)
    target = os.path.realpath(rel_path(asset))
    if os.path.commonpath([os.path.realpath(REPO), target]) != os.path.realpath(REPO):
        raise ValueError("动画资源越出仓库：%s" % asset)
    return target


def animation_record(asset):
    with open(animation_path(asset), "rb") as source:
        raw = source.read()
    return {"sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)}


def check_animations(data):
    """Independent runtime inventory: never call the manifest generator/discoverer."""
    packages = data.get("animations", {})
    if not isinstance(packages, dict):
        return bad("animations 必须是对象")
    build_path = os.path.join(REPO, "animations", "build-manifest.json")
    if not os.path.isfile(build_path):
        if packages:
            bad("动画清单存在，但缺少 animations/build-manifest.json")
        # An old site without an animation build must keep its original contract.
        return
    before = len(fails)
    try:
        shell = data.get("shell", [])
        if len(shell) != len(set(shell)):
            bad("含动画的 shell 清单有重复 URL，不能重复计价")
        for package in packages.values():
            for asset in package["files"]:
                animation_path(asset)
        with open(build_path, encoding="utf-8") as source:
            build = json.load(source)
        if build.get("status") != "built" or not build.get("outputs"):
            raise ValueError("动画构建记录不是 built 或没有当前输出")
        shared = {"animations/index.html", "animations/animation.css"}
        outputs = set()
        for output in build["outputs"]:
            asset = output["path"]
            if (not re.fullmatch(r"animations/assets/[A-Za-z0-9_.-]+\.(js|css)", asset)
                    or asset in outputs):
                raise ValueError("动画当前输出重复或路径错误：%s" % asset)
            if animation_record(asset) != {key: output[key] for key in ("sha256", "bytes")}:
                raise ValueError("动画构建输出 sha256/bytes 不符：%s" % asset)
            outputs.add(asset)
        shared.update(outputs)
        root = os.path.join(REPO, "animations")
        names = {name for name in os.listdir(root)
                 if os.path.isfile(os.path.join(root, name, "timeline.json"))}
        if set(packages) != names:
            bad("动画包与当前时间轴目录不一致：清单=%s，实际=%s"
                % (sorted(packages), sorted(names)))
        for name in sorted(names):
            if not re.fullmatch(r"[a-z][a-z0-9-]*", name):
                raise ValueError("动画目录名错误：%s" % name)
            if name not in packages:
                continue
            prefix = "animations/%s/" % name
            with open(animation_path(prefix + "timeline.json"), encoding="utf-8") as source:
                timeline = json.load(source)
            core = shared | {prefix + fn for fn in ("index.html", "poster.svg", "timeline.json")}
            if not core.issubset(set(data.get("shell", []))):
                bad("%s 的动画 core 未完整进入 shell" % name)
            audio, clip_ids = set(), set()
            ready = timeline.get("status") == "ready"
            expected_count = 20  # Existing draft inventory contract; ready count comes from audio source.
            if ready:
                manifest_asset = prefix + "audio-manifest.json"
                if animation_record(manifest_asset)["sha256"] != timeline.get("audioManifestSha256"):
                    raise ValueError("%s 时间轴绑定的音频清单 hash 不符" % name)
                with open(animation_path(manifest_asset), encoding="utf-8") as source:
                    narration = json.load(source)
                tracks = narration["tracks"]
                expected_count = len(tracks)
                if not expected_count or narration.get("trackCount") != expected_count:
                    raise ValueError("%s 音频源 trackCount 不符或为空" % name)
                languages = timeline["languages"]
                if set(languages) != {"zh", "en"}:
                    raise ValueError("%s 缺双语时间轴" % name)
                for lang, language in languages.items():
                    if language.get("status") != "ready" or not language["clips"]:
                        raise ValueError("%s 的 %s 时间轴未就绪" % (name, lang))
                    for clip in language["clips"]:
                        identity, digest = clip["id"], clip["audioSha256"]
                        if (not re.fullmatch(r"[a-z][a-z0-9-]*", identity)
                                or not identity.endswith("-" + lang) or identity in clip_ids
                                or not re.fullmatch(r"[a-f0-9]{64}", digest)):
                            raise ValueError("%s 旁白标识/hash 错误或重复" % name)
                        expected_url = "audio/%s.mp3?v=%s" % (identity, digest[:12])
                        if clip["audioUrl"] != expected_url:
                            raise ValueError("%s 的音频 URL 必须使用精确 hash ?v：%s" % (name, identity))
                        asset = prefix + expected_url
                        record = {"sha256": digest, "bytes": clip["audioBytes"]}
                        track = tracks[identity]
                        if (track["file"] != expected_url or track.get("lang") != lang
                                or {key: track[key] for key in record} != record
                                or animation_record(asset) != record):
                            raise ValueError("%s 音频源/时间轴/实际 sha256/bytes 不一致：%s" % (name, identity))
                        clip_ids.add(identity)
                        audio.add(asset)
                if clip_ids != set(tracks):
                    raise ValueError("%s 时间轴遗漏音频源条目" % name)
            expected_files = sorted(core | audio)
            package = packages[name]
            if package["files"] != expected_files:
                bad("%s 动画离线包 files 不等于精确运行时 URL 清单" % name)
            records = {asset: animation_record(asset) for asset in expected_files}
            if package["hashes"] != records:
                bad("%s 动画离线包 hashes 的 URL/sha256/bytes 不符" % name)
            if package["bytes"] != sum(record["bytes"] for record in records.values()):
                bad("%s 动画包 bytes 与实际资源不符" % name)
            if (package.get("audioCount") != len(audio)
                    or package.get("audioExpected") != expected_count
                    or package.get("complete") != (ready and len(audio) == expected_count)):
                bad("%s 动画音频数量或 complete 状态不一致" % name)
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as error:
        bad("动画资源独立校验失败：%s" % error)
    if len(fails) == before:
        ok()


def check_retired_animations(data):
    """Exact retirement; independent from inventory generation and never book/lab paths."""
    before = len(fails)
    try:
        claimed = data.get('retiredAnimations', {})
        source_path = os.path.join(REPO, 'animations', 'retired.json')
        actual = {}
        if os.path.isfile(source_path):
            with open(source_path, encoding='utf-8') as source:
                source_data = json.load(source)
            if source_data.get('schemaVersion') != 1:
                raise ValueError('Unknown retirement schema')
            actual = source_data['packages']
            if 'animations/retired.json' not in data['shell']:
                raise ValueError('Retirement table missing from shell fingerprint')
        if claimed != actual:
            raise ValueError('Retirement metadata differs from source')
        if not actual:
            return
        if set(actual) != {'ropeway-station'}:
            raise ValueError('Unauthorized retired package')
        entry = actual['ropeway-station']
        chunks = ('3AGAZSBS', '3RCJKJ7V', '6SS2SWBD', 'AJAB2MCZ', 'AXU7UK7E', 'CKWC7AL6', 'NMPKCTGW', 'SWCMYQ53', 'TKTVXRVG')
        cues = ('accelerate', 'board', 'check', 'couple', 'decelerate', 'detach', 'loop', 'question', 'recap', 'support')
        expected = {'animations/assets/player-' + x + '.js' for x in chunks}
        expected.add('animations/build-manifest.json')
        expected.update('animations/ropeway-station/' + x for x in ('index.html', 'poster.svg', 'timeline.json', 'script.json', 'runtime-story.json', 'narration-lock.json', 'audio-manifest.json'))
        expected.update('animations/ropeway-station/audio/ropeway-station-' + cue + '-' + lang + '.mp3' for cue in cues for lang in ('zh', 'en'))
        if entry.get('state') != 'retired' or entry.get('paths') != sorted(expected):
            raise ValueError('Retired paths differ from exact 37-file authorization')
        current = set(data['shell'])
        for group in ('books', 'labs', 'animations'):
            for package in data.get(group, {}).values():
                current.update(package.get('files', []))
        if any(x.split('?')[0] in expected for x in current):
            raise ValueError('Retired path re-entered runtime inventory')
        for rel in expected:
            if os.path.exists(animation_path(rel)):
                raise ValueError('Retired runtime file still exists: ' + rel)
        for page in ('animations/index.html', 'animations/ropeway-adventure/index.html'):
            if os.path.isfile(rel_path(page)):
                with open(rel_path(page), encoding='utf-8') as source:
                    if re.search(r'(?:href|src)=[\"\'][^\"\']*ropeway-station/', source.read()):
                        raise ValueError('Retired short still linked: ' + page)
    except (OSError, KeyError, ValueError, TypeError) as error:
        bad('Retirement independent validation: ' + str(error))
    if len(fails) == before:
        ok()


def check_films(data):
    """Independent native-film contract; never derive it from the generator."""
    before = len(fails)
    try:
        root = os.path.join(REPO, 'animations')
        names = {name for name in os.listdir(root)
                 if os.path.isfile(os.path.join(root, name, 'film.json'))} if os.path.isdir(root) else set()
        films = data.get('films', {})
        if set(films) != names:
            raise ValueError('Native film inventory differs from actual directories')
        for name in names:
            prefix = 'animations/' + name + '/'
            with open(animation_path(prefix + 'film.json'), encoding='utf-8') as source:
                film = json.load(source)
            expected_core = [prefix + x for x in ('index.html', 'player.css', 'player.js', 'film.json', 'cover-v5.jpg', 'bilingual-v5.srt')]
            entry = films[name]
            if (entry['core'] != expected_core or entry['media'] != film['media']
                    or entry['kind'] != 'native-bilingual-film'
                    or entry['offlineMode'] != 'explicit-standalone-download'
                    or entry['offline'] != film['offline']):
                raise ValueError('Native film shell/media contract differs: ' + name)
            if not set(expected_core).issubset(set(data['shell'])):
                raise ValueError('Missing native film small shell: ' + name)
            for item in film['media'].values():
                url = prefix + item['url']
                if not url.endswith('?v=' + item['sha256'][:12]):
                    raise ValueError('Film media must use exact hash query: ' + url)
                if animation_record(url) != {k: item[k] for k in ('sha256', 'bytes')}:
                    raise ValueError('Film media bytes differ: ' + url)
            offline = film['offline']
            if (offline['identity'] not in ('project-adapted-offline-v2', 'project-adapted-offline-v3')
                    or offline['original']['identity'] != 'original-source-v5-unaltered'
                    or offline['file'] == offline['original']['file']):
                raise ValueError('Recommended offline player must distinguish project adaptation and original archive')
            for item in (offline, offline['original']):
                if not item['file'].startswith('downloads/') or '?' in item['file']:
                    raise ValueError('Offline download must use a separate literal path')
                if animation_record(prefix + item['file']) != {k: item[k] for k in ('sha256', 'bytes')}:
                    raise ValueError('Offline player bytes differ: ' + item['file'])
            with open(animation_path(prefix + 'index.html'), encoding='utf-8') as source:
                page = source.read()
            if 'class="download" href="' + offline['file'] + '"' not in page:
                raise ValueError('Recommended offline player link differs from manifest')
            if any('/media/' in x or '/downloads/' in x or x.endswith(('.mp4', '.m4a', '.zip'))
                   for x in data['shell'] if x.startswith(prefix)):
                raise ValueError('Large native film assets entered default precache')
            if any(x.startswith('video-production/') for x in data['shell']):
                raise ValueError('Production source package entered default precache')
    except (OSError, KeyError, ValueError, TypeError) as error:
        bad('Native film independent validation: ' + str(error))
    if len(fails) == before:
        ok()


# ---------- 1. manifest ----------
def check_manifest():
    path = os.path.join(REPO, "manifest.webmanifest")
    if not os.path.exists(path):
        return bad("manifest.webmanifest 不存在")
    try:
        m = json.load(open(path, encoding="utf-8"))
    except Exception as e:
        return bad("manifest.webmanifest 不是合法 JSON：%s" % e)
    for k in ("name", "short_name", "start_url", "scope", "display", "icons"):
        if k not in m:
            bad("manifest 缺少字段 %s" % k)
    if m.get("display") not in ("standalone", "fullscreen", "minimal-ui"):
        bad("manifest display=%r 不是可安装的取值" % m.get("display"))
    if not m.get("start_url", "").startswith("./"):
        warn("manifest start_url 建议用相对路径（./index.html），子路径部署更稳")
    has_any = has_maskable = False
    for ic in m.get("icons", []):
        src = ic.get("src", "")
        if not os.path.exists(rel_path(src)):
            bad("manifest 图标缺失：%s" % src)
            continue
        size = png_size(rel_path(src))
        want = ic.get("sizes", "")
        if size:
            got = "%dx%d" % size
            if want and got != want:
                bad("图标 %s 实际 %s，manifest 声明 %s" % (src, got, want))
        purpose = ic.get("purpose", "any")
        has_any = has_any or "any" in purpose
        has_maskable = has_maskable or "maskable" in purpose
    if not has_any:
        bad("manifest 里没有 purpose=any 的图标")
    if not has_maskable:
        warn("缺少 maskable 图标，安卓主屏图标会被裁得很难看")
    ok()


# ---------- 2. 离线包清单 ----------
def check_assets():
    path = os.path.join(REPO, "pwa-assets.js")
    if not os.path.exists(path):
        return bad("pwa-assets.js 不存在（先跑 python tools/gen_pwa_assets.py）")
    with open(path, encoding="utf-8") as source:
        src = source.read()
    try:
        data = json.loads(src[src.index("{"): src.rindex(";")])
    except Exception as e:
        return bad("pwa-assets.js 内容无法解析：%s" % e)

    check_animations(data)
    check_films(data)
    check_retired_animations(data)
    try:
        fresh_version = expected_asset_version(data)
    except (OSError, KeyError, TypeError, ValueError, AttributeError) as e:
        return bad("无法只读重算 pwa-assets.js 内容指纹：%s" % e)
    if data.get("version") != fresh_version:
        bad("pwa-assets.js 内容指纹已过期：记录 %s，当前应为 %s（运行 python tools/gen_pwa_assets.py）"
            % (data.get("version"), fresh_version))

    with open(os.path.join(REPO, "shared", "reader.js"), encoding="utf-8") as source:
        reader = source.read()
    m = re.search(r"const\s+AUDIO_VER\s*=\s*(\d+)", reader)
    if not m:
        return bad("reader.js 里找不到 AUDIO_VER")
    audio_ver = m.group(1)
    if data.get("audioVer") != audio_ver:
        bad("pwa-assets.js 的 audioVer=%s 与 reader.js 的 AUDIO_VER=%s 不一致（清单过期，重新生成）"
            % (data.get("audioVer"), audio_ver))

    missing = [p for p in data.get("shell", []) if not os.path.exists(rel_path(p))]
    if missing:
        bad("外壳清单里有 %d 个文件不存在：%s" % (len(missing), ", ".join(missing[:5])))
    if "offline.html" not in data.get("shell", []):
        bad("offline.html 不在外壳清单里，断网会白屏")

    total = 0
    for bid, book in data.get("books", {}).items():
        book_audio_ver = audio_ver
        custom_reader = os.path.join(REPO, "books", bid, bid + ".js")
        experience = os.path.join(REPO, "books", bid, bid + "-experience.js")
        entry = os.path.join(REPO, "books", bid, "index.html")
        if os.path.isfile(experience) and os.path.isfile(entry):
            with open(entry, encoding="utf-8") as source:
                if bid + "-experience.js" in source.read():
                    custom_reader = experience
        if os.path.isfile(custom_reader):
            with open(custom_reader, encoding="utf-8") as source:
                custom_version = re.search(r"const\s+AUDIO_VER\s*=\s*(\d+)", source.read())
            if custom_version:
                book_audio_ver = custom_version.group(1)
        story = story_resources(REPO, bid)
        if story is not None:
            book_audio_ver = story['audioVersion']
        for f in book["files"]:
            if not os.path.exists(rel_path(f)):
                bad("%s 的离线清单引用了不存在的文件：%s" % (bid, f))
            if f.split("?")[0].endswith(".mp3") and not f.endswith("?v=" + book_audio_ver):
                bad("%s 的音频没带 ?v=%s：%s（离线播放会 cache miss）" % (bid, book_audio_ver, f))
        total += book["bytes"]
        if book["bytes"] <= 0:
            bad("%s 的离线包体积为 0，明显不对" % bid)

    try:
        actual_total = expected_asset_total(data)
        if data.get("animations"):
            if actual_total != data.get("total"):
                bad("包含动画的 total 字段与去重实际体积不符：记录 %s，实际 %s"
                    % (data.get("total"), actual_total))
        elif abs(actual_total - data.get("total", 0)) > 1024:
            warn("total 字段与实际体积对不上（可能是清单过期）")
    except (OSError, KeyError, TypeError) as error:
        bad("无法重算离线资源预算：%s" % error)
    for bid, book in data.get("books", {}).items():
        ratio = book["bytes"] / max(1, len(book["files"]))
        if ratio > 900 * 1024:
            warn("%s 平均单文件 %.1f MB，离线包可能夹带了不该收的大文件" % (bid, ratio / 1048576))
    ok()


# ---------- 3. Service Worker 约定 ----------
def check_sw():
    path = os.path.join(REPO, "sw.js")
    if not os.path.exists(path):
        return bad("sw.js 不存在")
    src = open(path, encoding="utf-8").read()
    manifest_source = open(os.path.join(REPO, 'pwa-assets.js'), encoding='utf-8').read()
    manifest_version = re.search(r'"version":"([a-f0-9]+)"', manifest_source)
    if not manifest_version or "importScripts('./pwa-assets.js?v=%s');" % manifest_version.group(1) not in src:
        bad("sw.js 的离线清单版本未同步（运行 python tools/gen_pwa_assets.py）")
    if "'kb-asset-v1'" not in src and '"kb-asset-v1"' not in src:
        bad("离线包缓存不是固定名（kb-asset-v1）—— 一旦跟版本走，家长下载的绘本会被改版清空")
    if "status === 200" not in src:
        bad("sw.js 没有对 200 做判断：206 分片响应不能存进 Cache Storage")
    if "clients.claim()" not in src:
        warn("sw.js 没有 clients.claim()，首次访问的页面要刷新一次才受控")
    if "opaque" not in src:
        warn("sw.js 没有排除不透明响应，跨域资源会虚高配额统计")
    ok()


# ---------- 4. 页面接线 ----------
def check_pages():
    sys.path.insert(0, os.path.join(REPO, "tools"))
    import wire_pwa_pages as wire  # noqa: E402
    unwired = []
    for p in wire.pages():
        rel, _new, changed, notes = wire.wire(p)
        if changed:
            unwired.append("%s (%s)" % (rel, ", ".join(notes)))
    if unwired:
        bad("这些页面还没接上 PWA（跑 python tools/wire_pwa_pages.py）：%s" % "; ".join(unwired))
    else:
        ok()


# ---------- 5. 旧 CDN 常量 ----------
def check_no_legacy():
    src = open(os.path.join(REPO, "shared", "reader.js"), encoding="utf-8").read()
    for token in ("CDN_BASE", "fallbackUrl"):
        if re.search(r"\b%s\b" % token, src):
            bad("reader.js 里还有旧的 %s 残留" % token)
    cdn = open(os.path.join(REPO, "shared", "cdn.js"), encoding="utf-8").read()
    if "cdn.jsdelivr.net" not in cdn:
        warn("cdn.js 的节点列表里没有 cdn.jsdelivr.net 兜底")
    if "gcore.jsdelivr.net" not in cdn:
        bad("cdn.js 首选节点不是实测可用的 gcore")
    ok()


# ---------- 6. 书架封面派生图 ----------
def check_covers():
    """首页封面必须是 _card480 派生图、自带同源 src、且在外壳预缓存里。

    这条为什么值得单独校验：一旦首页退回引用 1216×832 原图，断网打开书架
    就会「只有已下载那本有封面，其余 11 张空白」，同时首屏白白多传约 2.5MB；
    而同源 src 一旦被改回「只写 data-kbc 等运行时补地址」，封面就会退回到
    由 cdn.js 决定去向，离线时只能指望浏览器磁盘缓存的残留。
    两种退化在线时都看不出任何异常，所以必须在这里卡住。
    """
    shell = set()
    ap = os.path.join(REPO, "pwa-assets.js")
    if os.path.exists(ap):
        s = open(ap, encoding="utf-8").read()
        try:
            shell = set(json.loads(s[s.index("{"): s.rindex(";")]).get("shell", []))
        except Exception:
            shell = set()

    for bid, cover, card in _covers():
        card_abs = rel_path("books/%s/%s" % (bid, card))
        cover_abs = rel_path("books/%s/%s" % (bid, cover))
        if not os.path.exists(card_abs):
            bad("封面派生图不存在：books/%s/%s（跑 python tools/gen_pwa_covers.py）"
                % (bid, card))
            continue
        if os.path.exists(cover_abs):
            c, o = os.path.getsize(card_abs), os.path.getsize(cover_abs)
            if c >= o * 0.6:
                bad("封面派生图 %s 没起到瘦身作用（%.0fKB vs 原图 %.0fKB）"
                    % (card, c / 1024, o / 1024))

    home = open(os.path.join(REPO, "index.html"), encoding="utf-8").read()
    # 封面必须自带同源 src（而不是只写 data-kbc 等 cdn.js 在运行时补地址）。
    # 原因：cdn.js 的「离线走同源」分支依赖 navigator.onLine，而它取自系统网卡
    # 状态，真断网时经常仍是 true（实测确认），于是补出来的仍是 CDN 地址，
    # 离线只能靠浏览器磁盘缓存的残留 —— 换个滚动位置就空白。
    # 这 12 张在外壳预缓存里，直接同源取才是确定的。
    covers = re.findall(r'<img class="cover"[^>]*\ssrc="(books/[^"]+)"', home)
    expected_covers = {"books/%s/%s" % (bid, card) for bid, _cover, card in _covers()}
    if len(covers) != len(expected_covers) or set(covers) != expected_covers:
        bad("首页同源封面与实际书目不一致：实际 %d，期望 %d" % (len(covers), len(expected_covers)))
    not_card = [c for c in covers if not c.endswith("_card480.webp")]
    if not_card:
        bad("首页封面没走小派生图（断网会空白 + 多传原图）：%s" % ", ".join(not_card[:3]))
    for c in covers:
        if not os.path.exists(rel_path(c)):
            bad("首页封面指向不存在的文件：%s" % c)
        if c and c not in shell:
            bad("首页封面没进外壳预缓存，断网会空白：%s" % c)
    ok()


def _covers():
    """复用 gen_pwa_covers 的发现逻辑，避免两处口径不一致。"""
    sys.path.insert(0, os.path.join(REPO, "tools"))
    import gen_pwa_covers as covers  # noqa: E402
    return covers.discover()


def main():
    check_manifest()
    check_assets()
    check_sw()
    check_pages()
    check_no_legacy()
    check_covers()

    for w in warns:
        print("WARN  " + w)
    for f in fails:
        print("FAIL  " + f)
    print("\n通过 %d 项检查，%d 个警告，%d 个失败" % (checks, len(warns), len(fails)))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
