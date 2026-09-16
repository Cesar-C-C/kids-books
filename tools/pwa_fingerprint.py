"""Cross-platform content fingerprints for generated PWA manifests."""

import hashlib
import os


TEXT_EXTENSIONS = {
    ".cjs",
    ".css",
    ".htm",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".py",
    ".svg",
    ".txt",
    ".webmanifest",
    ".xml",
}


def content_sha256(path):
    """Hash deployed content consistently across LF and CRLF checkouts."""
    digest = hashlib.sha256()
    if os.path.splitext(path)[1].lower() in TEXT_EXTENSIONS:
        with open(path, "rb") as source:
            digest.update(source.read().replace(b"\r\n", b"\n"))
        return digest.hexdigest()

    with open(path, "rb") as source:
        for chunk in iter(lambda: source.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()
