import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export const runtime = 'nodejs';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.COURSE_VIDEO_BUCKET || process.env.S3_BUCKET || 'aprenderinglesfull-pdfs';
const KEY = 'Pronombres_1.mp4';

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  try {
    const range = req.headers.get('range') || req.headers.get('Range') || undefined;
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: KEY,
        Range: range,
      }),
    );

    if (!res.Body) {
      return NextResponse.json({ error: 'Missing video body' }, { status: 500 });
    }

    const bodyStream = Readable.toWeb(res.Body as Readable) as unknown as ReadableStream;
    const headers = new Headers();
    headers.set('Content-Type', res.ContentType || 'video/mp4');
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Accept-Ranges', 'bytes');
    if (res.ContentLength) {
      headers.set('Content-Length', String(res.ContentLength));
    }
    if (res.ContentRange) {
      headers.set('Content-Range', res.ContentRange);
    }

    const status = range ? 206 : 200;
    return new NextResponse(bodyStream, { status, headers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
