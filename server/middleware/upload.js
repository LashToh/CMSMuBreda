import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { fail } from '../utils/response.js';
import { detectImageType } from '../utils/imageSignature.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOADS_ROOT = path.resolve(__dirname, '../data/uploads');
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 4 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      const err = new Error('Only PNG, JPG, WEBP or GIF images are allowed.');
      err.code = 'BAD_IMAGE_TYPE';
      return cb(err);
    }
    return cb(null, true);
  },
});

/** multer wrapper that answers with the API error format. Field name: "file". */
export function imageUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return fail(res, 413, 'FILE_TOO_LARGE', 'Image too large (max 5 MB).');
    }
    return fail(res, 400, 'UPLOAD_ERROR', err.message || 'Upload failed.');
  });
}

/** Validates the real signature, stores the file with a random name, returns { name, url, bytes, mime }. */
export function saveUploadedImage(file) {
  if (!file?.buffer) return { error: 'No file received (field "file").' };
  const type = detectImageType(file.buffer);
  if (!type || type.mime !== file.mimetype) {
    return { error: 'The file is not a valid PNG, JPG, WEBP or GIF image.' };
  }
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
  const name = `${crypto.randomUUID()}.${type.ext}`;
  fs.writeFileSync(path.join(UPLOADS_ROOT, name), file.buffer, { flag: 'wx' });
  return { name, url: `/uploads/${name}`, bytes: file.buffer.length, mime: type.mime };
}
