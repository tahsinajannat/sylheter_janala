import sanitizeHtml from 'sanitize-html';

const articleOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img',
    'figure',
    'figcaption',
    'h1',
    'h2',
    'u',
    's',
    'mark',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    '*': ['dir', 'lang'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: 'noopener noreferrer nofollow', ...(attribs.target ? { target: '_blank' } : {}) },
    }),
  },
};

/** Sanitize editor HTML before storing (stops stored XSS). */
export const sanitizeArticle = (html) => sanitizeHtml(html, articleOptions);

/** Newsletter bodies: same rules as articles (no scripts, only http(s) links/images). */
export const sanitizeNewsletter = (html) => sanitizeHtml(html, articleOptions);

/** HTML -> plain text (for read-time estimates and email text parts). */
export const stripHtml = (html) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();

/** ~200 words per minute; Bangla is also space-separated so the same rule works. */
export function readMinutes(html) {
  const words = stripHtml(html).split(' ').filter(Boolean).length;
  return Math.min(60, Math.max(1, Math.ceil(words / 200)));
}
