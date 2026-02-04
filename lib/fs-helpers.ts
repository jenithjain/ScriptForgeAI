import fs from 'node:fs';
import path from 'node:path';

export const TMP_DIR = path.join(process.cwd(), 'tmp', 'campaign-images');

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
