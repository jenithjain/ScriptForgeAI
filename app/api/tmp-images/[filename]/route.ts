import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { TMP_DIR } from '@/lib/fs-helpers';

// In Next.js 16 / React 19 the route context params may be a Promise.
export async function GET(_req: Request, context: { params: Promise<{ filename: string }> | { filename: string } }) {
  const resolved = 'then' in context.params ? await context.params : context.params;
  const { filename } = resolved;
  try {
    const fullPath = path.join(TMP_DIR, filename);
    if (!fs.existsSync(fullPath)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const file = fs.readFileSync(fullPath);
    // Infer content type by extension
    const ext = path.extname(filename).toLowerCase();
    const type = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': type,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read image' }, { status: 500 });
  }
}
