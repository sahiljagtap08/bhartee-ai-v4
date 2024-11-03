// File: src/app/api/interview/question/route.ts
import { NextResponse } from 'next/server';
import { generateInterviewQuestion } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { type, previousQuestions } = await request.json();
    const question = await generateInterviewQuestion(type, previousQuestions);
    
    return NextResponse.json({ question });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    );
  }
}
