import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Make sure we run on Node, not edge
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Simple admin protection
    const password = req.headers.get('x-admin-password');
    if (!password || password !== process.env.ADMIN_UPLOAD_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploaded: { originalName: string; finalName: string; url: string }[] = [];

    for (const file of files) {
      const origName = file.name;

      // 1) default: replace spaces with underscores
      let baseName = origName.replace(/\s+/g, '_');

      // 2) keep only safe chars
      baseName = baseName.replace(/[^A-Za-z0-9_.-]/g, '');

      // 3) ensure it ends with .pdf
      if (!baseName.toLowerCase().endsWith('.pdf')) {
        baseName = baseName + '.pdf';
      }

      const arrayBuffer = await file.arrayBuffer();
      const body = Buffer.from(arrayBuffer);

      const key = baseName;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
          Body: body,
          ContentType: 'application/pdf',
          // ❗ If your bucket uses CloudFront Origin Access (OAI/OAC),
          // you do NOT need ACL: 'public-read'. We’ll omit it.
        }),
      );

      const url = `${process.env.CLOUDFRONT_BASE_URL}/${key}`;
      uploaded.push({ originalName: origName, finalName: key, url });
    }

    return NextResponse.json({ uploaded });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
