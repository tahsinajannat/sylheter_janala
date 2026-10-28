/** An ad is live when it is switched on and now is inside its (optional) date window. */
export const LIVE = (a = 'a') => `${a}.is_active AND (${a}.starts_at IS NULL OR ${a}.starts_at <= now()) AND (${a}.ends_at IS NULL OR ${a}.ends_at > now())`;

/** A banner without its image has nothing to show, so it is never served. */
export const SERVABLE = (a = 'a') => `(${a}.kind = 'adsense' OR ${a}.image_id IS NOT NULL)`;

export const shapePublicAd = (r, adsenseClient = null) => ({
  id: r.id,
  kind: r.kind,
  placement: r.placement,
  imageUrl: r.image_url ?? null,
  imageWidth: r.image_width ?? null,
  imageHeight: r.image_height ?? null,
  linkUrl: r.link_url,
  alt: r.alt_text ?? r.name,
  adsenseSlot: r.adsense_slot,
  adsenseClient: r.kind === 'adsense' ? adsenseClient : null,
});
