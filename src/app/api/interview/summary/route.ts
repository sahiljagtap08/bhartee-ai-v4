// src/app/api/interview/summary/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert interviewer. Create a concise summary of the interview, highlighting key points discussed, candidate's strengths, and areas for improvement. Be constructive and professional."
        },
        {
          role: "user",
          content: `Please summarize this interview transcript: ${JSON.stringify(messages)}`
        }
      ]
    });

    const summary = completion.choices[0]?.message?.content || "Unable to generate summary.";
    
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}