const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Extract the 11-char video id from any common YouTube URL form, or null. */
export function parseYoutubeId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www|m|music)\./, '');
    let id = null;
    if (host === 'youtu.be') {
      id = u.pathname.slice(1).split('/')[0];
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else id = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] ?? null;
    }
    return id && ID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const youtubeThumbnail = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
export const youtubeEmbed = (id) => `https://www.youtube-nocookie.com/embed/${id}`;
