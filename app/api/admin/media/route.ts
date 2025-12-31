import { NextRequest, NextResponse } from 'next/server';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

export const runtime = 'nodejs';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const sts = new STSClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function isAuthorized(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  return password && password === process.env.ADMIN_UPLOAD_PASSWORD;
}

function pickExtensions(type: string) {
  if (type === 'image') {
    return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
  }
  return ['.mp4', '.mov', '.m4v', '.webm'];
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = (req.nextUrl.searchParams.get('type') || 'video').toLowerCase();
    const isImage = type === 'image';
    const rawBucket = isImage
      ? process.env.COURSE_IMAGE_BUCKET ||
        process.env.S3_BUCKET ||
        process.env.COURSE_MEDIA_BUCKET ||
        ''
      : process.env.COURSE_VIDEO_BUCKET ||
        process.env.COURSE_MEDIA_BUCKET ||
        process.env.S3_BUCKET ||
        '';
    const rawBaseUrl = isImage
      ? process.env.COURSE_IMAGE_BASE_URL ||
        process.env.CLOUDFRONT_BASE_URL ||
        process.env.COURSE_MEDIA_BASE_URL ||
        ''
      : process.env.COURSE_VIDEO_BASE_URL ||
        process.env.COURSE_MEDIA_BASE_URL ||
        process.env.CLOUDFRONT_BASE_URL ||
        '';
    const bucket = rawBucket.trim().replace(/^['"]|['"]$/g, '').toLowerCase();
    const baseUrl = rawBaseUrl.trim().replace(/^['"]|['"]$/g, '');
    if (!bucket || !baseUrl) {
      return NextResponse.json(
        {
          error:
            'Missing COURSE_IMAGE_BUCKET/COURSE_VIDEO_BUCKET (or COURSE_MEDIA_BUCKET/S3_BUCKET fallbacks) and base URLs',
        },
        { status: 500 },
      );
    }
    if (!/^[a-z0-9.-]{3,63}$/.test(bucket)) {
      return NextResponse.json(
        { error: 'Invalid COURSE_MEDIA_BUCKET. It must be a lowercase S3 bucket name.' },
        { status: 400 },
      );
    }

    const rawPrefix = req.nextUrl.searchParams.get('prefix') || '';
    const prefix = rawPrefix.trim().replace(/^\/+/, '');
    const allowed = pickExtensions(type);
    const debug = req.nextUrl.searchParams.get('debug') === '1';

    let items: string[] = [];
    let keys: string[] = [];
    let prefixes: string[] = [];
    try {
      const res = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix || undefined,
        }),
      );
      keys = (res.Contents || []).map(obj => obj.Key || '').filter(Boolean);
      items = keys
        .filter(key => allowed.some(ext => key.toLowerCase().endsWith(ext)))
        .map(key => `${baseUrl.replace(/\/$/, '')}/${key}`);
      prefixes = Array.from(
        new Set(
          keys
            .filter(key => key.includes('/'))
            .map(key => key.split('/')[0] + '/'),
        ),
      ).sort();
    } catch (err: any) {
      console.error('Media list error:', err);
      return NextResponse.json(
        {
          error: err?.message || String(err),
          name: err?.name,
          bucket,
          prefix,
        },
        { status: 500 },
      );
    }

    if (debug) {
      let identity: { account?: string; arn?: string; userId?: string } = {};
      try {
        const idRes = await sts.send(new GetCallerIdentityCommand({}));
        identity = {
          account: idRes.Account,
          arn: idRes.Arn,
          userId: idRes.UserId,
        };
      } catch (err: any) {
        identity = { arn: `Error: ${err?.message || String(err)}` };
      }
      return NextResponse.json({ items, keys, prefixes, bucket, prefix, type, identity });
    }
    return NextResponse.json({ items, prefixes });
  } catch (err: any) {
    console.error('Media list error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
