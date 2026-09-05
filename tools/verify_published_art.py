"""Read-only delivery check: verify live Pages references and CDN bytes, no downloads saved."""
import hashlib, json, pathlib, sys, subprocess
from concurrent.futures import ThreadPoolExecutor
root=pathlib.Path(__file__).resolve().parents[1]
books=sys.argv[1:]
manifest=json.loads((root/'art/regeneration-manifest.json').read_text(encoding='utf-8'))
def get(url):
    return subprocess.run(['curl.exe','--fail','--silent','--show-error','--location','--retry','2','--max-time','60',url],check=True,capture_output=True).stdout
for book in books:
    live=get(f'https://cesar-c-c.github.io/kids-books/books/{book}/book.js').decode()
    for p in manifest:
        if p['book']==book:
            assert p['newAsset'] in live, (book,p['newAsset'],'old live reference')
def check(p):
    rel=f"books/{p['book']}/{p['newAsset']}"
    local=(root/rel).read_bytes()
    for base in ['https://cesar-c-c.github.io/kids-books/', 'https://cdn.jsdelivr.net/gh/Cesar-C-C/kids-books@main/']:
        remote=get(base+rel)
        assert hashlib.sha256(remote).digest()==hashlib.sha256(local).digest(), base+rel
    return rel
with ThreadPoolExecutor(max_workers=6) as pool:
    paths=list(pool.map(check,[p for p in manifest if p['book'] in books]))
print(f'LIVE PAGES + CDN PASS: {len(paths)} image hashes, books={books}')
