import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, type GetObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const runtime = 'nodejs';

function buildLessonFileCandidates(raw: string) {
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep original if it's not valid URI encoding.
  }
  const cleaned = decoded.replace(/[^\p{L}\p{M}\p{N} ._-]/gu, '');
  if (!cleaned || !cleaned.toLowerCase().endsWith('.pdf')) {
    throw new Error('Invalid lesson file. It must be a .pdf filename.');
  }
  const candidates = new Set<string>([cleaned]);
  try {
    candidates.add(cleaned.normalize('NFC'));
    candidates.add(cleaned.normalize('NFD'));
  } catch {
    // If normalization fails, just keep the cleaned value.
  }
  return [...candidates];
}

function isMissingKey(err: any) {
  if (!err) return false;
  if (err?.name === 'NoSuchKey') return true;
  const status = err?.$metadata?.httpStatusCode;
  return status === 404;
}

function toAsciiFilename(value: string) {
  const normalized = value.normalize('NFKD');
  const ascii = normalized.replace(/[^\x20-\x7E]/g, '');
  return ascii || 'download.pdf';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileParam = searchParams.get('file') || '';
    const keys = buildLessonFileCandidates(fileParam);

    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      return NextResponse.json({ error: 'Missing S3_BUCKET' }, { status: 500 });
    }

    let result: GetObjectCommandOutput | null = null;
    let resolvedKey = keys[0];

    for (const candidate of keys) {
      try {
        result = await s3.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: candidate,
          }),
        );
        resolvedKey = candidate;
        break;
      } catch (err: any) {
        if (isMissingKey(err)) continue;
        throw err;
      }
    }

    if (!result?.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const bodyStream = Readable.toWeb(result.Body as Readable) as unknown as ReadableStream<Uint8Array>;

    const asciiFilename = toAsciiFilename(resolvedKey);
    const utf8Filename = encodeURIComponent(resolvedKey);

    return new NextResponse(bodyStream, {
      headers: {
        'Content-Type': result.ContentType || 'application/pdf',
        'Content-Disposition': `inline; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`,
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
