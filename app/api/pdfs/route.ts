import { NextRequest, NextResponse } from 'next/server';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const runtime = 'nodejs';

type PdfItem = {
  key: string;
  size?: number;
  lastModified?: string;
};

export async function GET(req: NextRequest) {
  try {
    const password = req.headers.get('x-admin-password');
    if (!password || password !== process.env.EMAILS_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      return NextResponse.json({ error: 'Missing S3_BUCKET' }, { status: 500 });
    }

    const items: PdfItem[] = [];
    let continuationToken: string | undefined;

    do {
      const res = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken,
        }),
      );

      const contents = res.Contents || [];
      contents.forEach(item => {
        if (!item.Key || !item.Key.toLowerCase().endsWith('.pdf')) {
          return;
        }
        items.push({
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified ? item.LastModified.toISOString() : undefined,
        });
      });

      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);

    items.sort((a, b) => {
      if (!a.lastModified || !b.lastModified) return 0;
      return a.lastModified < b.lastModified ? 1 : -1;
    });

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error('PDF list error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
