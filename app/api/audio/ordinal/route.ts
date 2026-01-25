import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'Audio', 'Ordinal_numbers');
const normalizeName = (value: string) =>
  value
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

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

    let filePath = path.join(AUDIO_DIR, `${name}.wav`);
    let audio: Buffer | null = null;

    try {
      audio = await fs.readFile(filePath);
    } catch (err: any) {
      if (err?.code !== 'ENOENT') throw err;
      const normalizedTarget = normalizeName(name);
      const entries = await fs.readdir(AUDIO_DIR);
      const match = entries.find(entry => {
        const base = entry.replace(/\.wav$/i, '');
        return normalizeName(base) === normalizedTarget;
      });
      if (!match) {
        return NextResponse.json({ error: 'Audio not found' }, { status: 404 });
      }
      filePath = path.join(AUDIO_DIR, match);
      audio = await fs.readFile(filePath);
    }

    const body = new Uint8Array(audio);
    return new NextResponse(body, {
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
