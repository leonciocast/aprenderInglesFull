import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'Audio', 'Ordinal_numbers');

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    }
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    const filePath = path.join(AUDIO_DIR, `${name}.wav`);
    const audio = await fs.readFile(filePath);

    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    const message = err?.code === 'ENOENT' ? 'Audio not found' : 'Failed to read audio';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
