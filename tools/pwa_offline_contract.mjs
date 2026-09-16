export function selectOfflineAudio(manifest, bookId) {
  const files = manifest?.books?.[bookId]?.files;
  if (!Array.isArray(files)) {
    throw new Error(`PWA manifest does not contain book: ${bookId}`);
  }

  const bookPrefix = `books/${bookId}/`;
  const audioPrefix = `${bookPrefix}audio/`;
  const audio = files.find((file) =>
    file.startsWith(audioPrefix) && /\/page_01_en\.mp3(?:\?|$)/.test(file));

  if (!audio) {
    throw new Error(`PWA manifest does not contain page 1 English audio for: ${bookId}`);
  }

  return audio.slice(bookPrefix.length);
}
