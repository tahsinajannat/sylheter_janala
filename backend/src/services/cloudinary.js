import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Strictly below 10 MB: the media.bytes CHECK constraint is `bytes < 10485760`.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 - 1;
export const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

function assertEnabled() {
  if (!env.cloudinaryEnabled) {
    throw new HttpError(503, 'Image uploads are not configured (set CLOUDINARY_* environment variables)');
  }
}

/** Upload an in-memory image buffer. Resolves with Cloudinary's upload result. */
export function uploadImage(buffer, { folder = 'sylheter-janala' } = {}) {
  assertEnabled();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', unique_filename: true, overwrite: false },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

export async function destroyImage(publicId) {
  if (!env.cloudinaryEnabled) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}
