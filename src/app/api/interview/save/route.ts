// File: src/app/api/interview/save/route.ts
import { NextResponse } from 'next/server';
import { saveTranscript } from '@/lib/supabase';
import { S3 } from 'aws-sdk';

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

export async function POST(request: Request) {
  try {
    const { candidateId, transcript, videoBlob } = await request.json();
    
    // Save transcript to Supabase
    await saveTranscript(candidateId, transcript);
    
    // Upload video to S3
    const videoKey = `interviews/${candidateId}/recording.webm`;
    await s3.putObject({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: videoKey,
      Body: videoBlob,
      ContentType: 'video/webm'
    }).promise();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save interview data' },
      { status: 500 }
    );
  }
}