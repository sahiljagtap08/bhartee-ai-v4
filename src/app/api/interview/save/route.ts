import { NextResponse } from 'next/server';
import { S3 } from 'aws-sdk';
import { saveTranscript } from '@/lib/supabase';

const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export async function POST(request: Request) {
  try {
    const { candidateId, transcript, videoBlob } = await request.json();

    // Save transcript to Supabase
    await saveTranscript(candidateId, transcript);

    // Upload video to S3
    if (videoBlob) {
      const videoKey = `interviews/${candidateId}/recording.webm`;
      await s3.putObject({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: videoKey,
        Body: videoBlob,
        ContentType: 'video/webm'
      }).promise();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save interview data:', error);
    return NextResponse.json(
      { error: 'Failed to save interview data' },
      { status: 500 }
    );
  }
}
