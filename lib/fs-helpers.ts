import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

export const TMP_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'scriptforge-campaign-images')
  : path.join(process.cwd(), 'tmp', 'campaign-images');

export function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
}

export function saveBase64Image(base64Data: string, filePrefix = 'image', ext = 'png') {
  ensureTmpDir();
  const filename = `${filePrefix}-${Date.now()}-${Math.floor(Math.random()*1e6)}.${ext}`;
  const fullPath = path.join(TMP_DIR, filename);

  // Base64 may include data URL prefix like: data:image/png;base64,
  const cleaned = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const buffer = Buffer.from(cleaned, 'base64');
  fs.writeFileSync(fullPath, buffer);

  return { filename, fullPath };
}
