import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const runtime = 'nodejs';

function normalizeLessonFile(raw: string) {
  const cleaned = raw.replace(/[^A-Za-z0-9_.-]/g, '');
  if (!cleaned || !cleaned.toLowerCase().endsWith('.pdf')) {
    throw new Error('Invalid lesson file. It must be a .pdf filename.');
  }
  return cleaned;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileParam = searchParams.get('file') || '';
    const key = normalizeLessonFile(fileParam);

    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      return NextResponse.json({ error: 'Missing S3_BUCKET' }, { status: 500 });
    }

    const result = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    if (!result.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const bodyStream = Readable.toWeb(result.Body as Readable) as unknown as ReadableStream<Uint8Array>;

    return new NextResponse(bodyStream, {
      headers: {
        'Content-Type': result.ContentType || 'application/pdf',
        'Content-Disposition': `inline; filename="${key}"`,
        ...(result.ContentLength
          ? { 'Content-Length': String(result.ContentLength) }
          : {}),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err: any) {
    const message = err?.message || String(err);
    const status = message.includes('Invalid lesson file') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
