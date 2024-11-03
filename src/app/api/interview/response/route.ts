// src/app/api/interview/response/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { INTERVIEWER_CONFIG } from '@/config/interviewer';
import { interviewPrompts } from '@/lib/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

type InterviewStage = 'introduction' | 'initial_assessment' | 'deep_dive' | 'technical_evaluation' | 'scenario_based' | 'wrap_up';
type InterviewType = 'technical' | 'coding' | 'behavioral' | 'frontend' | 'backend';

function determineInterviewStage(context: Message[]): InterviewStage {
  const messageCount = context.length;
  if (messageCount === 0) return 'introduction';
  if (messageCount < 4) return 'initial_assessment';
  if (messageCount < 10) return 'deep_dive';
  if (messageCount < 15) return 'technical_evaluation';
  if (messageCount < 20) return 'scenario_based';
  return 'wrap_up';
}

const stagePrompts: Record<InterviewStage, string> = {
  introduction: 'You are starting the interview. Introduce yourself as Mike and make the candidate comfortable.',
  initial_assessment: 'Assess candidate\'s general knowledge level. Ask broad but insightful questions.',
  deep_dive: 'Deep dive into specific concepts. Focus on understanding depth of knowledge.',
  technical_evaluation: 'Evaluate practical implementation understanding. Focus on real-world scenarios.',
  scenario_based: 'Present specific scenarios and evaluate problem-solving approach.',
  wrap_up: 'Begin concluding the interview. Ask final key questions and give candidate chance to ask questions.'
};

function getStagePrompt(stage: InterviewStage, type: InterviewType): string {
  const basePrompt = stagePrompts[stage];
  return `${basePrompt} Focus on ${type} concepts and scenarios.`;
}

export async function POST(request: Request) {
  try {
    const { message, context, type = 'technical' as InterviewType, warningCount } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const stage = determineInterviewStage(context);
    const stagePrompt = getStagePrompt(stage, type);
    const interviewContext = context.map((msg: Message) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const systemPrompt = `${INTERVIEWER_CONFIG.system_prompt}

Current Interview Context:
- Type: ${type}
- Focus: ${interviewPrompts[type as keyof typeof interviewPrompts].focus}
- Stage: ${stage}
- Warning Count: ${warningCount}

Interview Guidelines:
1. MAINTAIN consistent personality as Mike - experienced, knowledgeable, and professional
2. FOCUS on ${interviewPrompts[type as keyof typeof interviewPrompts].focus}
3. EVALUATE based on ${interviewPrompts[type as keyof typeof interviewPrompts].evaluation}
4. KEEP responses concise (2-3 sentences max)
5. ASK follow-up questions when answers are unclear
6. ADAPT difficulty based on candidate's responses
7. AVOID giving direct solutions
8. USE natural conversational tone

Stage-Specific Instructions:
${stagePrompt}

Evaluation Criteria:
- Technical accuracy
- Problem-solving approach
- Communication clarity
- Depth of understanding
- Real-world application

Response Format:
- Keep responses natural and conversational
- Include one clear follow-up question when appropriate
- Maintain professional yet approachable tone`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...interviewContext,
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    const reply = completion.choices[0]?.message?.content || "Could you please clarify that?";
    
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}